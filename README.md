# Spinada API

A robust and secure API built with Node.js, Express, and TypeScript that integrates weather and cryptocurrency data.

## 📚 Table of Contents

- [Features](#features)
- [Security Features](#security-features)
- [Further Improvements](#further-improvements)
- [API Documentation](#api-documentation)
- [Development](#development)

## ✨ Features

- **Authentication & Authorization**
    - JWT-based authentication
    - Role-based access control (User/Admin)
    - Secure password hashing with bcrypt
    - Login attempt delay for enhanced security

- **API Features**
    - Weather data integration
    - Cryptocurrency price tracking
    - Combined data endpoint with caching
    - Rate limiting for API protection

- **Developer Experience**
    - OpenAPI/Swagger documentation
    - TypeScript for type safety
    - ESLint + Prettier configuration
    - Husky for pre-commit hooks
    - Comprehensive test suite
    - API versioning (v1)
    - Centralized logging

- **Production Ready**
    - Graceful shutdown handling
    - Error handling middleware
    - Winston logger integration
    - Consistent API responses
    - JWT issue time validation
    - Uncaught error handling

## 🔐 Security Features

1. **Rate Limiting**
    - Prevents brute force attacks
    - Configurable limits per endpoint
    - Progressive delays for failed login attempts

2. **JWT Security**
    - Token expiration
    - Issue time validation
    - Secure token storage practices

3. **Data Protection**
    - Password hashing with bcrypt
    - Input validation and sanitization
    - SQL injection protection

## 🔄 Further Improvements

1. **Authentication Enhancements**
    - Implement refresh token endpoint
    - Add OAuth 2.0 support
    - Implement 2FA

2. **Performance Optimizations**
    - Implement Redis for:
        - Rate limiting store
        - Cache storage

3. **Architecture Improvements**
    - Implement dependency injection

4. **Developer Experience**
    - Implement CI/CD pipeline
    - Add Docker support
    - Add Kubernetes configurations

5. **Monitoring & Logging**
    - Add performance monitoring
    - Implement error tracking

6. **Security Enhancements**
    - Add API key management
    - Implement IP whitelisting
    - Implement CORS properly

## 📖 API Documentation

### Base URL

- Local Development: `http://localhost:3000/v1`
- Production: `https://spinada.tural.pro/v1`

### Authentication Endpoints

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

### Data Endpoints

#### Get Combined Weather and Crypto Data

```http
GET /data?city=London&currency=BTC&refresh=false
Authorization: Bearer <your_token>
```

Query Parameters:

- `city`: City name for weather data (required)
- `currency`: Cryptocurrency symbol (required)
- `refresh`: Force cache refresh (optional, default: false)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- SQLite (included)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/turalAsgar/spinada-task.git
cd spinada-task
```

2. Install dependencies:

```bash
npm install
```

3. Create a .env file(or copy .env.example):

```env
PORT=your_port_number
DATABASE_PATH=your_sqlite_database_path
JWT_SECRET=your_jwt_secret
OPENWEATHER_API_KEY=your_openweather_api_key
COINGECKO_API_KEY=your_coingecko_api_key

```

4. Seed the database:

```bash
npm run seed
```

5. Start the development server:

```bash
npm run dev
```

## 💻 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript project
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run generate:types` - Generate TypeScript types from OpenAPI spec
- `npm start` - Start the production server

### API Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Postman Collection
A Postman collection is included in the [Spinada.postman_collection.json](Spinada.postman_collection.json) file. You can import this collection into Postman to test the API endpoints easily.
