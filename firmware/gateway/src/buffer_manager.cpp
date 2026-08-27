#include "buffer_manager.h"

BufferManager::BufferManager() : head(0), tail(0), current_count(0) {}

bool BufferManager::push(const String& json_payload) {
    if (isFull()) {
        // Overwrite oldest packet if buffer overflows
        tail = (tail + 1) % MAX_OFFLINE_BUFFER_SIZE;
        current_count--;
        Serial.println(F("[BUFFER-WARN] Offline buffer full. Dropped oldest frame."));
    }

    buffer[head] = json_payload;
    head = (head + 1) % MAX_OFFLINE_BUFFER_SIZE;
    current_count++;

    Serial.printf("[BUFFER] Cached offline frame (Queue Depth: %u/%u)\n", 
                  current_count, MAX_OFFLINE_BUFFER_SIZE);
    return true;
}

bool BufferManager::pop(String& out_payload) {
    if (isEmpty()) return false;

    out_payload = buffer[tail];
    tail = (tail + 1) % MAX_OFFLINE_BUFFER_SIZE;
    current_count--;
    return true;
}

bool BufferManager::peek(String& out_payload) {
    if (isEmpty()) return false;
    out_payload = buffer[tail];
    return true;
}

void BufferManager::clear() {
    head = 0;
    tail = 0;
    current_count = 0;
}
