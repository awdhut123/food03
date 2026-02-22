package com.fooddelivery.delivery.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fooddelivery.delivery.entity.Delivery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryEventProducer {

    private static final String TOPIC = "delivery-events";
    
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void sendDeliveryEvent(Delivery delivery, String eventType) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", eventType);
            event.put("deliveryId", delivery.getId());
            event.put("orderId", delivery.getOrderId());
            event.put("agentId", delivery.getAgentId());
            event.put("status", delivery.getStatus().name());
            event.put("timestamp", LocalDateTime.now().toString());

            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, String.valueOf(delivery.getOrderId()), message);
            log.info("Delivery event sent to Kafka: {} for order: {}", eventType, delivery.getOrderId());
        } catch (Exception e) {
            log.error("Error sending delivery event to Kafka: {}", e.getMessage());
        }
    }
}
