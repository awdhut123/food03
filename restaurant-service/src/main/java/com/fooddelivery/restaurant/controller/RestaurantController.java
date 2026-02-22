package com.fooddelivery.restaurant.controller;

import com.fooddelivery.restaurant.dto.*;
import com.fooddelivery.restaurant.service.RestaurantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
@RequiredArgsConstructor
@Slf4j
public class RestaurantController {

    private final RestaurantService restaurantService;

    @PostMapping
    public ResponseEntity<RestaurantResponse> createRestaurant(
            @Valid @RequestBody RestaurantRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        log.info("Create restaurant request from role: {}", role);
        RestaurantResponse response = restaurantService.createRestaurant(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<RestaurantResponse>> getAllRestaurants() {
        log.info("Get all restaurants request");
        List<RestaurantResponse> response = restaurantService.getAllRestaurants();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantResponse> getRestaurantById(@PathVariable Long id) {
        log.info("Get restaurant by id: {}", id);
        RestaurantResponse response = restaurantService.getRestaurantById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<RestaurantResponse> getRestaurantByOwnerId(@PathVariable Long ownerId) {
        log.info("Get restaurant by owner id: {}", ownerId);
        RestaurantResponse response = restaurantService.getRestaurantByOwnerId(ownerId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<List<RestaurantResponse>> searchRestaurants(@RequestParam String query) {
        log.info("Search restaurants: {}", query);
        List<RestaurantResponse> response = restaurantService.searchRestaurants(query);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cuisine/{cuisineType}")
    public ResponseEntity<List<RestaurantResponse>> getRestaurantsByCuisine(@PathVariable String cuisineType) {
        log.info("Get restaurants by cuisine: {}", cuisineType);
        List<RestaurantResponse> response = restaurantService.getRestaurantsByCuisine(cuisineType);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RestaurantResponse> updateRestaurant(
            @PathVariable Long id,
            @RequestBody RestaurantRequest request) {
        log.info("Update restaurant: {}", id);
        RestaurantResponse response = restaurantService.updateRestaurant(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRestaurant(@PathVariable Long id) {
        log.info("Delete restaurant: {}", id);
        restaurantService.deleteRestaurant(id);
        return ResponseEntity.noContent().build();
    }

    // Menu endpoints
    @PostMapping("/{restaurantId}/menu")
    public ResponseEntity<MenuItemResponse> addMenuItem(
            @PathVariable Long restaurantId,
            @Valid @RequestBody MenuItemRequest request) {
        log.info("Add menu item to restaurant: {}", restaurantId);
        MenuItemResponse response = restaurantService.addMenuItem(restaurantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{restaurantId}/menu")
    public ResponseEntity<List<MenuItemResponse>> getMenuItems(@PathVariable Long restaurantId) {
        log.info("Get menu items for restaurant: {}", restaurantId);
        List<MenuItemResponse> response = restaurantService.getMenuItems(restaurantId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{restaurantId}/menu/{itemId}")
    public ResponseEntity<MenuItemResponse> getMenuItem(
            @PathVariable Long restaurantId,
            @PathVariable Long itemId) {
        log.info("Get menu item: {} from restaurant: {}", itemId, restaurantId);
        MenuItemResponse response = restaurantService.getMenuItemById(itemId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{restaurantId}/menu/{itemId}")
    public ResponseEntity<MenuItemResponse> updateMenuItem(
            @PathVariable Long restaurantId,
            @PathVariable Long itemId,
            @RequestBody MenuItemRequest request) {
        log.info("Update menu item: {} in restaurant: {}", itemId, restaurantId);
        MenuItemResponse response = restaurantService.updateMenuItem(restaurantId, itemId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{restaurantId}/menu/{itemId}")
    public ResponseEntity<Void> deleteMenuItem(
            @PathVariable Long restaurantId,
            @PathVariable Long itemId) {
        log.info("Delete menu item: {} from restaurant: {}", itemId, restaurantId);
        restaurantService.deleteMenuItem(restaurantId, itemId);
        return ResponseEntity.noContent().build();
    }
}
