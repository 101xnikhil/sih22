#ifndef LANDGUARD_BUFFER_MANAGER_H
#define LANDGUARD_BUFFER_MANAGER_H

#include <Arduino.h>
#include "config.h"

class BufferManager {
private:
    String buffer[MAX_OFFLINE_BUFFER_SIZE];
    uint8_t head;
    uint8_t tail;
    uint8_t current_count;

public:
    BufferManager();

    bool push(const String& json_payload);
    bool pop(String& out_payload);
    bool peek(String& out_payload);

    uint8_t count() const { return current_count; }
    bool isEmpty() const { return current_count == 0; }
    bool isFull() const { return current_count >= MAX_OFFLINE_BUFFER_SIZE; }
    void clear();
};

#endif // LANDGUARD_BUFFER_MANAGER_H
