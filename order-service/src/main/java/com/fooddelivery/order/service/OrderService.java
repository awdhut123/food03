package com.fooddelivery.order.service;

import com.fooddelivery.order.client.DeliveryServiceClient;
import com.fooddelivery.order.client.PaymentServiceClient;
import com.fooddelivery.order.dto.*;
import com.fooddelivery.order.entity.Order;
import com.fooddelivery.order.entity.OrderItem;
import com.fooddelivery.order.entity.OrderStatus;
import com.fooddelivery.order.event.OrderEvent;
import com.fooddelivery.order.exception.OrderNotFoundException;
import com.fooddelivery.order.kafka.OrderEventProducer;
import com.fooddelivery.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final PaymentServiceClient paymentServiceClient;
    private final DeliveryServiceClient deliveryServiceClient;
    private final OrderEventProducer orderEventProducer;

    // Valid status transitions: key = current status, value = set of allowed next statuses
    private static final Map<OrderStatus, Set<OrderStatus>> VALID_TRANSITIONS;
    static {
        Map<OrderStatus, Set<OrderStatus>> map = new EnumMap<>(OrderStatus.class);
        map.put(OrderStatus.PENDING, EnumSet.of(OrderStatus.PAID, OrderStatus.CANCELLED));
        map.put(OrderStatus.CREATED, EnumSet.of(OrderStatus.PAID, OrderStatus.CONFIRMED, OrderStatus.CANCELLED));
        map.put(OrderStatus.PAID, EnumSet.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED));
        map.put(OrderStatus.CONFIRMED, EnumSet.of(OrderStatus.PREPARING, OrderStatus.CANCELLED));
        map.put(OrderStatus.PREPARING, EnumSet.of(OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED));
        map.put(OrderStatus.READY_FOR_PICKUP, EnumSet.of(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED));
        map.put(OrderStatus.OUT_FOR_DELIVERY, EnumSet.of(OrderStatus.DELIVERED));
        map.put(OrderStatus.DELIVERED, EnumSet.noneOf(OrderStatus.class));
        map.put(OrderStatus.CANCELLED, EnumSet.noneOf(OrderStatus.class));
        VALID_TRANSITIONS = Collections.unmodifiableMap(map);
    }

    @Transactional
    public OrderResponse createOrder(Long userId, CreateOrderRequest request) {
        log.info("Creating order for user: {} at restaurant: {}", userId, request.getRestaurantId());

        // Validate inputs
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one item");
        }
        if (request.getRestaurantId() == null) {
            throw new IllegalArgumentException("Restaurant ID is required");
        }

        // Create order
        Order order = Order.builder()
                .userId(userId)
                .restaurantId(request.getRestaurantId())
                .status(OrderStatus.PENDING)
                .deliveryAddress(request.getDeliveryAddress())
                .specialInstructions(request.getSpecialInstructions())
                .build();

        // Add order items
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (OrderItemRequest itemRequest : request.getItems()) {
            if (itemRequest.getMenuItemId() == null) {
                throw new IllegalArgumentException("Menu item ID is required for each order item");
            }
            if (itemRequest.getQuantity() == null || itemRequest.getQuantity() < 1) {
                throw new IllegalArgumentException("Quantity must be at least 1 for each order item");
            }

            BigDecimal itemPrice = BigDecimal.valueOf(10.00); // In real app, fetch from restaurant service
            BigDecimal subtotal = itemPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .menuItemId(itemRequest.getMenuItemId())
                    .menuItemName(itemRequest.getMenuItemName() != null ? itemRequest.getMenuItemName() : "Item-" + itemRequest.getMenuItemId())
                    .quantity(itemRequest.getQuantity())
                    .price(itemPrice)
                    .subtotal(subtotal)
                    .build();
            
            order.getOrderItems().add(orderItem);
            totalAmount = totalAmount.add(subtotal);
        }
        
        order.setTotalAmount(totalAmount);

        // Save order to DB first — order exists regardless of payment outcome
        Order savedOrder;
        try {
            savedOrder = orderRepository.save(order);
            log.info("Order saved to DB with id: {}", savedOrder.getId());
        } catch (Exception e) {
            log.error("Failed to save order to DB: {}", e.getMessage(), e);
            throw new IllegalStateException("Failed to create order: " + e.getMessage());
        }

        // Send order created event via Kafka (async notification — never fails the request)
        sendOrderEvent(savedOrder, "ORDER_CREATED");

        // Create Stripe Checkout Session via payment service
        OrderResponse response = mapToResponse(savedOrder);
        try {
            String baseUrl = "http://localhost:5173";
            PaymentRequest paymentRequest = PaymentRequest.builder()
                    .orderId(savedOrder.getId())
                    .userId(userId)
                    .amount(totalAmount)
                    .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CARD")
                    .successUrl(baseUrl + "/payment-success?orderId=" + savedOrder.getId() + "&session_id={CHECKOUT_SESSION_ID}")
                    .cancelUrl(baseUrl + "/payment-cancel?orderId=" + savedOrder.getId())
                    .build();

            PaymentResponse paymentResponse = paymentServiceClient.createCheckoutSession(paymentRequest);
            log.info("Checkout session created for order: {} url: {}", savedOrder.getId(), paymentResponse.getCheckoutUrl());

            if (paymentResponse != null) {
                response.setCheckoutUrl(paymentResponse.getCheckoutUrl());
                response.setSessionId(paymentResponse.getSessionId());
            }
        } catch (Exception e) {
            log.error("Failed to create checkout session for order {}: {}", savedOrder.getId(), e.getMessage(), e);
            // Order is already saved — return it without checkout URL
            // The customer can retry payment later
        }

        return response;
    }

    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + orderId));
        return mapToResponse(order);
    }

    public List<OrderResponse> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<OrderResponse> getOrdersByRestaurantId(Long restaurantId) {
        return orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse confirmOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + orderId));

        // Accept PENDING or CREATED (backward compat) → mark as PAID
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CREATED) {
            // Already paid/confirmed or in another state — return as-is
            return mapToResponse(order);
        }

        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);
        log.info("Order {} marked as PAID after payment", orderId);

        sendOrderEvent(order, "PAYMENT_SUCCESSFUL");

        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + orderId));

        // Validate the status transition
        OrderStatus currentStatus = order.getStatus();
        Set<OrderStatus> allowed = VALID_TRANSITIONS.getOrDefault(currentStatus, EnumSet.noneOf(OrderStatus.class));
        if (!allowed.contains(newStatus)) {
            throw new IllegalStateException(
                    String.format("Cannot transition order %d from %s to %s. Allowed transitions: %s",
                            orderId, currentStatus, newStatus, allowed));
        }

        order.setStatus(newStatus);
        Order updatedOrder = orderRepository.save(order);
        log.info("Order {} status updated from {} to {}", orderId, currentStatus, newStatus);

        // Send status update event
        sendOrderEvent(updatedOrder, "ORDER_STATUS_UPDATED");

        if (newStatus == OrderStatus.DELIVERED) {
            sendOrderEvent(updatedOrder, "ORDER_DELIVERED");
        }

        // When restaurant marks order as READY_FOR_PICKUP, initiate delivery
        if (newStatus == OrderStatus.READY_FOR_PICKUP) {
            try {
                DeliveryRequest deliveryRequest = DeliveryRequest.builder()
                        .orderId(updatedOrder.getId())
                        .restaurantId(updatedOrder.getRestaurantId())
                        .deliveryAddress(updatedOrder.getDeliveryAddress())
                        .build();
                DeliveryResponse deliveryResponse = deliveryServiceClient.assignDelivery(deliveryRequest);
                log.info("Delivery initiated for order: {} with status: {}", orderId, deliveryResponse.getStatus());
            } catch (Exception e) {
                log.error("Failed to initiate delivery for order {}: {}", orderId, e.getMessage());
            }
        }

        return mapToResponse(updatedOrder);
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + orderId));

        if (order.getStatus() == OrderStatus.OUT_FOR_DELIVERY || order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot cancel order in current status: " + order.getStatus());
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order cancelledOrder = orderRepository.save(order);
        log.info("Order {} cancelled", orderId);

        sendOrderEvent(cancelledOrder, "ORDER_CANCELLED");

        return mapToResponse(cancelledOrder);
    }

    private void sendOrderEvent(Order order, String eventType) {
        OrderEvent event = OrderEvent.builder()
                .eventType(eventType)
                .orderId(order.getId())
                .userId(order.getUserId())
                .restaurantId(order.getRestaurantId())
                .orderStatus(order.getStatus().name())
                .totalAmount(order.getTotalAmount())
                .deliveryAddress(order.getDeliveryAddress())
                .timestamp(LocalDateTime.now())
                .build();
        
        orderEventProducer.sendOrderEvent(event);
    }

    private OrderResponse mapToResponse(Order order) {
        List<OrderItemResponse> items = order.getOrderItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .menuItemId(item.getMenuItemId())
                        .menuItemName(item.getMenuItemName())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .restaurantId(order.getRestaurantId())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .deliveryAddress(order.getDeliveryAddress())
                .specialInstructions(order.getSpecialInstructions())
                .items(items)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
