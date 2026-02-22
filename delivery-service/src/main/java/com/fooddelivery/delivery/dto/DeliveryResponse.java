package com.fooddelivery.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryResponse {
    private Long id;
    private Long orderId;
    private Long agentId;
    private String agentName;
    private Long restaurantId;
    private String deliveryAddress;
    private String status;
    private LocalDateTime pickupTime;
    private LocalDateTime deliveryTime;
    private LocalDateTime estimatedDeliveryTime;
    private LocalDateTime createdAt;
}
