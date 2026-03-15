# Consumer Lending API Server

A secure, OAuth-protected API service for consumer lending operations including credit scoring, limit determination, and user management.

## Features

- **OAuth 2.0 Authentication**: Secure API access with scope-based authorization
- **Credit Scoring**: Calculate and retrieve user credit scores
- **Credit Limits**: Determine appropriate credit limits based on risk assessment
- **User Management**: Comprehensive user profile and data management
- **Admin Operations**: Administrative endpoints for system management
- **Comprehensive Logging**: Structured logging and audit trails
- **Health Monitoring**: Built-in health checks and monitoring endpoints

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OAuth provider (PingOne AIC or compatible)

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd lending_api_server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

The server will start on `http://localhost:3002`

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Server Configuration
PORT=3002
NODE_ENV=development

# OAuth Configuration (Required)
OAUTH_ISSUER_URL=https://auth.pingone.com/your-environment-id/as
OAUTH_CLIENT_ID=your_lending_client_id
OAUTH_CLIENT_SECRET=your_lending_client_secret

# Security (Required)
SESSION_SECRET=your_secure_session_secret_here
ENCRYPTION_KEY=your_32_character_encryption_key

# Lending Configuration
CREDIT_SCORE_TTL=3600
DEFAULT_CREDIT_LIMIT=5000
MINIMUM_CREDIT_SCORE=600
```

### OAuth Scopes

The service uses the following OAuth scopes:

- `lending:read` - Basic user and credit data access
- `lending:credit:read` - Credit score access
- `lending:credit:limits` - Credit limit access  
- `lending:admin` - Administrative access

## API Documentation

### Authentication

All endpoints require OAuth 2.0 Bearer tokens:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3002/api/users/me
```

### Core Endpoints

#### User Management
- `GET /api/users` - List all users (admin only)
- `GET /api/users/:id` - Get user profile
- `GET /api/users/me` - Get current user profile

#### Credit Operations
- `GET /api/credit/:userId/score` - Get credit score
- `GET /api/credit/:userId/limit` - Get credit limit
- `GET /api/credit/:userId/assessment` - Get full credit assessment

#### Administrative
- `GET /api/admin/users` - Admin user management
- `GET /api/admin/credit/reports` - Credit reporting
- `POST /api/admin/credit/recalculate` - Trigger recalculation

#### System
- `GET /api/health` - Health check
- `GET /api/health/detailed` - Detailed system status

### Example Requests

#### Get User Credit Assessment
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:3002/api/credit/user123/assessment
```

Response:
```json
{
  "userId": "user123",
  "creditScore": {
    "score": 720,
    "scoreDate": "2024-01-15T10:30:00Z",
    "factors": {
      "paymentHistory": 35,
      "creditUtilization": 30,
      "creditLength": 15,
      "creditMix": 10,
      "newCredit": 10
    }
  },
  "creditLimit": {
    "calculatedLimit": 15000,
    "approvedLimit": 15000,
    "riskLevel": "low"
  }
}
```

## Development

### Project Structure

```
lending_api_server/
├── server.js              # Main application entry
├── package.json           # Dependencies and scripts
├── config/               # Configuration files
│   ├── oauth.js          # OAuth configuration
│   ├── scopes.js         # Scope definitions
│   └── environments.js   # Environment configs
├── middleware/           # Express middleware
│   ├── auth.js           # Authentication middleware
│   ├── activityLogger.js # Activity logging
│   └── oauthErrorHandler.js # OAuth error handling
├── routes/               # API route handlers
│   ├── users.js          # User management routes
│   ├── credit.js         # Credit operation routes
│   ├── admin.js          # Administrative routes
│   └── health.js         # Health check routes
├── services/             # Business logic services
│   ├── CreditScoringService.js
│   └── CreditLimitService.js
├── data/                 # Data storage
│   ├── store.js          # Data store implementation
│   └── sampleData.js     # Sample/seed data
├── utils/                # Utility functions
│   ├── logger.js         # Logging utilities
│   └── healthMonitor.js  # Health monitoring
└── src/__tests__/        # Test suites
```

### Available Scripts

```bash
# Development
npm run dev          # Start with nodemon
npm run dev:debug    # Start with debugging

# Production
npm start            # Start production server

# Testing
npm test             # Run all tests
npm run test:unit    # Run unit tests only
npm run test:integration # Run integration tests
npm run test:e2e     # Run end-to-end tests
npm run test:coverage # Run tests with coverage

# Linting
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues

# Utilities
npm run logs         # View application logs
npm run health       # Check service health
```

### Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

Test files are located in `src/__tests__/` and follow the naming convention `*.test.js`.

## Docker Deployment

### Build and Run

```bash
# Build the image
docker build -t lending-api-server .

# Run the container
docker run -p 3002:3002 \
  -e OAUTH_ISSUER_URL=your_issuer_url \
  -e OAUTH_CLIENT_ID=your_client_id \
  -e OAUTH_CLIENT_SECRET=your_client_secret \
  -e SESSION_SECRET=your_session_secret \
  -e ENCRYPTION_KEY=your_encryption_key \
  lending-api-server
```

### Docker Compose

Use the provided `docker-compose.lending.yml`:

```bash
# Start all services
docker-compose -f docker-compose.lending.yml up -d

# View logs
docker-compose -f docker-compose.lending.yml logs -f

# Stop services
docker-compose -f docker-compose.lending.yml down
```

## Monitoring and Logging

### Health Checks

- **Basic**: `GET /api/health` - Simple health status
- **Detailed**: `GET /api/health/detailed` - Comprehensive system status

### Logging

Structured JSON logging with configurable levels:

```bash
# View logs
tail -f logs/info.log
tail -f logs/error.log
tail -f logs/warn.log
```

Log levels: `error`, `warn`, `info`, `debug`

### Monitoring

The service exposes metrics for monitoring:

- Response times
- Error rates  
- Credit calculation performance
- OAuth authentication metrics

## Security

### Best Practices

- All endpoints require OAuth authentication
- Sensitive data is encrypted at rest
- Comprehensive audit logging
- Rate limiting on all endpoints
- CORS protection
- Security headers

### Data Protection

- PII data encryption
- Secure token handling
- Audit trail for all operations
- Configurable data retention

## Troubleshooting

### Common Issues

1. **OAuth Authentication Failures**
   ```bash
   # Check OAuth configuration
   curl http://localhost:3002/api/health/detailed
   ```

2. **Port Already in Use**
   ```bash
   # Change port in .env file
   PORT=3012
   ```

3. **Missing Environment Variables**
   ```bash
   # Validate configuration
   npm run validate-config
   ```

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

### Support

For issues and questions:

1. Check the logs: `npm run logs`
2. Verify configuration: `npm run health`
3. Run diagnostics: `npm run test:integration`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.