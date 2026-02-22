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
public class OrderEventConsumer {

    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    @KafkaListener(topics = "order-events", groupId = "notification-group")
    public void consumeOrderEvent(String message) {
        try {
            log.info("Received order event: {}", message);
            JsonNode event = objectMapper.readTree(message);
            
            String eventType = event.get("eventType").asText();
            Long orderId = event.get("orderId").asLong();
            Long userId = event.has("userId") ? event.get("userId").asLong() : null;
            
            switch (eventType) {
                case "ORDER_CREATED":
                    notificationService.sendOrderCreatedNotification(orderId, userId);
                    break;
                case "PAYMENT_SUCCESSFUL":
                    notificationService.sendPaymentSuccessNotification(orderId, userId);
                    break;
                case "ORDER_STATUS_UPDATED":
                    String status = event.get("orderStatus").asText();
                    notificationService.sendOrderStatusNotification(orderId, userId, status);
                    break;
                case "ORDER_DELIVERED":
                    notificationService.sendOrderDeliveredNotification(orderId, userId);
                    break;
                case "ORDER_CANCELLED":
                    notificationService.sendOrderCancelledNotification(orderId, userId);
                    break;
                default:
                    log.warn("Unknown order event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Error processing order event: {}", e.getMessage());
        }
    }
}
