package com.fooddelivery.order.entity;

public enum OrderStatus {
    PENDING,
    CREATED,
    PAID,
    CONFIRMED,
    PREPARING,
    READY_FOR_PICKUP,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED
}
