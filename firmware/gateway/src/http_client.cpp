#include "http_client.h"

GatewayHttpClient::GatewayHttpClient(BufferManager& buf_mgr, const char* wifi_ssid, const char* wifi_pass, const char* url)
    : buffer(buf_mgr), ssid(wifi_ssid), password(wifi_pass), backend_url(url),
      last_wifi_check_ms(0), last_flush_ms(0), was_connected(false) {}

void GatewayHttpClient::begin() {
    Serial.printf("[WiFi] Initiating connection to SSID: '%s'...\n", ssid);
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    last_wifi_check_ms = millis();
}

void GatewayHttpClient::maintainConnection() {
    uint32_t now = millis();

    if (now - last_wifi_check_ms >= WIFI_RECONNECT_INTERVAL_MS) {
        last_wifi_check_ms = now;

        if (WiFi.status() == WL_CONNECTED) {
            if (!was_connected) {
                was_connected = true;
                Serial.printf("[WiFi] Connected! IP Address: %s (RSSI: %d dBm)\n", 
                              WiFi.localIP().toString().c_str(), WiFi.RSSI());
                Serial.printf("[HTTP] Target Backend: %s\n", backend_url);
            }

            // Flush offline buffer
            if (buffer.count() > 0 && (now - last_flush_ms >= BUFFER_FLUSH_INTERVAL_MS)) {
                last_flush_ms = now;
                flushOfflineBuffer();
            }

        } else {
            if (was_connected) {
                was_connected = false;
                Serial.println(F("[WiFi-WARN] Wi-Fi connection lost. Gateway switching to offline cache mode."));
            }
            // Non-blocking reconnect
            WiFi.reconnect();
        }
    }
}

bool GatewayHttpClient::isConnected() const {
    return (WiFi.status() == WL_CONNECTED);
}

String GatewayHttpClient::buildJsonPayload(const DecodedPacket& p) {
    JsonDocument doc;

    doc["node_id"] = p.node_id;
    doc["seq_num"] = p.sequence;
    doc["soil_moisture"] = round(p.soil_moisture_pct * 10.0f) / 10.0f;
    doc["soil_moisture_raw"] = p.soil_moisture_raw;
    doc["rainfall"] = round(p.rainfall_pct * 10.0f) / 10.0f;
    doc["rainfall_24h"] = round(p.rainfall_pct * 0.8f * 10.0f) / 10.0f;
    doc["rain_detected"] = p.rain_detected;
    doc["tilt_angle"] = round(p.tilt_angle_deg * 100.0f) / 100.0f;
    doc["tilt_rate"] = round(p.tilt_rate_deg_min * 1000.0f) / 1000.0f;
    doc["accel_x"] = round(p.accel_x_g * 100.0f) / 100.0f;
    doc["accel_y"] = round(p.accel_y_g * 100.0f) / 100.0f;
    doc["accel_z"] = round(p.accel_z_g * 100.0f) / 100.0f;
    doc["battery"] = round(p.battery_pct);
    doc["battery_mv"] = p.battery_mv;
    doc["rssi"] = p.rssi_dbm;
    doc["snr"] = round(p.snr_db * 10.0f) / 10.0f;

    String jsonStr;
    serializeJson(doc, jsonStr);
    return jsonStr;
}

bool GatewayHttpClient::postJson(const String& json_str) {
    if (!isConnected()) return false;

    HTTPClient http;
    http.begin(backend_url);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(HTTP_TIMEOUT_MS);

    int http_code = http.POST(json_str);
    String response = "";

    if (http_code > 0) {
        response = http.getString();
        Serial.printf("[HTTP] Telemetry uploaded to %s\n", backend_url);
        Serial.printf("[HTTP] Status: %d\n", http_code);
        http.end();
        return (http_code == 200 || http_code == 201);
    } else {
        Serial.printf("[HTTP-ERR] POST failed, error: %s\n", http.errorToString(http_code).c_str());
        http.end();
        return false;
    }
}

bool GatewayHttpClient::forwardTelemetry(const DecodedPacket& packet) {
    String json_str = buildJsonPayload(packet);

    if (isConnected()) {
        bool ok = postJson(json_str);
        if (ok) return true;
        // If HTTP post failed despite Wi-Fi connection, buffer packet
        buffer.push(json_str);
        return false;
    } else {
        // Offline: buffer for later delivery
        buffer.push(json_str);
        return false;
    }
}

void GatewayHttpClient::flushOfflineBuffer() {
    if (!isConnected() || buffer.isEmpty()) return;

    String cached_payload;
    if (buffer.peek(cached_payload)) {
        bool ok = postJson(cached_payload);
        if (ok) {
            buffer.pop(cached_payload);
            Serial.printf("[BUFFER-FLUSH] Delivered cached packet (Remaining in queue: %u)\n", 
                          buffer.count());
        }
    }
}
