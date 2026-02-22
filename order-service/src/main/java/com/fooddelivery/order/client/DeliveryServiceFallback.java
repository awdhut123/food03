package com.fooddelivery.order.client;

import com.fooddelivery.order.dto.DeliveryRequest;
import com.fooddelivery.order.dto.DeliveryResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class DeliveryServiceFallback implements DeliveryServiceClient {

    @Override
    public DeliveryResponse assignDelivery(DeliveryRequest request) {
        log.error("Delivery service is unavailable. Fallback triggered for order: {}", request.getOrderId());
        return DeliveryResponse.builder()
                .orderId(request.getOrderId())
                .status("PENDING")
                .build();
    }
}
