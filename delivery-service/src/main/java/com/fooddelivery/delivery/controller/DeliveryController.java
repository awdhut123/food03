package com.fooddelivery.delivery.controller;

import com.fooddelivery.delivery.dto.DeliveryRequest;
import com.fooddelivery.delivery.dto.DeliveryResponse;
import com.fooddelivery.delivery.entity.DeliveryAgent;
import com.fooddelivery.delivery.entity.DeliveryStatus;
import com.fooddelivery.delivery.service.DeliveryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery")
@RequiredArgsConstructor
@Slf4j
public class DeliveryController {

    private final DeliveryService deliveryService;

    @PostMapping("/assign")
    public ResponseEntity<DeliveryResponse> assignDelivery(@RequestBody DeliveryRequest request) {
        log.info("Assign delivery request for order: {}", request.getOrderId());
        DeliveryResponse response = deliveryService.assignDelivery(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/available")
    public ResponseEntity<List<DeliveryResponse>> getAvailableDeliveries() {
        log.info("Get available (unassigned) deliveries");
        List<DeliveryResponse> response = deliveryService.getAvailableDeliveries();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-deliveries")
    public ResponseEntity<List<DeliveryResponse>> getMyDeliveries(@RequestHeader("X-User-Id") Long userId) {
        log.info("Get deliveries for user (agent): {}", userId);
        List<DeliveryResponse> response = deliveryService.getDeliveriesByUserId(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<DeliveryResponse> acceptDelivery(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Agent (user {}) accepting delivery: {}", userId, id);
        DeliveryResponse response = deliveryService.acceptDelivery(id, userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<DeliveryResponse> updateDeliveryStatus(
            @PathVariable Long id,
            @RequestParam DeliveryStatus status) {
        log.info("Update delivery {} status to: {}", id, status);
        DeliveryResponse response = deliveryService.updateDeliveryStatus(id, status);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<DeliveryResponse> getDeliveryByOrderId(@PathVariable Long orderId) {
        log.info("Get delivery for order: {}", orderId);
        DeliveryResponse response = deliveryService.getDeliveryByOrderId(orderId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/agent/{agentId}")
    public ResponseEntity<List<DeliveryResponse>> getDeliveriesByAgentId(@PathVariable Long agentId) {
        log.info("Get deliveries for agent: {}", agentId);
        List<DeliveryResponse> response = deliveryService.getDeliveriesByAgentId(agentId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/agents/register")
    public ResponseEntity<DeliveryResponse> registerAgent(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody java.util.Map<String, String> body) {
        log.info("Register delivery agent for user: {}", userId);
        deliveryService.ensureAgentRegistered(userId, body.get("name"), body.get("phone"));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/agents")
    public ResponseEntity<List<DeliveryAgent>> getAllAgents() {
        log.info("Get all delivery agents");
        return ResponseEntity.ok(deliveryService.getAllAgents());
    }

    @GetMapping("/all")
    public ResponseEntity<List<DeliveryResponse>> getAllDeliveries() {
        log.info("Get all deliveries");
        return ResponseEntity.ok(deliveryService.getAllDeliveries());
    }
}
