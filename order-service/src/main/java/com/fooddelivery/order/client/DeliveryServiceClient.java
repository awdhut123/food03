package com.fooddelivery.order.client;

import com.fooddelivery.order.dto.DeliveryRequest;
import com.fooddelivery.order.dto.DeliveryResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * OpenFeign client for Delivery Service
 * Used for synchronous communication to initiate delivery after payment
 */
@FeignClient(name = "DELIVERY-SERVICE", fallback = DeliveryServiceFallback.class)
public interface DeliveryServiceClient {

    @PostMapping("/api/delivery/assign")
    DeliveryResponse assignDelivery(@RequestBody DeliveryRequest request);
}
