package com.fooddelivery.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Notification Service - Simulates sending notifications
 * In a real application, this would integrate with:
 * - Email service (SendGrid, AWS SES, etc.)
 * - SMS service (Twilio, AWS SNS, etc.)
 * - Push notification service (Firebase, OneSignal, etc.)
 */
@Service
@Slf4j
public class NotificationService {

    public void sendOrderCreatedNotification(Long orderId, Long userId) {
        log.info("📧 NOTIFICATION: Order #{} has been created for user #{}", orderId, userId);
        log.info("   Subject: Order Confirmation");
        log.info("   Message: Your order has been placed successfully. Order ID: {}", orderId);
        simulateEmailSend("order-created", orderId, userId);
    }

    public void sendPaymentSuccessNotification(Long orderId, Long userId) {
        log.info("📧 NOTIFICATION: Payment successful for order #{}", orderId);
        log.info("   Subject: Payment Confirmed");
        log.info("   Message: Your payment for order #{} has been processed successfully.", orderId);
        simulateEmailSend("payment-success", orderId, userId);
    }

    public void sendPaymentFailedNotification(Long orderId, Long userId) {
        log.info("📧 NOTIFICATION: Payment failed for order #{}", orderId);
        log.info("   Subject: Payment Failed");
        log.info("   Message: Payment for order #{} could not be processed. Please try again.", orderId);
        simulateEmailSend("payment-failed", orderId, userId);
    }

    public void sendOrderStatusNotification(Long orderId, Long userId, String status) {
        log.info("📧 NOTIFICATION: Order #{} status updated to: {}", orderId, status);
        log.info("   Subject: Order Status Update");
        log.info("   Message: Your order #{} is now {}.", orderId, status);
        simulateEmailSend("order-status-" + status.toLowerCase(), orderId, userId);
    }

    public void sendOrderDeliveredNotification(Long orderId, Long userId) {
        log.info("📧 NOTIFICATION: Order #{} has been delivered!", orderId);
        log.info("   Subject: Order Delivered");
        log.info("   Message: Your order #{} has been delivered. Enjoy your meal!", orderId);
        simulateEmailSend("order-delivered", orderId, userId);
    }

    public void sendOrderCancelledNotification(Long orderId, Long userId) {
        log.info("📧 NOTIFICATION: Order #{} has been cancelled", orderId);
        log.info("   Subject: Order Cancelled");
        log.info("   Message: Your order #{} has been cancelled. Refund will be processed.", orderId);
        simulateEmailSend("order-cancelled", orderId, userId);
    }

    public void sendDeliveryAssignedNotification(Long orderId) {
        log.info("📧 NOTIFICATION: Delivery agent assigned for order #{}", orderId);
        log.info("   Subject: Delivery Agent Assigned");
        log.info("   Message: A delivery agent has been assigned to your order #{}.", orderId);
        simulatePushNotification("delivery-assigned", orderId);
    }

    public void sendDeliveryStatusNotification(Long orderId, String status) {
        log.info("📧 NOTIFICATION: Delivery status for order #{}: {}", orderId, status);
        log.info("   Subject: Delivery Update");
        log.info("   Message: Your order #{} delivery status: {}.", orderId, status);
        simulatePushNotification("delivery-" + status.toLowerCase(), orderId);
    }

    public void sendDeliveryCompletedNotification(Long orderId) {
        log.info("📧 NOTIFICATION: Delivery completed for order #{}", orderId);
        log.info("   Subject: Delivery Completed");
        log.info("   Message: Your order #{} has been delivered successfully!", orderId);
        simulatePushNotification("delivery-completed", orderId);
    }

    private void simulateEmailSend(String template, Long orderId, Long userId) {
        log.info("   [SIMULATED] Email sent using template: {} to user: {}", template, userId);
    }

    private void simulatePushNotification(String type, Long orderId) {
        log.info("   [SIMULATED] Push notification sent: {} for order: {}", type, orderId);
    }
}
