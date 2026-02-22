package com.fooddelivery.payment.controller;

import com.fooddelivery.payment.dto.PaymentRequest;
import com.fooddelivery.payment.dto.PaymentResponse;
import com.fooddelivery.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/process")
    public ResponseEntity<PaymentResponse> processPayment(@Valid @RequestBody PaymentRequest request) {
        log.info("Process payment request for order: {}", request.getOrderId());
        PaymentResponse response = paymentService.processPayment(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/create-checkout-session")
    public ResponseEntity<PaymentResponse> createCheckoutSession(@Valid @RequestBody PaymentRequest request) {
        log.info("Create checkout session for order: {}", request.getOrderId());
        PaymentResponse response = paymentService.createCheckoutSession(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify/{sessionId}")
    public ResponseEntity<PaymentResponse> verifyPayment(@PathVariable String sessionId) {
        log.info("Verify payment for session: {}", sessionId);
        PaymentResponse response = paymentService.verifyPayment(sessionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable Long id) {
        log.info("Get payment by id: {}", id);
        PaymentResponse response = paymentService.getPaymentById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<PaymentResponse> getPaymentByOrderId(@PathVariable Long orderId) {
        log.info("Get payment for order: {}", orderId);
        PaymentResponse response = paymentService.getPaymentByOrderId(orderId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getAllPayments() {
        log.info("Get all payments");
        return ResponseEntity.ok(paymentService.getAllPayments());
    }
}
