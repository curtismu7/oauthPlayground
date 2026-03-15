# Consumer Lending Service

A comprehensive consumer lending platform consisting of a secure API server and intuitive web interface for credit assessment and lending operations.

## Overview

The Consumer Lending Service provides:

- **Secure Credit Assessment**: OAuth-protected credit scoring and limit determination
- **User Management**: Comprehensive user profile and data management
- **Administrative Tools**: Admin panel for system management and reporting
- **Real-time Operations**: Live credit calculations and risk assessment
- **Audit Compliance**: Complete audit trails and logging

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Lending UI    │────│  Lending API    │────│  OAuth Provider │
│   (React App)   │    │  (Express.js)   │    │   (PingOne)     │
│   Port: 3003    │    │   Port: 3002    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         └───────────────────────┼─────────────────────────────────
                                 │
                    ┌─────────────────┐
                    │   Data Store    │
                    │ (JSON + Memory) │
                    └─────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- OAuth provider (PingOne AIC)
- Docker (optional)

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Set up the API server**
   ```bash
   cd lending_api_server
   npm install
   cp .env.example .env
   # Configure .env with your OAuth settings
   npm start
   ```

3. **Set up the UI (in a new terminal)**
   ```bash
   cd lending_api_ui
   npm install
   cp .env.example .env
   # Configure .env with API and OAuth settings
   npm start
   ```

4. **Access the application**
   - UI: http://localhost:3003
   - API: http://localhost:3002

### Option 2: Docker Deployment

1. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose -f docker-compose.lending.yml up -d
   ```

3. **Access the application**
   - UI: http://localhost:3003
   - API: http://localhost:3002

## Configuration

### Required Environment Variables

Create `.env` file in the root directory:

```bash
# OAuth Configuration (Required)
OAUTH_ISSUER_URL=https://auth.pingone.com/your-environment-id/as
LENDING_OAUTH_CLIENT_ID=your_lending_client_id
LENDING_OAUTH_CLIENT_SECRET=your_lending_client_secret

# Security (Required)
LENDING_SESSION_SECRET=your_secure_session_secret_here
LENDING_ENCRYPTION_KEY=your_32_character_encryption_key

# Optional Configuration
CREDIT_SCORE_TTL=3600
DEFAULT_CREDIT_LIMIT=5000
MINIMUM_CREDIT_SCORE=600
```

### OAuth Setup

1. **Create OAuth Application** in your PingOne environment
2. **Configure Redirect URIs**:
   - `http://localhost:3003/callback` (development)
   - `https://your-domain.com/callback` (production)
3. **Set Required Scopes**:
   - `lending:read`
   - `lending:credit:read`
   - `lending:credit:limits`
   - `lending:admin`

## Services

### Lending API Server

**Location**: `lending_api_server/`
**Port**: 3002
**Technology**: Node.js, Express.js

**Key Features**:
- OAuth 2.0 authentication
- Credit scoring algorithms
- Credit limit calculations
- User profile management
- Administrative endpoints
- Comprehensive logging

**API Endpoints**:
- `/api/users` - User management
- `/api/credit` - Credit operations
- `/api/admin` - Administrative functions
- `/api/health` - Health monitoring

### Lending UI Application

**Location**: `lending_api_ui/`
**Port**: 3003
**Technology**: React, Create React App

**Key Features**:
- OAuth authentication flow
- User search and management
- Credit assessment interface
- Administrative dashboard
- Error handling and offline support
- Responsive design

## User Roles and Permissions

### Lending Officer
- **Scopes**: `lending:read`, `lending:credit:read`, `lending:credit:limits`
- **Capabilities**:
  - View user profiles
  - Access credit scores
  - Determine credit limits
  - Generate credit assessments

### Administrator
- **Scopes**: All lending scopes + `lending:admin`
- **Capabilities**:
  - All lending officer functions
  - User management
  - System configuration
  - Credit recalculation
  - Reporting and analytics

## Development

### Project Structure

```
├── lending_api_server/          # Backend API service
│   ├── server.js               # Main application
│   ├── config/                 # Configuration files
│   ├── middleware/             # Express middleware
│   ├── routes/                 # API routes
│   ├── services/               # Business logic
│   ├── data/                   # Data storage
│   └── src/__tests__/          # Test suites
├── lending_api_ui/             # Frontend React app
│   ├── src/                    # Source code
│   ├── public/                 # Static assets
│   └── build/                  # Production build
├── docker-compose.lending.yml  # Docker composition
└── LENDING_SERVICE_README.md   # This file
```

### Development Workflow

1. **Start API server**
   ```bash
   cd lending_api_server
   npm run dev
   ```

2. **Start UI application**
   ```bash
   cd lending_api_ui
   npm start
   ```

3. **Run tests**
   ```bash
   # API tests
   cd lending_api_server
   npm test

   # UI tests
   cd lending_api_ui
   npm test
   ```

### Available Scripts

#### API Server
```bash
npm run dev          # Development with hot reload
npm start            # Production server
npm test             # Run all tests
npm run test:e2e     # End-to-end tests
npm run lint         # Code linting
```

#### UI Application
```bash
npm start            # Development server
npm run build        # Production build
npm test             # Run tests
npm run test:coverage # Test coverage
```

## Testing

### Test Coverage

The service includes comprehensive testing:

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint and service integration
- **End-to-End Tests**: Complete user workflow testing
- **Performance Tests**: Load and stress testing

### Running Tests

```bash
# Run all tests for both services
./run-all-tests.sh

# API server tests only
cd lending_api_server && npm test

# UI application tests only
cd lending_api_ui && npm test
```

## Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export OAUTH_ISSUER_URL=https://your-production-oauth-provider
   # ... other production variables
   ```

2. **Build Applications**
   ```bash
   # Build API server
   cd lending_api_server
   npm ci --only=production

   # Build UI application
   cd lending_api_ui
   npm ci
   npm run build
   ```

3. **Deploy with Docker**
   ```bash
   docker-compose -f docker-compose.lending.yml up -d
   ```

### Scaling Considerations

- **Horizontal Scaling**: Multiple API server instances behind load balancer
- **Database Migration**: Move from JSON storage to PostgreSQL/MongoDB
- **Caching**: Implement Redis for session and data caching
- **CDN**: Serve UI static assets from CDN

## Monitoring and Logging

### Health Monitoring

- **API Health**: `GET /api/health`
- **Detailed Status**: `GET /api/health/detailed`
- **UI Health**: `GET /health` (nginx endpoint)

### Logging

Structured JSON logging with multiple levels:

```bash
# View API logs
tail -f lending_api_server/logs/info.log

# View error logs
tail -f lending_api_server/logs/error.log
```

### Metrics

The service exposes metrics for monitoring:

- Response times and error rates
- Credit calculation performance
- OAuth authentication success/failure rates
- User activity and system usage

## Security

### Security Features

- **OAuth 2.0 Authentication**: Industry-standard authentication
- **Scope-based Authorization**: Granular permission control
- **Data Encryption**: Sensitive data encrypted at rest
- **Audit Logging**: Complete audit trail of all operations
- **Rate Limiting**: Protection against abuse
- **CORS Protection**: Cross-origin request security

### Security Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS**: Always use HTTPS in production
3. **Token Management**: Proper OAuth token handling and refresh
4. **Input Validation**: Comprehensive input sanitization
5. **Error Handling**: Secure error messages without information leakage

## Troubleshooting

### Common Issues

1. **OAuth Authentication Failures**
   ```bash
   # Check OAuth configuration
   curl http://localhost:3002/api/health/detailed
   ```

2. **CORS Issues**
   - Verify CORS_ORIGIN in API server configuration
   - Check browser network tab for CORS errors

3. **Port Conflicts**
   - Change ports in environment configuration
   - Check for other services using ports 3002/3003

4. **Database Connection Issues**
   - Verify data directory permissions
   - Check disk space for JSON file storage

### Debug Mode

Enable debug logging:

```bash
# API Server
LOG_LEVEL=debug npm run dev

# UI Application
REACT_APP_DEBUG_MODE=true npm start
```

### Getting Help

1. **Check Service Health**
   ```bash
   curl http://localhost:3002/api/health
   curl http://localhost:3003/health
   ```

2. **Review Logs**
   ```bash
   # API logs
   tail -f lending_api_server/logs/error.log
   
   # Docker logs
   docker-compose -f docker-compose.lending.yml logs -f
   ```

3. **Validate Configuration**
   ```bash
   cd lending_api_server
   npm run validate-config
   ```

## API Documentation

### Authentication

All API endpoints require OAuth Bearer tokens:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3002/api/users/me
```

### Core Endpoints

#### Credit Assessment
```bash
# Get full credit assessment
GET /api/credit/:userId/assessment

# Response
{
  "userId": "user123",
  "creditScore": {
    "score": 720,
    "scoreDate": "2024-01-15T10:30:00Z"
  },
  "creditLimit": {
    "calculatedLimit": 15000,
    "riskLevel": "low"
  }
}
```

#### User Management
```bash
# Get user profile
GET /api/users/:id

# Search users (admin only)
GET /api/users?search=john&limit=10
```

For complete API documentation, see `lending_api_server/ADMIN_API_DOCUMENTATION.md`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For technical support:

1. Check the troubleshooting section
2. Review service logs
3. Validate configuration
4. Test with minimal setup

For feature requests and bug reports, please create an issue in the repository.