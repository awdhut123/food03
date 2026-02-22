# Food Delivery System - Microservices Architecture

A complete Food Delivery System built with Spring Boot 3.x microservices architecture.

## Architecture Overview

```
                    ┌─────────────────┐
                    │  React Frontend │
                    │   (Port 5173)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    │   (Port 8080)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
   │ Eureka  │         │  Kafka  │         │  MySQL  │
   │ (8761)  │         │ (9092)  │         │ (3306)  │
   └─────────┘         └─────────┘         └─────────┘
        │
   ┌────┴──────────────────────────────────────────┐
   │                                               │
┌──▼──┐ ┌──────────┐ ┌─────┐ ┌───────┐ ┌────────┐ ┌────────────┐
│User │ │Restaurant│ │Order│ │Payment│ │Delivery│ │Notification│
│8081 │ │  8082    │ │8083 │ │ 8084  │ │ 8085   │ │   8086     │
└─────┘ └──────────┘ └─────┘ └───────┘ └────────┘ └────────────┘
```

## Technology Stack

- **Backend**: Java 21, Spring Boot 3.2.2
- **Build Tool**: Maven
- **Database**: MySQL 8.0
- **Message Broker**: Apache Kafka
- **Service Discovery**: Netflix Eureka
- **API Gateway**: Spring Cloud Gateway
- **Authentication**: JWT
- **Inter-Service Communication**: OpenFeign (synchronous), Kafka (asynchronous)
- **Payment Gateway**: Stripe
- **Containerization**: Docker

## Services

| Service | Port | Description |
|---------|------|-------------|
| Eureka Server | 8761 | Service Discovery |
| API Gateway | 8080 | Entry point, JWT validation |
| User Service | 8081 | User management, authentication |
| Restaurant Service | 8082 | Restaurant & menu management |
| Order Service | 8083 | Order processing |
| Payment Service | 8084 | Payment processing (Stripe) |
| Delivery Service | 8085 | Delivery management |
| Notification Service | 8086 | Event-driven notifications |

## Prerequisites

- Java 21
- Maven 3.8+
- Docker & Docker Compose
- MySQL Workbench (optional)

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone or navigate to the project
cd food-delivery-system

# Build and start all services
docker-compose up --build

# Stop all services
docker-compose down
```

### Running Locally

1. Start MySQL and Kafka (using Docker):
```bash
docker-compose up mysql zookeeper kafka -d
```

2. Start Eureka Server:
```bash
cd eureka-server
mvn spring-boot:run
```

3. Start API Gateway:
```bash
cd api-gateway
mvn spring-boot:run
```

4. Start other services in separate terminals:
```bash
cd user-service && mvn spring-boot:run
cd restaurant-service && mvn spring-boot:run
cd order-service && mvn spring-boot:run
cd payment-service && mvn spring-boot:run
cd delivery-service && mvn spring-boot:run
cd notification-service && mvn spring-boot:run
```

## API Endpoints

### User Service
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login
- `GET /api/users/profile` - Get user profile

### Restaurant Service
- `GET /api/restaurants` - List restaurants
- `POST /api/restaurants` - Create restaurant (Admin)
- `GET /api/restaurants/{id}/menu` - Get menu
- `POST /api/restaurants/{id}/menu` - Add menu item

### Order Service
- `POST /api/orders` - Create order
- `GET /api/orders/{id}` - Get order
- `PUT /api/orders/{id}/status` - Update status

### Payment Service
- `POST /api/payments/process` - Process payment

### Delivery Service
- `POST /api/delivery/assign` - Assign delivery
- `PUT /api/delivery/{id}/status` - Update status

## Inter-Service Communication

### Why OpenFeign over RestTemplate?

1. **Declarative Approach**: Define API contracts as interfaces
2. **Automatic Load Balancing**: Integrates with Eureka
3. **Built-in Circuit Breaker**: Resilience4j integration
4. **Cleaner Code**: No boilerplate HTTP client code
5. **Type Safety**: Compile-time checking

### Communication Flow

```
Order Service ──(Feign)──► Payment Service
      │
      └──────(Feign)──► Delivery Service
      │
      └──────(Kafka)──► Notification Service
```

## Configuration

### Stripe Payment
Update `payment-service/src/main/resources/application.yml`:
```yaml
stripe:
  secret:
    key: YOUR_STRIPE_SECRET_KEY
```

### Database
Default MySQL credentials:
- Username: root
- Password: root

## Project Structure

```
food-delivery-system/
├── eureka-server/
├── api-gateway/
├── user-service/
├── restaurant-service/
├── order-service/
├── payment-service/
├── delivery-service/
├── notification-service/
├── frontend/
├── docker-compose.yml
└── README.md
```

## License

MIT License
