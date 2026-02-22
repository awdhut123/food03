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
public class PaymentEventConsumer {

    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    @KafkaListener(topics = "payment-events", groupId = "notification-group")
    public void consumePaymentEvent(String message) {
        try {
            log.info("Received payment event: {}", message);
            JsonNode event = objectMapper.readTree(message);
            
            String eventType = event.get("eventType").asText();
            Long orderId = event.get("orderId").asLong();
            Long userId = event.has("userId") ? event.get("userId").asLong() : null;
            
            switch (eventType) {
                case "PAYMENT_COMPLETED":
                    notificationService.sendPaymentSuccessNotification(orderId, userId);
                    break;
                case "PAYMENT_FAILED":
                    notificationService.sendPaymentFailedNotification(orderId, userId);
                    break;
                default:
                    log.warn("Unknown payment event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Error processing payment event: {}", e.getMessage());
        }
    }
}
