#ifndef LANDGUARD_GATEWAY_HTTP_CLIENT_H
#define LANDGUARD_GATEWAY_HTTP_CLIENT_H

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "lora_rx.h"
#include "buffer_manager.h"

class GatewayHttpClient {
private:
    const char* ssid;
    const char* password;
    const char* backend_url;

    BufferManager& buffer;
    uint32_t last_wifi_check_ms;
    uint32_t last_flush_ms;
    bool was_connected;

public:
    GatewayHttpClient(BufferManager& buf_mgr,
                      const char* wifi_ssid = WIFI_SSID,
                      const char* wifi_pass = WIFI_PASSWORD,
                      const char* url = BACKEND_URL);

    void begin();
    void maintainConnection();
    bool isConnected() const;

    // Convert packet to JSON string
    String buildJsonPayload(const DecodedPacket& packet);

    // Forward packet: tries HTTP POST, buffers if offline
    bool forwardTelemetry(const DecodedPacket& packet);

    // Post raw JSON string to backend
    bool postJson(const String& json_str);

    // Flush offline queue if online
    void flushOfflineBuffer();
};

#endif // LANDGUARD_GATEWAY_HTTP_CLIENT_H
