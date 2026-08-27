"""
LANDGUARD AI — Extensible Alert & Notification Dispatcher Subsystem (Phase 12)

Architecture Design:
- Pluggable channel architecture (Observer / Strategy pattern).
- Handles local system logging, dashboard WebSocket feeds, and extensible provider hooks.
- Extensible hooks for future notification channels:
    • SMS Gateway (e.g. Twilio / Fast2SMS)
    • WhatsApp Business API
    • Automated Voice / IVR Broadcast
    • Email / Webhooks
- Note: External network delivery is disabled by default in prototype mode to prevent unauthorized costs.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime

logger = logging.getLogger("landguard.alerts.dispatcher")


class BaseNotificationChannel(ABC):
    """Abstract base class for all notification delivery channels."""
    name: str = "base"
    is_enabled: bool = True

    @abstractmethod
    async def dispatch(self, alert_payload: Dict[str, Any]) -> bool:
        """Dispatches an alert through the designated communication channel."""
        pass


class SystemAuditLogChannel(BaseNotificationChannel):
    """Logs alert notifications to backend system audit logs and telemetry streams."""
    name: str = "system_log"
    is_enabled: bool = True

    async def dispatch(self, alert_payload: Dict[str, Any]) -> bool:
        node_id = alert_payload.get("node_id", "UNKNOWN")
        risk_level = alert_payload.get("risk_level", "UNKNOWN")
        reasons = alert_payload.get("trigger_reasons", [])
        reasons_str = ", ".join(reasons) if reasons else "Threshold breached"
        
        logger.info(
            f"[ALERT DISPATCH] [{risk_level}] Node {node_id} | Alert #{alert_payload.get('alert_id', 'ALT')} "
            f"| Reasons: {reasons_str} | Score: {alert_payload.get('risk_score', 0):.2f}"
        )
        return True


class MockSMSNotificationChannel(BaseNotificationChannel):
    """
    Extensible SMS notification provider stub.
    Reserved for Phase 13+ external cellular integration.
    """
    name: str = "sms_gateway"
    is_enabled: bool = False  # Explicitly disabled for prototype safety

    async def dispatch(self, alert_payload: Dict[str, Any]) -> bool:
        if not self.is_enabled:
            logger.debug(f"[SMS Provider (Inactive)] Alert ready for SMS dispatch to emergency responder list.")
            return False
        # Future: Call SMS Provider HTTP REST endpoint (e.g. Twilio / Fast2SMS)
        return True


class MockWhatsAppNotificationChannel(BaseNotificationChannel):
    """
    Extensible WhatsApp notification provider stub.
    Reserved for Meta Cloud API integration.
    """
    name: str = "whatsapp_gateway"
    is_enabled: bool = False

    async def dispatch(self, alert_payload: Dict[str, Any]) -> bool:
        if not self.is_enabled:
            logger.debug(f"[WhatsApp Provider (Inactive)] Alert ready for template message dispatch.")
            return False
        # Future: Call Meta WhatsApp Cloud API endpoint
        return True


class MockIVRNotificationChannel(BaseNotificationChannel):
    """
    Extensible Voice / IVR broadcast provider stub.
    Reserved for automated emergency voice calls.
    """
    name: str = "ivr_voice_gateway"
    is_enabled: bool = False

    async def dispatch(self, alert_payload: Dict[str, Any]) -> bool:
        if not self.is_enabled:
            logger.debug(f"[IVR Provider (Inactive)] Alert ready for automated voice telephony call queue.")
            return False
        # Future: Trigger IVR phone call campaign
        return True


class AlertDispatcher:
    """Coordinates alert delivery across registered notification channels."""

    def __init__(self):
        self.channels: List[BaseNotificationChannel] = [
            SystemAuditLogChannel(),
            MockSMSNotificationChannel(),
            MockWhatsAppNotificationChannel(),
            MockIVRNotificationChannel(),
        ]

    def register_channel(self, channel: BaseNotificationChannel):
        """Allows dynamically registering new notification adapters."""
        self.channels.append(channel)
        logger.info(f"Registered custom notification channel: {channel.name}")

    async def broadcast_alert(self, alert_payload: Dict[str, Any]):
        """Dispatches alert payload to all active notification channels."""
        for channel in self.channels:
            try:
                await channel.dispatch(alert_payload)
            except Exception as e:
                logger.error(f"Error dispatching alert via {channel.name}: {e}")


alert_dispatcher = AlertDispatcher()
