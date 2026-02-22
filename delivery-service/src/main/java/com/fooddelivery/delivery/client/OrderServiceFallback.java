package com.fooddelivery.delivery.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class OrderServiceFallback implements OrderServiceClient {

    @Override
    public void updateOrderStatus(Long id, String status) {
        log.error("Order service is unavailable. Failed to update order {} status to {}", id, status);
    }
}
