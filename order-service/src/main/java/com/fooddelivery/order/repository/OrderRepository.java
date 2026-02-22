package com.fooddelivery.order.repository;

import com.fooddelivery.order.entity.Order;
import com.fooddelivery.order.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    List<Order> findByUserId(Long userId);
    
    List<Order> findByRestaurantId(Long restaurantId);
    
    List<Order> findByStatus(OrderStatus status);
    
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Order> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);
}
