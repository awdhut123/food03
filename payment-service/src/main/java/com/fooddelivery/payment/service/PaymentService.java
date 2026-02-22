package com.fooddelivery.payment.service;

import com.fooddelivery.payment.dto.PaymentRequest;
import com.fooddelivery.payment.dto.PaymentResponse;
import com.fooddelivery.payment.entity.Payment;
import com.fooddelivery.payment.entity.PaymentStatus;
import com.fooddelivery.payment.exception.PaymentNotFoundException;
import com.fooddelivery.payment.kafka.PaymentEventProducer;
import com.fooddelivery.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final StripeService stripeService;
    private final PaymentEventProducer paymentEventProducer;

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        log.info("Processing payment for order: {}", request.getOrderId());

        // Create payment record
        Payment payment = Payment.builder()
                .orderId(request.getOrderId())
                .userId(request.getUserId())
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .status(PaymentStatus.PENDING)
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        try {
            String stripePaymentId;
            
            // Check if using real Stripe or simulation
            if (stripeSecretKey.equals("REPLACE_WITH_YOUR_SECRET_KEY")) {
                // Use simulated payment for development
                stripePaymentId = stripeService.simulatePayment(
                        request.getAmount(),
                        "Order #" + request.getOrderId()
                );
            } else {
                // Use real Stripe payment
                stripePaymentId = stripeService.processPayment(
                        request.getAmount(),
                        "usd",
                        "Order #" + request.getOrderId()
                );
            }

            savedPayment.setStripePaymentId(stripePaymentId);
            savedPayment.setStatus(PaymentStatus.COMPLETED);
            Payment completedPayment = paymentRepository.save(savedPayment);
            
            log.info("Payment completed for order: {} with Stripe ID: {}", 
                    request.getOrderId(), stripePaymentId);

            // Send payment success event via Kafka
            paymentEventProducer.sendPaymentEvent(completedPayment, "PAYMENT_COMPLETED");

            return mapToResponse(completedPayment);

        } catch (Exception e) {
            log.error("Payment failed for order: {}: {}", request.getOrderId(), e.getMessage());
            
            savedPayment.setStatus(PaymentStatus.FAILED);
            savedPayment.setErrorMessage(e.getMessage());
            Payment failedPayment = paymentRepository.save(savedPayment);

            // Send payment failed event
            paymentEventProducer.sendPaymentEvent(failedPayment, "PAYMENT_FAILED");

            return mapToResponse(failedPayment);
        }
    }

    public PaymentResponse getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found with id: " + id));
        return mapToResponse(payment);
    }

    public PaymentResponse getPaymentByOrderId(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found for order: " + orderId));
        return mapToResponse(payment);
    }

    @Transactional
    public PaymentResponse createCheckoutSession(PaymentRequest request) {
        log.info("Creating checkout session for order: {}", request.getOrderId());

        Payment payment = Payment.builder()
                .orderId(request.getOrderId())
                .userId(request.getUserId())
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .status(PaymentStatus.PENDING)
                .build();
        Payment savedPayment = paymentRepository.save(payment);

        Map<String, String> sessionInfo;
        if (stripeService.isSimulationMode()) {
            sessionInfo = stripeService.simulateCheckoutSession(
                    request.getAmount(), request.getOrderId(), request.getSuccessUrl());
        } else {
            sessionInfo = stripeService.createCheckoutSession(
                    request.getAmount(), request.getOrderId(),
                    request.getSuccessUrl(), request.getCancelUrl());
        }

        savedPayment.setStripePaymentId(sessionInfo.get("sessionId"));
        paymentRepository.save(savedPayment);

        PaymentResponse response = mapToResponse(savedPayment);
        response.setCheckoutUrl(sessionInfo.get("checkoutUrl"));
        response.setSessionId(sessionInfo.get("sessionId"));
        return response;
    }

    @Transactional
    public PaymentResponse verifyPayment(String sessionId) {
        log.info("Verifying payment for session: {}", sessionId);

        Payment payment = paymentRepository.findByStripePaymentId(sessionId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found for session: " + sessionId));

        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            return mapToResponse(payment);
        }

        boolean paid;
        if (stripeService.isSimulationMode()) {
            paid = true; // simulation always succeeds
        } else {
            String status = stripeService.verifyCheckoutSession(sessionId);
            paid = "paid".equals(status);
        }

        if (paid) {
            payment.setStatus(PaymentStatus.COMPLETED);
            Payment completed = paymentRepository.save(payment);
            try {
                paymentEventProducer.sendPaymentEvent(completed, "PAYMENT_COMPLETED");
            } catch (Exception e) {
                log.error("Failed to send payment event: {}", e.getMessage());
            }
            return mapToResponse(completed);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setErrorMessage("Payment not completed at Stripe");
            Payment failed = paymentRepository.save(payment);
            try {
                paymentEventProducer.sendPaymentEvent(failed, "PAYMENT_FAILED");
            } catch (Exception e) {
                log.error("Failed to send payment event: {}", e.getMessage());
            }
            return mapToResponse(failed);
        }
    }

    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private PaymentResponse mapToResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrderId())
                .userId(payment.getUserId())
                .amount(payment.getAmount())
                .status(payment.getStatus().name())
                .stripePaymentId(payment.getStripePaymentId())
                .paymentMethod(payment.getPaymentMethod())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
