package com.fooddelivery.order.dto;

import com.fooddelivery.order.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {
    private Long id;
    private Long userId;
    private Long restaurantId;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private String deliveryAddress;
    private String specialInstructions;
    private List<OrderItemResponse> items;
    private String checkoutUrl;
    private String sessionId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
