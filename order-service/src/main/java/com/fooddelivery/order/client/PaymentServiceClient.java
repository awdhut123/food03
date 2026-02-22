package com.fooddelivery.order.client;

import com.fooddelivery.order.dto.PaymentRequest;
import com.fooddelivery.order.dto.PaymentResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * OpenFeign client for Payment Service
 * 
 * Why OpenFeign over RestTemplate:
 * 1. Declarative approach - define API contracts as interfaces
 * 2. Automatic load balancing with Eureka integration
 * 3. Built-in circuit breaker support with Resilience4j
 * 4. Cleaner, more maintainable code - no boilerplate HTTP client code
 * 5. Type safety - compile-time checking of API contracts
 * 6. Automatic serialization/deserialization
 */
@FeignClient(name = "PAYMENT-SERVICE", fallback = PaymentServiceFallback.class)
public interface PaymentServiceClient {

    @PostMapping("/api/payments/process")
    PaymentResponse processPayment(@RequestBody PaymentRequest request);

    @PostMapping("/api/payments/create-checkout-session")
    PaymentResponse createCheckoutSession(@RequestBody PaymentRequest request);
}
