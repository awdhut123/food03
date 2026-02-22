package com.fooddelivery.order.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderEvent {
    private String eventType;
    private Long orderId;
    private Long userId;
    private Long restaurantId;
    private String orderStatus;
    private BigDecimal totalAmount;
    private String deliveryAddress;
    private LocalDateTime timestamp;
}
