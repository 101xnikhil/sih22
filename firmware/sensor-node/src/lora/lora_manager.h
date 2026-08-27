#ifndef LANDGUARD_LORA_MANAGER_H
#define LANDGUARD_LORA_MANAGER_H

#include <Arduino.h>
#include <SPI.h>
#include <LoRa.h>
#include "../config.h"
#include "../telemetry/telemetry.h"

class LoRaManager {
private:
    bool is_ready;

    bool waitForAck(const char* target_node_id, uint32_t expected_seq, uint32_t timeout_ms = LORA_ACK_TIMEOUT_MS);

public:
    LoRaManager();

    bool begin();
    bool isReady() const { return is_ready; }

    // Transmit telemetry packet with automatic ACK listening and retry mechanism
    bool sendTelemetry(const TelemetryReport& report, bool require_ack = true, uint8_t max_retries = LORA_MAX_TX_RETRIES);
    bool sendJsonTelemetry(const TelemetryReport& report);
};

#endif // LANDGUARD_LORA_MANAGER_H
