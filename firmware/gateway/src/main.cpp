/**
 * ============================================================================
 * LANDGUARD AI — ESP32 LoRa Gateway Firmware (LG-GW01)
 * ============================================================================
 * 
 * Hardware Architecture:
 * - ESP32-WROOM-32 Microcontroller
 * - Semtech SX1278 433MHz LoRa Transceiver (SPI: SCK=18, MISO=19, MOSI=23, CS=5, RST=16, DIO0=4)
 * - Wi-Fi Station Interface (2.4 GHz 802.11 b/g/n)
 * 
 * Functionality:
 * 1. Continuous LoRa packet reception & CCITT-16 CRC verification
 * 2. Instant ACK packet dispatch to Sensor Node
 * 3. Sequence tracking & duplicate packet rejection
 * 4. Wi-Fi reconnection manager with offline FIFO ring buffering
 * 5. Automatic HTTP POST forwarding to FastAPI Backend (POST /api/telemetry)
 * 
 * ⚠️ PROTOTYPE GATEWAY (SIH 2026)
 * ============================================================================
 */

#include <Arduino.h>
#include "config.h"
#include "lora_rx.h"
#include "buffer_manager.h"
#include "http_client.h"

// System Instances
BufferManager      bufferManager;
LoRaReceiver       loraReceiver;
GatewayHttpClient  httpClient(bufferManager, WIFI_SSID, WIFI_PASSWORD, BACKEND_URL);

void printGatewayBanner() {
    Serial.println();
    Serial.println(F("================================================================="));
    Serial.println(F("    __    ___    _   ______  ________  _____    ____  ____       "));
    Serial.println(F("   / /   /   |  / | / / __ \\/ ____/ / / /   |  / __ \\/ __ \\      "));
    Serial.println(F("  / /   / /| | /  |/ / / / / / __/ / / / /| | / /_/ / / / /      "));
    Serial.println(F(" / /___/ ___ |/ /|  / /_/ / /_/ / /_/ / ___ |/ _, _/ /_/ /       "));
    Serial.println(F("/_____/_/  |_/_/ |_/_____/\\____/\\____/_/  |_/_/ |_/_____/        "));
    Serial.println(F("      LoRa-TO-WIFI EDGE IOT GATEWAY FOR LANDGUARD AI             "));
    Serial.println(F("================================================================="));
    Serial.printf(" Gateway ID:       %s\n", GATEWAY_ID);
    Serial.printf(" Firmware Version: %s\n", GATEWAY_FW_VERSION);
    Serial.printf(" Target Backend:   %s\n", BACKEND_URL);
    Serial.printf(" LoRa RF Channel:  %.1f MHz (SX1278)\n", (float)(LORA_FREQUENCY_HZ / 1E6));
    Serial.println(F("================================================================="));
    Serial.println();
}

void setup() {
    Serial.begin(115200);
    delay(1000);
    printGatewayBanner();

    // 1. Initialize Status LED
    pinMode(PIN_STATUS_LED, OUTPUT);
    digitalWrite(PIN_STATUS_LED, HIGH);

    // 2. Initialize LoRa Radio
    Serial.println(F("[INIT] Initializing LoRa Receiver..."));
    if (loraReceiver.begin()) {
        Serial.println(F("[INIT] LoRa Receiver ready."));
    } else {
        Serial.println(F("[WARN] LoRa Receiver offline. Check SPI wiring."));
    }

    // 3. Initialize Wi-Fi & HTTP Client
    Serial.println(F("[INIT] Initializing Wi-Fi Station..."));
    httpClient.begin();

    digitalWrite(PIN_STATUS_LED, LOW);
    Serial.println(F("[STATUS] Gateway operating in continuous bridge mode...\n"));
}

void loop() {
    // 1. Maintain Wi-Fi Connection & Flush Cached Offline Frames
    httpClient.maintainConnection();

    // 2. Poll LoRa Transceiver for Incoming Packets
    DecodedPacket packet;
    if (loraReceiver.receivePacket(packet)) {
        if (packet.is_valid) {
            // A. Send immediate ACK back to the sensor node
            loraReceiver.sendAck(packet.node_id, packet.sequence);

            // B. If not a duplicate packet, forward to FastAPI Backend
            if (!packet.is_duplicate) {
                httpClient.forwardTelemetry(packet);
            }
        }
    }

    delay(10);
}
