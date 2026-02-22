package com.fooddelivery.notification.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fooddelivery.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DeliveryEventConsumer {

    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    @KafkaListener(topics = "delivery-events", groupId = "notification-group")
    public void consumeDeliveryEvent(String message) {
        try {
            log.info("Received delivery event: {}", message);
            JsonNode event = objectMapper.readTree(message);
            
            String eventType = event.get("eventType").asText();
            Long orderId = event.get("orderId").asLong();
            
            switch (eventType) {
                case "DELIVERY_ASSIGNED":
                    notificationService.sendDeliveryAssignedNotification(orderId);
                    break;
                case "DELIVERY_STATUS_UPDATED":
                    String status = event.get("status").asText();
                    notificationService.sendDeliveryStatusNotification(orderId, status);
                    break;
                case "DELIVERY_COMPLETED":
                    notificationService.sendDeliveryCompletedNotification(orderId);
                    break;
                default:
                    log.warn("Unknown delivery event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Error processing delivery event: {}", e.getMessage());
        }
    }
}
