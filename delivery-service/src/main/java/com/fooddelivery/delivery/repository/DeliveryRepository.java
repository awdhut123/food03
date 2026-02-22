package com.fooddelivery.delivery.repository;

import com.fooddelivery.delivery.entity.Delivery;
import com.fooddelivery.delivery.entity.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    
    Optional<Delivery> findByOrderId(Long orderId);
    
    List<Delivery> findByAgentId(Long agentId);
    
    List<Delivery> findByStatus(DeliveryStatus status);
    
    List<Delivery> findByAgentIdAndStatus(Long agentId, DeliveryStatus status);
}
