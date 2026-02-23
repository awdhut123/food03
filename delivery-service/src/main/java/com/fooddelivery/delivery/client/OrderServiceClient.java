package com.fooddelivery.delivery.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "ORDER-SERVICE", fallback = OrderServiceFallback.class)
public interface OrderServiceClient {

    @PutMapping("/api/orders/{id}/status")
    void updateOrderStatus(@PathVariable("id") Long id, @RequestParam("status") String status);
}
