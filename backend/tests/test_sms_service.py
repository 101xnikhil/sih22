import pytest
import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, patch, MagicMock
import httpx

from app.config import settings
from app.models.alert import Alert
from app.services.sms_service import sms_service, SMSService, FAST2SMS_URL


def test_sms_service_disabled_noop():
    """Verify that when SMS_ALERTS_ENABLED is False, send_sms performs a clean no-op without HTTP calls."""
    async def _run():
        orig_enabled = settings.SMS_ALERTS_ENABLED
        try:
            settings.SMS_ALERTS_ENABLED = False
            with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
                result = await sms_service.send_sms(numbers=["9876543210"], message="Test")
                assert result["sent"] is False
                assert result["status"] == "DISABLED"
                assert "disabled" in result["error"].lower()
                mock_post.assert_not_called()
        finally:
            settings.SMS_ALERTS_ENABLED = orig_enabled

    asyncio.run(_run())


def test_sms_service_missing_config_noop():
    """Verify missing API key or empty recipients skips cleanly without raising exceptions."""
    async def _run():
        orig_enabled = settings.SMS_ALERTS_ENABLED
        orig_key = settings.FAST2SMS_API_KEY
        try:
            settings.SMS_ALERTS_ENABLED = True
            settings.FAST2SMS_API_KEY = ""

            # Case 1: Missing API Key
            with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
                result = await sms_service.send_sms(numbers=["9876543210"], message="Test")
                assert result["sent"] is False
                assert result["status"] == "DISABLED"
                assert "API key" in result["error"]
                mock_post.assert_not_called()

            # Case 2: No valid recipients
            settings.FAST2SMS_API_KEY = "test_key"
            with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
                result = await sms_service.send_sms(numbers=[], message="Test")
                assert result["sent"] is False
                assert result["status"] == "NO_RECIPIENTS"
                mock_post.assert_not_called()

        finally:
            settings.SMS_ALERTS_ENABLED = orig_enabled
            settings.FAST2SMS_API_KEY = orig_key

    asyncio.run(_run())


def test_sms_service_successful_batch_send():
    """Verify that numbers are comma-joined and dispatched in a single batch to Fast2SMS route 'q'."""
    async def _run():
        orig_enabled = settings.SMS_ALERTS_ENABLED
        orig_key = settings.FAST2SMS_API_KEY
        try:
            settings.SMS_ALERTS_ENABLED = True
            settings.FAST2SMS_API_KEY = "fake_fast2sms_key"

            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "return": True,
                "request_id": "req_12345",
                "message": ["SMS sent successfully."],
            }

            with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
                mock_post.return_value = mock_resp

                recipients = ["+91 98765 43210", "9123456789"]
                result = await sms_service.send_sms(numbers=recipients, message="🚨 Urgent Evacuation Alert")

                assert result["sent"] is True
                assert result["status"] == "DELIVERED"
                assert result["recipients"] == ["9876543210", "9123456789"]

                mock_post.assert_called_once()
                call_kwargs = mock_post.call_args.kwargs
                json_body = call_kwargs["json"]
                assert json_body["route"] == "q"
                assert json_body["numbers"] == "9876543210,9123456789"
                assert "[ALERT]" in json_body["message"]  # Emoji replaced for GSM compliance
                assert call_kwargs["headers"]["authorization"] == "fake_fast2sms_key"
        finally:
            settings.SMS_ALERTS_ENABLED = orig_enabled
            settings.FAST2SMS_API_KEY = orig_key

    asyncio.run(_run())


def test_sms_service_daily_quota_limit():
    """Verify that reaching SMS_MAX_PER_DAY skips dispatch and logs warning without erroring."""
    async def _run():
        service = SMSService()
        orig_enabled = settings.SMS_ALERTS_ENABLED
        orig_key = settings.FAST2SMS_API_KEY
        orig_max = settings.SMS_MAX_PER_DAY
        try:
            settings.SMS_ALERTS_ENABLED = True
            settings.FAST2SMS_API_KEY = "fake_key"
            settings.SMS_MAX_PER_DAY = 2

            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {"return": True, "message": ["Sent"]}

            with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
                mock_post.return_value = mock_resp

                # Send 1: OK
                res1 = await service.send_sms(["9876543210"], "Msg 1")
                assert res1["sent"] is True

                # Send 2: OK (Reaches limit)
                res2 = await service.send_sms(["9876543210"], "Msg 2")
                assert res2["sent"] is True

                # Send 3: Quota exceeded -> Graceful skip
                res3 = await service.send_sms(["9876543210"], "Msg 3")
                assert res3["sent"] is False
                assert res3["status"] == "QUOTA_EXCEEDED"
                assert "quota limit" in res3["error"]
                # Fast2SMS post called only twice
                assert mock_post.call_count == 2
        finally:
            settings.SMS_ALERTS_ENABLED = orig_enabled
            settings.FAST2SMS_API_KEY = orig_key
            settings.SMS_MAX_PER_DAY = orig_max

    asyncio.run(_run())


def test_sms_service_network_retry():
    """Verify 1 retry on network disconnect/timeout, failing cleanly after."""
    async def _run():
        orig_enabled = settings.SMS_ALERTS_ENABLED
        orig_key = settings.FAST2SMS_API_KEY
        try:
            settings.SMS_ALERTS_ENABLED = True
            settings.FAST2SMS_API_KEY = "fake_key"

            with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post, \
                 patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
                mock_post.side_effect = httpx.ConnectError("Connection refused to fast2sms")

                result = await sms_service.send_sms(["9876543210"], "Test Msg")
                assert result["sent"] is False
                assert result["status"] == "FAILED"
                assert "Connection refused" in result["error"]
                assert mock_post.call_count == 2  # Original attempt + 1 retry
                mock_sleep.assert_called_once_with(1.0)
        finally:
            settings.SMS_ALERTS_ENABLED = orig_enabled
            settings.FAST2SMS_API_KEY = orig_key

    asyncio.run(_run())


def test_send_alert_sms_severity_filtering(db_session):
    """Verify that MODERATE/WARNING alerts do not trigger SMS when SMS_MIN_SEVERITY='HIGH'."""
    async def _run():
        orig_enabled = settings.SMS_ALERTS_ENABLED
        orig_key = settings.FAST2SMS_API_KEY
        orig_min = settings.SMS_MIN_SEVERITY
        orig_recipients = settings.ALERT_SMS_RECIPIENTS
        try:
            settings.SMS_ALERTS_ENABLED = True
            settings.FAST2SMS_API_KEY = "fake_key"
            settings.SMS_MIN_SEVERITY = "HIGH"
            settings.ALERT_SMS_RECIPIENTS = "9876543210"

            # 1. Create a MODERATE / WARNING alert
            alert_mod = Alert(
                node_id="LG-N01",
                timestamp=datetime.utcnow(),
                severity="warning",
                title="Moderate Advisory",
                message="Increased monitoring advised.",
                risk_score=0.45,
                risk_level="MODERATE",
                acknowledged=False,
                created_at=datetime.utcnow(),
                sms_sent=False,
            )
            db_session.add(alert_mod)
            db_session.commit()
            db_session.refresh(alert_mod)

            with patch.object(sms_service, "send_sms", new_callable=AsyncMock) as mock_send:
                await sms_service.send_alert_sms(alert_mod, db=db_session)
                mock_send.assert_not_called()
                db_session.refresh(alert_mod)
                assert alert_mod.sms_sent is False

            # 2. Create a CRITICAL alert -> Triggers SMS
            alert_crit = Alert(
                node_id="LG-N01",
                timestamp=datetime.utcnow(),
                severity="critical",
                title="CRITICAL HAZARD",
                message="Slope failure imminent.",
                risk_score=0.92,
                risk_level="CRITICAL",
                acknowledged=False,
                created_at=datetime.utcnow(),
                sms_sent=False,
            )
            db_session.add(alert_crit)
            db_session.commit()
            db_session.refresh(alert_crit)

            with patch.object(sms_service, "send_sms", new_callable=AsyncMock) as mock_send:
                mock_send.return_value = {"sent": True, "status": "DELIVERED", "error": None}
                await sms_service.send_alert_sms(alert_crit, db=db_session)
                mock_send.assert_called_once()
                
                db_session.refresh(alert_crit)
                assert alert_crit.sms_sent is True
                assert alert_crit.sms_sent_at is not None
                assert alert_crit.sms_error is None

        finally:
            settings.SMS_ALERTS_ENABLED = orig_enabled
            settings.FAST2SMS_API_KEY = orig_key
            settings.SMS_MIN_SEVERITY = orig_min
            settings.ALERT_SMS_RECIPIENTS = orig_recipients

    asyncio.run(_run())


def test_api_sms_status_and_test_endpoints(client):
    """Test GET /api/v1/alerts/sms-status and POST /api/v1/alerts/test-sms."""
    # 1. GET /api/v1/alerts/sms-status
    res = client.get("/api/v1/alerts/sms-status")
    assert res.status_code == 200
    data = res.json()
    assert "enabled" in data
    assert "recipients_count" in data
    assert "min_severity" in data
    assert "sent_today" in data
    assert "max_per_day" in data
    assert "quota_remaining" in data

    # 2. POST /api/v1/alerts/test-sms with mocked dispatch
    with patch.object(sms_service, "send_sms", new_callable=AsyncMock) as mock_send:
        mock_send.return_value = {
            "sent": True,
            "status": "DELIVERED",
            "recipients": ["9876543210"],
            "response": {"return": True},
            "error": None,
        }
        res = client.post("/api/v1/alerts/test-sms")
        assert res.status_code == 200
        post_data = res.json()
        assert post_data["status"] == "success"
        assert post_data["result"]["sent"] is True
