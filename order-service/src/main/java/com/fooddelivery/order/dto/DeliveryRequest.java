package com.fooddelivery.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryRequest {
    private Long orderId;
    private Long restaurantId;
    private String deliveryAddress;
    private String customerPhone;
}
