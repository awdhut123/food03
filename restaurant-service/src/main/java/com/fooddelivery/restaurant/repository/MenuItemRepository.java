package com.fooddelivery.restaurant.repository;

import com.fooddelivery.restaurant.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    
    List<MenuItem> findByRestaurantId(Long restaurantId);
    
    List<MenuItem> findByRestaurantIdAndIsAvailableTrue(Long restaurantId);
    
    List<MenuItem> findByRestaurantIdAndCategory(Long restaurantId, String category);
}
