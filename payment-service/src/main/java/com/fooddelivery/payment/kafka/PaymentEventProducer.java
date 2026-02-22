package com.fooddelivery.payment.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fooddelivery.payment.entity.Payment;
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
public class PaymentEventProducer {

    private static final String TOPIC = "payment-events";
    
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void sendPaymentEvent(Payment payment, String eventType) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", eventType);
            event.put("paymentId", payment.getId());
            event.put("orderId", payment.getOrderId());
            event.put("userId", payment.getUserId());
            event.put("amount", payment.getAmount());
            event.put("status", payment.getStatus().name());
            event.put("timestamp", LocalDateTime.now().toString());

            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, String.valueOf(payment.getOrderId()), message);
            log.info("Payment event sent to Kafka: {} for order: {}", eventType, payment.getOrderId());
        } catch (Exception e) {
            log.error("Error sending payment event to Kafka: {}", e.getMessage());
        }
    }
}
