package com.fooddelivery.restaurant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantResponse {
    private Long id;
    private String name;
    private String description;
    private String address;
    private String phone;
    private String cuisineType;
    private String imageUrl;
    private Long ownerId;
    private Boolean isActive;
    private Double rating;
    private List<MenuItemResponse> menuItems;
    private LocalDateTime createdAt;
}
