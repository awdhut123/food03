# Software Requirements Specification (SRS)
# Food Delivery System - Microservices Architecture

**Version:** 1.0  
**Date:** February 16, 2026  
**Author:** Development Team

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Architecture](#3-system-architecture)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Database Design](#6-database-design)
7. [API Design](#7-api-design)
8. [Security Design](#8-security-design)
9. [Deployment Architecture](#9-deployment-architecture)

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for a Food Delivery System built using Microservices Architecture. The system enables customers to order food from restaurants, process payments, track deliveries, and receive notifications.

### 1.2 Scope
The Food Delivery System includes:
- User authentication and authorization (JWT-based)
- Restaurant and menu management
- Order processing and lifecycle management
- Payment processing (Stripe integration)
- Delivery tracking and management
- Real-time notifications via Kafka

### 1.3 Definitions and Acronyms
| Term | Definition |
|------|------------|
| JWT | JSON Web Token |
| API | Application Programming Interface |
| CRUD | Create, Read, Update, Delete |
| DTO | Data Transfer Object |
| REST | Representational State Transfer |

### 1.4 Technology Stack
| Component | Technology |
|-----------|------------|
| Backend | Java 21, Spring Boot 3.x |
| Build Tool | Maven |
| Database | MySQL |
| Frontend | React.js with Vite |
| Messaging | Apache Kafka |
| Service Registry | Netflix Eureka |
| API Gateway | Spring Cloud Gateway |
| Authentication | JWT |
| Containerization | Docker |

---

## 2. Overall Description

### 2.1 Product Perspective
The Food Delivery System is a distributed application following microservices architecture. Each service is independently deployable, scalable, and maintainable.

### 2.2 Product Functions
- **User Management**: Registration, authentication, role-based access
- **Restaurant Management**: CRUD operations for restaurants and menus
- **Order Management**: Order placement, status tracking, lifecycle management
- **Payment Processing**: Secure payment handling via Stripe
- **Delivery Management**: Delivery agent assignment, status updates
- **Notifications**: Event-driven notifications for order updates

### 2.3 User Classes and Characteristics

| User Type | Description | Permissions |
|-----------|-------------|-------------|
| Customer | End users ordering food | Browse restaurants, place orders, track delivery |
| Restaurant Owner | Manages restaurant and menu | CRUD menu items, view orders |
| Admin | System administrator | Full system access, manage restaurants |
| Delivery Agent | Delivers orders | View assigned orders, update delivery status |

### 2.4 Operating Environment
- **Server**: Docker containers orchestrated via Docker Compose
- **Database**: MySQL 8.0+
- **Message Broker**: Apache Kafka with Zookeeper
- **Client**: Modern web browsers (Chrome, Firefox, Safari, Edge)

---

## 3. System Architecture

### 3.1 Architecture Diagram (Text-Based)

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                        CLIENTS                               │
                                    │    ┌──────────────────────────────────────────────────┐     │
                                    │    │           React + Vite Frontend (Port 5173)      │     │
                                    │    └──────────────────────────────────────────────────┘     │
                                    └─────────────────────────────────────────────────────────────┘
                                                              │
                                                              ▼
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                    API GATEWAY (Port 8080)                   │
                                    │              Spring Cloud Gateway + JWT Validation           │
                                    └─────────────────────────────────────────────────────────────┘
                                                              │
                         ┌────────────────────────────────────┼────────────────────────────────────┐
                         │                                    │                                    │
                         ▼                                    ▼                                    ▼
        ┌────────────────────────────┐    ┌────────────────────────────┐    ┌────────────────────────────┐
        │     EUREKA SERVER          │    │         KAFKA              │    │         MYSQL              │
        │      (Port 8761)           │    │      (Port 9092)           │    │      (Port 3306)           │
        │   Service Discovery        │    │   Event Messaging          │    │   Persistent Storage       │
        └────────────────────────────┘    └────────────────────────────┘    └────────────────────────────┘
                         │                                    │                         │
                         │                                    │                         │
    ┌────────────────────┼────────────────────────────────────┼─────────────────────────┼────────────────────┐
    │                    │                                    │                         │                    │
    ▼                    ▼                    ▼                ▼               ▼                    ▼
┌─────────┐    ┌─────────────────┐    ┌─────────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐
│  USER   │    │   RESTAURANT    │    │    ORDER    │    │ PAYMENT  │    │ DELIVERY │    │ NOTIFICATION │
│ SERVICE │    │    SERVICE      │    │   SERVICE   │    │ SERVICE  │    │ SERVICE  │    │   SERVICE    │
│ (8081)  │    │    (8082)       │    │   (8083)    │    │  (8084)  │    │  (8085)  │    │   (8086)     │
└─────────┘    └─────────────────┘    └─────────────┘    └──────────┘    └──────────┘    └──────────────┘
    │                    │                    │                │              │                  │
    │                    │                    │                │              │                  │
    └────────────────────┴────────────────────┴────────────────┴──────────────┴──────────────────┘
                                              │
                                    [Inter-Service Communication]
                                    • OpenFeign (Synchronous)
                                    • Kafka (Asynchronous)
```

### 3.2 Service Communication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ORDER PROCESSING FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   Customer                                                                              │
│      │                                                                                  │
│      ▼                                                                                  │
│   ┌──────────────┐    OpenFeign     ┌──────────────┐                                   │
│   │ Order Service│ ───────────────► │Payment Service│                                   │
│   │              │                  │              │                                    │
│   │ - Create     │ ◄─────────────── │ - Process    │                                   │
│   │   Order      │   Payment Status │   Payment    │                                   │
│   └──────────────┘                  └──────────────┘                                   │
│         │                                                                               │
│         │ OpenFeign                                                                     │
│         ▼                                                                               │
│   ┌──────────────┐                                                                      │
│   │Delivery Svc  │                                                                      │
│   │              │                                                                      │
│   │ - Assign     │                                                                      │
│   │   Agent      │                                                                      │
│   └──────────────┘                                                                      │
│         │                                                                               │
│         │ Kafka Event                                                                   │
│         ▼                                                                               │
│   ┌──────────────┐                                                                      │
│   │Notification  │                                                                      │
│   │   Service    │ ────► Console/Email Notification                                    │
│   └──────────────┘                                                                      │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Inter-Service Communication Strategy

**OpenFeign (Synchronous) - Preferred over RestTemplate**

Reasons for choosing OpenFeign:
1. **Declarative Approach**: Define API contracts as interfaces
2. **Automatic Load Balancing**: Integrates seamlessly with Eureka
3. **Built-in Circuit Breaker**: Easy integration with Resilience4j
4. **Cleaner Code**: No boilerplate HTTP client code
5. **Type Safety**: Compile-time checking of API contracts

**Communication Matrix:**

| Source Service | Target Service | Method | Purpose |
|---------------|----------------|--------|---------|
| order-service | payment-service | OpenFeign | Process payment |
| order-service | delivery-service | OpenFeign | Initiate delivery |
| order-service | notification-service | Kafka | Order events |
| payment-service | notification-service | Kafka | Payment events |
| delivery-service | notification-service | Kafka | Delivery events |

---

## 4. Functional Requirements

### 4.1 User Service (FR-US)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-US-001 | System shall allow user registration with email validation | High |
| FR-US-002 | System shall authenticate users via JWT tokens | High |
| FR-US-003 | System shall support roles: CUSTOMER, ADMIN, RESTAURANT_OWNER, DELIVERY_AGENT | High |
| FR-US-004 | System shall encrypt passwords using BCrypt | High |
| FR-US-005 | System shall provide user profile management | Medium |

### 4.2 Restaurant Management Service (FR-RS)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-RS-001 | Admin shall add/update/delete restaurants | High |
| FR-RS-002 | Restaurant owner shall manage menu items | High |
| FR-RS-003 | Public users shall view restaurants and menus | High |
| FR-RS-004 | System shall support restaurant search by name/cuisine | Medium |
| FR-RS-005 | System shall support menu item categories | Medium |

### 4.3 Order Management Service (FR-OS)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-OS-001 | Customer shall place orders from restaurant menus | High |
| FR-OS-002 | System shall manage order status lifecycle | High |
| FR-OS-003 | System shall integrate with payment service | High |
| FR-OS-004 | System shall publish order events to Kafka | High |
| FR-OS-005 | Customer shall view order history | Medium |

### 4.4 Payment Service (FR-PS)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PS-001 | System shall process payments via Stripe | High |
| FR-PS-002 | System shall maintain payment transaction records | High |
| FR-PS-003 | System shall notify order service of payment status | High |
| FR-PS-004 | System shall support payment refunds | Low |

### 4.5 Delivery Management Service (FR-DS)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-DS-001 | System shall assign delivery agents to orders | High |
| FR-DS-002 | System shall track delivery status | High |
| FR-DS-003 | Delivery agent shall update delivery status | High |
| FR-DS-004 | System shall notify when delivery is complete | High |

### 4.6 Notification Service (FR-NS)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-NS-001 | System shall consume Kafka events | High |
| FR-NS-002 | System shall send order creation notifications | High |
| FR-NS-003 | System shall send payment confirmation notifications | High |
| FR-NS-004 | System shall send delivery status notifications | High |

---

## 5. Non-Functional Requirements

### 5.1 Performance
- API response time < 500ms for 95th percentile
- Support 1000 concurrent users
- Database query execution < 100ms

### 5.2 Scalability
- Each microservice independently scalable
- Horizontal scaling support via container orchestration

### 5.3 Availability
- 99.9% uptime target
- Graceful degradation on service failure

### 5.4 Security
- All endpoints secured via JWT
- HTTPS for all communications
- Password encryption with BCrypt (strength 12)
- Role-based access control

---

## 6. Database Design

### 6.1 Database Schemas

**user_db**
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role ENUM('CUSTOMER', 'ADMIN', 'RESTAURANT_OWNER', 'DELIVERY_AGENT'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**restaurant_db**
```sql
CREATE TABLE restaurants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(500),
    phone VARCHAR(20),
    cuisine_type VARCHAR(100),
    owner_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);
```

**order_db**
```sql
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    restaurant_id BIGINT NOT NULL,
    status ENUM('CREATED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'),
    total_amount DECIMAL(10,2),
    delivery_address VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    menu_item_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

**payment_db**
```sql
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
    stripe_payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**delivery_db**
```sql
CREATE TABLE deliveries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    agent_id BIGINT,
    status ENUM('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'),
    pickup_time TIMESTAMP,
    delivery_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE delivery_agents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    current_location VARCHAR(255)
);
```

---

## 7. API Design

### 7.1 API Endpoints

**User Service** `/api/users`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /register | Register new user |
| POST | /login | Authenticate user |
| GET | /profile | Get user profile |
| PUT | /profile | Update user profile |

**Restaurant Service** `/api/restaurants`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | List all restaurants |
| GET | /{id} | Get restaurant details |
| POST | / | Create restaurant (Admin) |
| PUT | /{id} | Update restaurant |
| DELETE | /{id} | Delete restaurant |
| GET | /{id}/menu | Get restaurant menu |
| POST | /{id}/menu | Add menu item |
| PUT | /{id}/menu/{itemId} | Update menu item |
| DELETE | /{id}/menu/{itemId} | Delete menu item |

**Order Service** `/api/orders`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | / | Create order |
| GET | /{id} | Get order details |
| GET | /user/{userId} | Get user's orders |
| PUT | /{id}/status | Update order status |
| PUT | /{id}/cancel | Cancel order |

**Payment Service** `/api/payments`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /process | Process payment |
| GET | /{id} | Get payment details |
| GET | /order/{orderId} | Get payment by order |

**Delivery Service** `/api/delivery`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /assign | Assign delivery agent |
| PUT | /{id}/status | Update delivery status |
| GET | /order/{orderId} | Get delivery by order |
| GET | /agent/{agentId} | Get agent's deliveries |

---

## 8. Security Design

### 8.1 Authentication Flow

```
┌────────┐     ┌───────────┐     ┌─────────────┐     ┌──────────────┐
│ Client │────►│API Gateway│────►│ User Service│────►│   MySQL DB   │
└────────┘     └───────────┘     └─────────────┘     └──────────────┘
    │               │                   │
    │  1. Login     │                   │
    │  Request      │                   │
    │───────────────►                   │
    │               │  2. Forward       │
    │               │───────────────────►
    │               │                   │  3. Validate
    │               │                   │  Credentials
    │               │   4. JWT Token    │
    │               │◄───────────────────
    │  5. Return    │
    │  JWT Token    │
    │◄───────────────
    │
    │  6. Subsequent requests with JWT in Authorization header
    │
```

### 8.2 JWT Structure
```json
{
  "header": {
    "alg": "HS512",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user@email.com",
    "userId": 1,
    "role": "CUSTOMER",
    "iat": 1708070622,
    "exp": 1708157022
  }
}
```

### 8.3 Role-Based Access Control

| Endpoint Pattern | CUSTOMER | RESTAURANT_OWNER | ADMIN | DELIVERY_AGENT |
|-----------------|----------|------------------|-------|----------------|
| POST /api/users/register | ✓ | ✓ | ✓ | ✓ |
| POST /api/restaurants | ✗ | ✗ | ✓ | ✗ |
| POST /api/restaurants/{id}/menu | ✗ | ✓ | ✓ | ✗ |
| POST /api/orders | ✓ | ✗ | ✓ | ✗ |
| PUT /api/delivery/{id}/status | ✗ | ✗ | ✓ | ✓ |

---

## 9. Deployment Architecture

### 9.1 Docker Deployment Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              DOCKER HOST                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         Docker Network: food-delivery-net                    │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                             │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐              │   │
│  │  │  MySQL    │  │ Zookeeper │  │   Kafka   │  │  Eureka   │              │   │
│  │  │  :3306    │  │  :2181    │  │  :9092    │  │  :8761    │              │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘              │   │
│  │                                                                             │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐              │   │
│  │  │  Gateway  │  │   User    │  │Restaurant │  │   Order   │              │   │
│  │  │  :8080    │  │  :8081    │  │  :8082    │  │  :8083    │              │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘              │   │
│  │                                                                             │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐              │   │
│  │  │  Payment  │  │ Delivery  │  │Notification│  │ Frontend  │              │   │
│  │  │  :8084    │  │  :8085    │  │  :8086    │  │  :5173    │              │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘              │   │
│  │                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Environment Configuration

Each service uses `application.yml` with profiles:
- `default`: Development configuration
- `docker`: Docker container configuration

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Microservice | Independently deployable service with specific business capability |
| API Gateway | Entry point for all client requests |
| Service Registry | Central registry for service discovery |
| Event-Driven | Architecture pattern using asynchronous messaging |
| Circuit Breaker | Pattern to prevent cascade failures |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Manager | | | |
| Tech Lead | | | |
| QA Lead | | | |

---

*End of SRS Document*
