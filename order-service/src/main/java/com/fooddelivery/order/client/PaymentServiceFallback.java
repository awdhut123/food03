package com.fooddelivery.order.client;

import com.fooddelivery.order.dto.PaymentRequest;
import com.fooddelivery.order.dto.PaymentResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class PaymentServiceFallback implements PaymentServiceClient {

    @Override
    public PaymentResponse processPayment(PaymentRequest request) {
        log.error("Payment service is unavailable. Fallback triggered for order: {}", request.getOrderId());
        return PaymentResponse.builder()
                .orderId(request.getOrderId())
                .status("FAILED")
                .build();
    }

    @Override
    public PaymentResponse createCheckoutSession(PaymentRequest request) {
        log.error("Payment service is unavailable. Checkout session fallback for order: {}", request.getOrderId());
        return PaymentResponse.builder()
                .orderId(request.getOrderId())
                .status("FAILED")
                .build();
    }
}
