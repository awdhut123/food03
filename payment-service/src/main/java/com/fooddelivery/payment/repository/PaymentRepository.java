package com.fooddelivery.payment.repository;

import com.fooddelivery.payment.entity.Payment;
import com.fooddelivery.payment.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    Optional<Payment> findByOrderId(Long orderId);
    
    Optional<Payment> findByStripePaymentId(String stripePaymentId);
    
    List<Payment> findByUserId(Long userId);
    
    List<Payment> findByStatus(PaymentStatus status);
}
