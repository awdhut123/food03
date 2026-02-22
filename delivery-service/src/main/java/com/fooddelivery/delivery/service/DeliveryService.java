package com.fooddelivery.delivery.service;

import com.fooddelivery.delivery.client.OrderServiceClient;
import com.fooddelivery.delivery.dto.DeliveryRequest;
import com.fooddelivery.delivery.dto.DeliveryResponse;
import com.fooddelivery.delivery.entity.Delivery;
import com.fooddelivery.delivery.entity.DeliveryAgent;
import com.fooddelivery.delivery.entity.DeliveryStatus;
import com.fooddelivery.delivery.exception.DeliveryNotFoundException;
import com.fooddelivery.delivery.kafka.DeliveryEventProducer;
import com.fooddelivery.delivery.repository.DeliveryAgentRepository;
import com.fooddelivery.delivery.repository.DeliveryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final DeliveryAgentRepository deliveryAgentRepository;
    private final DeliveryEventProducer deliveryEventProducer;
    private final OrderServiceClient orderServiceClient;

    @Transactional
    public DeliveryResponse assignDelivery(DeliveryRequest request) {
        log.info("Assigning delivery for order: {}", request.getOrderId());

        // Create delivery record
        Delivery delivery = Delivery.builder()
                .orderId(request.getOrderId())
                .restaurantId(request.getRestaurantId())
                .deliveryAddress(request.getDeliveryAddress())
                .status(DeliveryStatus.PENDING)
                .estimatedDeliveryTime(LocalDateTime.now().plusMinutes(45))
                .build();

        // Find available delivery agent
        DeliveryAgent agent = deliveryAgentRepository.findFirstByIsAvailableTrue()
                .orElse(null);

        if (agent != null) {
            delivery.setAgentId(agent.getId());
            delivery.setStatus(DeliveryStatus.ASSIGNED);
            agent.setIsAvailable(false);
            deliveryAgentRepository.save(agent);
            log.info("Agent {} assigned to order {}", agent.getId(), request.getOrderId());
        }

        Delivery savedDelivery = deliveryRepository.save(delivery);
        
        // Send delivery event
        deliveryEventProducer.sendDeliveryEvent(savedDelivery, "DELIVERY_ASSIGNED");

        return mapToResponse(savedDelivery, agent);
    }

    @Transactional
    public DeliveryResponse updateDeliveryStatus(Long deliveryId, DeliveryStatus status) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new DeliveryNotFoundException("Delivery not found with id: " + deliveryId));

        delivery.setStatus(status);

        if (status == DeliveryStatus.PICKED_UP) {
            delivery.setPickupTime(LocalDateTime.now());
        } else if (status == DeliveryStatus.DELIVERED) {
            delivery.setDeliveryTime(LocalDateTime.now());
            
            // Make agent available again
            if (delivery.getAgentId() != null) {
                DeliveryAgent agent = deliveryAgentRepository.findById(delivery.getAgentId()).orElse(null);
                if (agent != null) {
                    agent.setIsAvailable(true);
                    deliveryAgentRepository.save(agent);
                }
            }

            // Update order status to DELIVERED via Feign
            try {
                orderServiceClient.updateOrderStatus(delivery.getOrderId(), "DELIVERED");
                log.info("Order {} status updated to DELIVERED", delivery.getOrderId());
            } catch (Exception e) {
                log.error("Failed to update order {} status: {}", delivery.getOrderId(), e.getMessage());
            }
        }

        Delivery updatedDelivery = deliveryRepository.save(delivery);
        log.info("Delivery {} status updated to: {}", deliveryId, status);

        // Send delivery event
        String eventType = status == DeliveryStatus.DELIVERED ? "DELIVERY_COMPLETED" : "DELIVERY_STATUS_UPDATED";
        deliveryEventProducer.sendDeliveryEvent(updatedDelivery, eventType);

        DeliveryAgent agent = delivery.getAgentId() != null ? 
                deliveryAgentRepository.findById(delivery.getAgentId()).orElse(null) : null;

        return mapToResponse(updatedDelivery, agent);
    }

    public DeliveryResponse getDeliveryByOrderId(Long orderId) {
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new DeliveryNotFoundException("Delivery not found for order: " + orderId));
        
        DeliveryAgent agent = delivery.getAgentId() != null ? 
                deliveryAgentRepository.findById(delivery.getAgentId()).orElse(null) : null;

        return mapToResponse(delivery, agent);
    }

    public List<DeliveryResponse> getDeliveriesByAgentId(Long agentId) {
        return deliveryRepository.findByAgentId(agentId).stream()
                .map(d -> {
                    DeliveryAgent agent = deliveryAgentRepository.findById(d.getAgentId()).orElse(null);
                    return mapToResponse(d, agent);
                })
                .collect(Collectors.toList());
    }

    public List<DeliveryResponse> getAvailableDeliveries() {
        return deliveryRepository.findByStatus(DeliveryStatus.PENDING).stream()
                .map(d -> mapToResponse(d, null))
                .collect(Collectors.toList());
    }

    public List<DeliveryResponse> getDeliveriesByUserId(Long userId) {
        DeliveryAgent agent = ensureAgentRegistered(userId, null, null);
        return deliveryRepository.findByAgentId(agent.getId()).stream()
                .map(d -> mapToResponse(d, agent))
                .collect(Collectors.toList());
    }

    @Transactional
    public DeliveryResponse acceptDelivery(Long deliveryId, Long userId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new DeliveryNotFoundException("Delivery not found with id: " + deliveryId));

        if (delivery.getStatus() != DeliveryStatus.PENDING) {
            throw new IllegalStateException("Delivery is not in PENDING status");
        }

        DeliveryAgent agent = ensureAgentRegistered(userId, null, null);

        delivery.setAgentId(agent.getId());
        delivery.setStatus(DeliveryStatus.ASSIGNED);
        agent.setIsAvailable(false);
        deliveryAgentRepository.save(agent);

        Delivery saved = deliveryRepository.save(delivery);
        log.info("Delivery {} accepted by agent {} (user {})", deliveryId, agent.getId(), userId);

        // Update order status to OUT_FOR_DELIVERY
        try {
            orderServiceClient.updateOrderStatus(saved.getOrderId(), "OUT_FOR_DELIVERY");
            log.info("Order {} status updated to OUT_FOR_DELIVERY", saved.getOrderId());
        } catch (Exception e) {
            log.error("Failed to update order {} status: {}", saved.getOrderId(), e.getMessage());
        }

        deliveryEventProducer.sendDeliveryEvent(saved, "DELIVERY_ACCEPTED");
        return mapToResponse(saved, agent);
    }

    public DeliveryAgent ensureAgentRegistered(Long userId, String name, String phone) {
        return deliveryAgentRepository.findByUserId(userId)
                .orElseGet(() -> {
                    log.info("Auto-registering delivery agent for user: {}", userId);
                    DeliveryAgent newAgent = DeliveryAgent.builder()
                            .userId(userId)
                            .name(name != null ? name : "Agent-" + userId)
                            .phone(phone)
                            .isAvailable(true)
                            .build();
                    return deliveryAgentRepository.save(newAgent);
                });
    }

    public List<DeliveryAgent> getAllAgents() {
        return deliveryAgentRepository.findAll();
    }

    public List<DeliveryResponse> getAllDeliveries() {
        return deliveryRepository.findAll().stream()
                .map(d -> {
                    DeliveryAgent agent = d.getAgentId() != null ?
                            deliveryAgentRepository.findById(d.getAgentId()).orElse(null) : null;
                    return mapToResponse(d, agent);
                })
                .collect(Collectors.toList());
    }

    private DeliveryResponse mapToResponse(Delivery delivery, DeliveryAgent agent) {
        return DeliveryResponse.builder()
                .id(delivery.getId())
                .orderId(delivery.getOrderId())
                .agentId(delivery.getAgentId())
                .agentName(agent != null ? agent.getName() : null)
                .restaurantId(delivery.getRestaurantId())
                .deliveryAddress(delivery.getDeliveryAddress())
                .status(delivery.getStatus().name())
                .pickupTime(delivery.getPickupTime())
                .deliveryTime(delivery.getDeliveryTime())
                .estimatedDeliveryTime(delivery.getEstimatedDeliveryTime())
                .createdAt(delivery.getCreatedAt())
                .build();
    }
}
