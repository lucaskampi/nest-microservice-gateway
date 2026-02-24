# NestJS Microservice - API Gateway

## Overview

This service is the API Gateway - single entry point for all microservices, handles JWT validation, rate limiting, and request routing.

## Tech Stack

- NestJS
- TypeScript
- JWT
- Passport
- axios
- http-proxy-middleware

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| JWT_SECRET | Secret key for JWT validation | - |
| AUTH_SERVICE_URL | Auth microservice URL | http://localhost:3001 |
| STORE_SERVICE_URL | Store microservice URL | http://localhost:3002 |
| SUPPLIER_SERVICE_URL | Supplier microservice URL | http://localhost:3003 |
| CARRIER_SERVICE_URL | Carrier microservice URL | http://localhost:3004 |

## Getting Started

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm run test
```

## Docker

```bash
# Build Docker image
docker build -t nest-microservice-gateway .

# Run Docker container
docker run -p 3000:3000 nest-microservice-gateway
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/` | Base URL |
| `/api` | Swagger API documentation |
| `/health` | Health check endpoint |

## Proxied Services

The gateway routes requests to the following microservices:

- **Auth Service** - Authentication and authorization
- **Store Service** - Store management
- **Supplier Service** - Supplier management
- **Carrier Service** - Carrier management

---

> This service was extracted from the monorepo `nest-microservice-store` as part of a microservices migration. Initial commits were done via multi-agent setup to avoid merge conflicts.
