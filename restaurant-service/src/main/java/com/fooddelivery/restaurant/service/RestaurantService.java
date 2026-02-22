package com.fooddelivery.restaurant.service;

import com.fooddelivery.restaurant.dto.*;
import com.fooddelivery.restaurant.entity.MenuItem;
import com.fooddelivery.restaurant.entity.Restaurant;
import com.fooddelivery.restaurant.exception.ResourceNotFoundException;
import com.fooddelivery.restaurant.repository.MenuItemRepository;
import com.fooddelivery.restaurant.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;

    @Transactional
    public RestaurantResponse createRestaurant(RestaurantRequest request) {
        log.info("Creating restaurant: {}", request.getName());

        Restaurant restaurant = Restaurant.builder()
                .name(request.getName())
                .description(request.getDescription())
                .address(request.getAddress())
                .phone(request.getPhone())
                .cuisineType(request.getCuisineType())
                .imageUrl(request.getImageUrl())
                .ownerId(request.getOwnerId())
                .isActive(true)
                .rating(0.0)
                .build();

        Restaurant saved = restaurantRepository.save(restaurant);
        log.info("Restaurant created with id: {}", saved.getId());

        return mapToResponse(saved);
    }

    public RestaurantResponse getRestaurantById(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));
        return mapToResponse(restaurant);
    }

    public RestaurantResponse getRestaurantByOwnerId(Long ownerId) {
        List<Restaurant> restaurants = restaurantRepository.findByOwnerId(ownerId);
        if (restaurants.isEmpty()) {
            return null;
        }
        return mapToResponse(restaurants.get(0));
    }

    public List<RestaurantResponse> getAllRestaurants() {
        return restaurantRepository.findByIsActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<RestaurantResponse> searchRestaurants(String query) {
        List<Restaurant> restaurants = restaurantRepository.findByNameContainingIgnoreCase(query);
        return restaurants.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<RestaurantResponse> getRestaurantsByCuisine(String cuisineType) {
        return restaurantRepository.findByCuisineTypeContainingIgnoreCase(cuisineType).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RestaurantResponse updateRestaurant(Long id, RestaurantRequest request) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));

        if (request.getName() != null) restaurant.setName(request.getName());
        if (request.getDescription() != null) restaurant.setDescription(request.getDescription());
        if (request.getAddress() != null) restaurant.setAddress(request.getAddress());
        if (request.getPhone() != null) restaurant.setPhone(request.getPhone());
        if (request.getCuisineType() != null) restaurant.setCuisineType(request.getCuisineType());
        if (request.getImageUrl() != null) restaurant.setImageUrl(request.getImageUrl());

        Restaurant updated = restaurantRepository.save(restaurant);
        log.info("Restaurant updated: {}", id);

        return mapToResponse(updated);
    }

    @Transactional
    public void deleteRestaurant(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));
        restaurant.setIsActive(false);
        restaurantRepository.save(restaurant);
        log.info("Restaurant deleted (soft): {}", id);
    }

    // Menu Item operations
    @Transactional
    public MenuItemResponse addMenuItem(Long restaurantId, MenuItemRequest request) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));

        MenuItem menuItem = MenuItem.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .isAvailable(request.getIsAvailable())
                .restaurant(restaurant)
                .build();

        MenuItem saved = menuItemRepository.save(menuItem);
        log.info("Menu item added: {} to restaurant: {}", saved.getId(), restaurantId);

        return mapToMenuItemResponse(saved);
    }

    public List<MenuItemResponse> getMenuItems(Long restaurantId) {
        return menuItemRepository.findByRestaurantIdAndIsAvailableTrue(restaurantId).stream()
                .map(this::mapToMenuItemResponse)
                .collect(Collectors.toList());
    }

    public MenuItemResponse getMenuItemById(Long itemId) {
        MenuItem menuItem = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + itemId));
        return mapToMenuItemResponse(menuItem);
    }

    @Transactional
    public MenuItemResponse updateMenuItem(Long restaurantId, Long itemId, MenuItemRequest request) {
        MenuItem menuItem = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + itemId));

        if (!menuItem.getRestaurant().getId().equals(restaurantId)) {
            throw new ResourceNotFoundException("Menu item does not belong to restaurant");
        }

        if (request.getName() != null) menuItem.setName(request.getName());
        if (request.getDescription() != null) menuItem.setDescription(request.getDescription());
        if (request.getPrice() != null) menuItem.setPrice(request.getPrice());
        if (request.getCategory() != null) menuItem.setCategory(request.getCategory());
        if (request.getImageUrl() != null) menuItem.setImageUrl(request.getImageUrl());
        if (request.getIsAvailable() != null) menuItem.setIsAvailable(request.getIsAvailable());

        MenuItem updated = menuItemRepository.save(menuItem);
        log.info("Menu item updated: {}", itemId);

        return mapToMenuItemResponse(updated);
    }

    @Transactional
    public void deleteMenuItem(Long restaurantId, Long itemId) {
        MenuItem menuItem = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + itemId));

        if (!menuItem.getRestaurant().getId().equals(restaurantId)) {
            throw new ResourceNotFoundException("Menu item does not belong to restaurant");
        }

        menuItem.setIsAvailable(false);
        menuItemRepository.save(menuItem);
        log.info("Menu item deleted (soft): {}", itemId);
    }

    private RestaurantResponse mapToResponse(Restaurant restaurant) {
        List<MenuItemResponse> menuItems = restaurant.getMenuItems() != null ?
                restaurant.getMenuItems().stream()
                        .filter(MenuItem::getIsAvailable)
                        .map(this::mapToMenuItemResponse)
                        .collect(Collectors.toList()) : Collections.emptyList();

        return RestaurantResponse.builder()
                .id(restaurant.getId())
                .name(restaurant.getName())
                .description(restaurant.getDescription())
                .address(restaurant.getAddress())
                .phone(restaurant.getPhone())
                .cuisineType(restaurant.getCuisineType())
                .imageUrl(restaurant.getImageUrl())
                .ownerId(restaurant.getOwnerId())
                .isActive(restaurant.getIsActive())
                .rating(restaurant.getRating())
                .menuItems(menuItems)
                .createdAt(restaurant.getCreatedAt())
                .build();
    }

    private MenuItemResponse mapToMenuItemResponse(MenuItem menuItem) {
        return MenuItemResponse.builder()
                .id(menuItem.getId())
                .name(menuItem.getName())
                .description(menuItem.getDescription())
                .price(menuItem.getPrice())
                .category(menuItem.getCategory())
                .imageUrl(menuItem.getImageUrl())
                .isAvailable(menuItem.getIsAvailable())
                .restaurantId(menuItem.getRestaurant().getId())
                .build();
    }
}
