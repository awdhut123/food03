package com.fooddelivery.payment.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.checkout.Session;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class StripeService {

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    public boolean isSimulationMode() {
        return "REPLACE_WITH_YOUR_SECRET_KEY".equals(stripeSecretKey);
    }

    /**
     * Create a Stripe Checkout Session for the given order.
     * Returns a map with "sessionId" and "checkoutUrl".
     */
    public Map<String, String> createCheckoutSession(BigDecimal amount, Long orderId,
                                                      String successUrl, String cancelUrl) {
        try {
            long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(successUrl)
                    .setCancelUrl(cancelUrl)
                    .addLineItem(SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency("usd")
                                    .setUnitAmount(amountInCents)
                                    .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                            .setName("Order #" + orderId)
                                            .build())
                                    .build())
                            .build())
                    .putMetadata("orderId", String.valueOf(orderId))
                    .build();

            Session session = Session.create(params);
            log.info("Stripe Checkout Session created: {} for order: {}", session.getId(), orderId);

            Map<String, String> result = new HashMap<>();
            result.put("sessionId", session.getId());
            result.put("checkoutUrl", session.getUrl());
            return result;
        } catch (StripeException e) {
            log.error("Stripe checkout session creation failed: {}", e.getMessage());
            throw new RuntimeException("Failed to create checkout session: " + e.getMessage());
        }
    }

    /**
     * Verify a Stripe Checkout Session by session ID.
     * Returns the payment status.
     */
    public String verifyCheckoutSession(String sessionId) {
        try {
            Session session = Session.retrieve(sessionId);
            log.info("Stripe session {} status: {}", sessionId, session.getPaymentStatus());
            return session.getPaymentStatus(); // "paid", "unpaid", "no_payment_required"
        } catch (StripeException e) {
            log.error("Stripe session verification failed: {}", e.getMessage());
            throw new RuntimeException("Failed to verify session: " + e.getMessage());
        }
    }

    /**
     * Simulated checkout for development/testing.
     * Returns fake session ID and a redirect URL that auto-confirms.
     */
    public Map<String, String> simulateCheckoutSession(BigDecimal amount, Long orderId,
                                                        String successUrl) {
        log.info("Simulating checkout session for order: {} amount: {}", orderId, amount);
        String sessionId = "sim_session_" + System.currentTimeMillis();
        // In simulation mode, the checkoutUrl goes directly to the success page
        String checkoutUrl = successUrl.replace("{CHECKOUT_SESSION_ID}", sessionId);

        Map<String, String> result = new HashMap<>();
        result.put("sessionId", sessionId);
        result.put("checkoutUrl", checkoutUrl);
        return result;
    }

    /**
     * Process payment using Stripe PaymentIntent (legacy, kept for reference)
     */
    public String processPayment(BigDecimal amount, String currency, String description) {
        try {
            long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency(currency)
                    .setDescription(description)
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build()
                    )
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.create(params);
            log.info("Stripe PaymentIntent created: {}", paymentIntent.getId());
            return paymentIntent.getId();
        } catch (StripeException e) {
            log.error("Stripe payment failed: {}", e.getMessage());
            throw new RuntimeException("Payment processing failed: " + e.getMessage());
        }
    }

    public String simulatePayment(BigDecimal amount, String description) {
        log.info("Simulating payment of {} for: {}", amount, description);
        return "sim_" + System.currentTimeMillis();
    }
}
