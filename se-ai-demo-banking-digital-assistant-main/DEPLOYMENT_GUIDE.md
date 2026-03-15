# Consumer Lending Service - Deployment Guide

This guide provides comprehensive instructions for deploying the Consumer Lending Service in various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [Configuration Management](#configuration-management)
- [Monitoring and Logging](#monitoring-and-logging)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **Docker**: 20.x or higher (for containerized deployment)
- **Docker Compose**: 2.x or higher
- **Memory**: Minimum 2GB RAM
- **Storage**: Minimum 10GB available space

### External Dependencies

- **OAuth Provider**: PingOne AIC or compatible OAuth 2.0 provider
- **Load Balancer**: Nginx, HAProxy, or cloud load balancer (production)
- **Monitoring**: Prometheus, Grafana, or similar (optional)

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. OAuth Provider Configuration

#### PingOne AIC Setup

1. **Create Application**
   - Log into PingOne Admin Console
   - Navigate to Applications
   - Create new "Single Page App" for UI
   - Create new "Worker App" for API

2. **Configure Scopes**
   ```
   lending:read
   lending:credit:read
   lending:credit:limits
   lending:admin
   ```

3. **Set Redirect URIs**
   - Development: `http://localhost:3003/callback`
   - Production: `https://your-domain.com/callback`

4. **Note Configuration**
   - Issuer URL: `https://auth.pingone.com/{environment-id}/as`
   - Client ID and Secret for both applications

### 3. Environment Variables

Create environment-specific configuration files:

#### Development (.env.development)
```bash
# Server Configuration
NODE_ENV=development
PORT=3002

# OAuth Configuration
OAUTH_ISSUER_URL=https://auth.pingone.com/your-env-id/as
OAUTH_CLIENT_ID=your_development_client_id
OAUTH_CLIENT_SECRET=your_development_client_secret

# Security
SESSION_SECRET=dev_session_secret_32_chars_min
ENCRYPTION_KEY=dev_encryption_key_32_chars_min

# Lending Configuration
CREDIT_SCORE_TTL=3600
DEFAULT_CREDIT_LIMIT=5000
MINIMUM_CREDIT_SCORE=600

# CORS
CORS_ORIGIN=http://localhost:3003

# Logging
LOG_LEVEL=debug
```

#### Production (.env.production)
```bash
# Server Configuration
NODE_ENV=production
PORT=3002

# OAuth Configuration
OAUTH_ISSUER_URL=https://auth.pingone.com/your-prod-env-id/as
OAUTH_CLIENT_ID=your_production_client_id
OAUTH_CLIENT_SECRET=your_production_client_secret

# Security (Use strong, unique values)
SESSION_SECRET=prod_session_secret_64_chars_minimum_secure_random_string
ENCRYPTION_KEY=prod_encryption_key_32_chars_secure

# Lending Configuration
CREDIT_SCORE_TTL=7200
DEFAULT_CREDIT_LIMIT=5000
MINIMUM_CREDIT_SCORE=650

# CORS
CORS_ORIGIN=https://your-production-domain.com

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/app/logs

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Local Development

### 1. API Server Setup

```bash
cd lending_api_server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### 2. UI Application Setup

```bash
cd lending_api_ui

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm start
```

### 3. Verify Installation

```bash
# Check API health
curl http://localhost:3002/api/health

# Check UI
open http://localhost:3003
```

## Docker Deployment

### 1. Single Container Deployment

#### Build and Run API Server
```bash
cd lending_api_server

# Build image
docker build -t lending-api-server .

# Run container
docker run -d \
  --name lending-api \
  -p 3002:3002 \
  -e OAUTH_ISSUER_URL=your_issuer_url \
  -e OAUTH_CLIENT_ID=your_client_id \
  -e OAUTH_CLIENT_SECRET=your_client_secret \
  -e SESSION_SECRET=your_session_secret \
  -e ENCRYPTION_KEY=your_encryption_key \
  -v lending_data:/app/data/persistent \
  -v lending_logs:/app/logs \
  lending-api-server
```

#### Build and Run UI Application
```bash
cd lending_api_ui

# Build image
docker build -t lending-ui .

# Run container
docker run -d \
  --name lending-ui \
  -p 3003:3003 \
  -e REACT_APP_API_URL=http://localhost:3002 \
  -e REACT_APP_OAUTH_CLIENT_ID=your_ui_client_id \
  lending-ui
```

### 2. Docker Compose Deployment

#### Create Environment File
```bash
# Create .env file for docker-compose
cat > .env << EOF
OAUTH_ISSUER_URL=https://auth.pingone.com/your-env-id/as
LENDING_OAUTH_CLIENT_ID=your_client_id
LENDING_OAUTH_CLIENT_SECRET=your_client_secret
LENDING_SESSION_SECRET=your_session_secret
LENDING_ENCRYPTION_KEY=your_encryption_key
EOF
```

#### Deploy with Docker Compose
```bash
# Start all services
docker-compose -f docker-compose.lending.yml up -d

# View logs
docker-compose -f docker-compose.lending.yml logs -f

# Check status
docker-compose -f docker-compose.lending.yml ps

# Stop services
docker-compose -f docker-compose.lending.yml down
```

### 3. Docker Compose with Custom Network

```yaml
# docker-compose.override.yml
version: '3.8'

services:
  lending-api:
    networks:
      - lending-network
      - external-network

  lending-ui:
    networks:
      - lending-network
      - external-network

networks:
  lending-network:
    driver: bridge
  external-network:
    external: true
```

## Production Deployment

### 1. Infrastructure Requirements

#### Minimum Production Setup
- **API Server**: 2 CPU cores, 4GB RAM
- **UI Server**: 1 CPU core, 2GB RAM
- **Load Balancer**: 1 CPU core, 1GB RAM
- **Storage**: 50GB SSD for logs and data

#### Recommended Production Setup
- **API Server**: 4 CPU cores, 8GB RAM (2+ instances)
- **UI Server**: 2 CPU cores, 4GB RAM (2+ instances)
- **Load Balancer**: 2 CPU cores, 4GB RAM (HA setup)
- **Database**: Dedicated database server (future enhancement)
- **Storage**: 200GB SSD with backup

### 2. Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  lending-api:
    image: lending-api-server:latest
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
    environment:
      - NODE_ENV=production
    volumes:
      - /opt/lending/data:/app/data/persistent
      - /opt/lending/logs:/app/logs
    networks:
      - lending-network
    restart: unless-stopped

  lending-ui:
    image: lending-ui:latest
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 2G
    networks:
      - lending-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf
      - /etc/ssl/certs:/etc/ssl/certs
    depends_on:
      - lending-api
      - lending-ui
    networks:
      - lending-network
    restart: unless-stopped

networks:
  lending-network:
    driver: bridge
```

### 3. Nginx Load Balancer Configuration

```nginx
# nginx.prod.conf
events {
    worker_connections 1024;
}

http {
    upstream lending_api {
        server lending-api:3002;
        # Add more API servers for load balancing
        # server lending-api-2:3002;
    }

    upstream lending_ui {
        server lending-ui:3003;
        # Add more UI servers for load balancing
        # server lending-ui-2:3003;
    }

    # API Server Proxy
    server {
        listen 80;
        server_name api.yourdomain.com;

        location / {
            proxy_pass http://lending_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # UI Application Proxy
    server {
        listen 80;
        server_name lending.yourdomain.com;

        location / {
            proxy_pass http://lending_ui;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 4. SSL/TLS Configuration

#### Using Let's Encrypt
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d api.yourdomain.com -d lending.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Manual SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/ssl/certs/api.yourdomain.com.crt;
    ssl_certificate_key /etc/ssl/private/api.yourdomain.com.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://lending_api;
        # ... proxy headers
    }
}
```

## Configuration Management

### 1. Environment-Specific Configurations

#### Development
```bash
# lending_api_server/.env.development
NODE_ENV=development
LOG_LEVEL=debug
CREDIT_SCORE_TTL=60
RATE_LIMIT_MAX_REQUESTS=10000
```

#### Staging
```bash
# lending_api_server/.env.staging
NODE_ENV=staging
LOG_LEVEL=info
CREDIT_SCORE_TTL=1800
RATE_LIMIT_MAX_REQUESTS=1000
```

#### Production
```bash
# lending_api_server/.env.production
NODE_ENV=production
LOG_LEVEL=warn
CREDIT_SCORE_TTL=7200
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Configuration Validation

```bash
# Validate configuration before deployment
cd lending_api_server
npm run validate-config

# Check environment variables
node -e "
const config = require('./config/environments');
try {
  config.validateConfig();
  console.log('✓ Configuration valid');
} catch (error) {
  console.error('✗ Configuration error:', error.message);
  process.exit(1);
}
"
```

### 3. Secrets Management

#### Using Docker Secrets
```yaml
# docker-compose.secrets.yml
version: '3.8'

services:
  lending-api:
    secrets:
      - oauth_client_secret
      - session_secret
      - encryption_key
    environment:
      - OAUTH_CLIENT_SECRET_FILE=/run/secrets/oauth_client_secret

secrets:
  oauth_client_secret:
    file: ./secrets/oauth_client_secret.txt
  session_secret:
    file: ./secrets/session_secret.txt
  encryption_key:
    file: ./secrets/encryption_key.txt
```

#### Using External Secret Management
```bash
# Example with AWS Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id lending-service/oauth \
  --query SecretString --output text | \
  jq -r '.client_secret'
```

## Monitoring and Logging

### 1. Application Monitoring

#### Health Check Endpoints
```bash
# Basic health check
curl http://localhost:3002/api/health

# Detailed health check (admin required)
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3002/api/health/detailed
```

#### Prometheus Metrics (Future Enhancement)
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'lending-api'
    static_configs:
      - targets: ['lending-api:3002']
    metrics_path: '/metrics'
```

### 2. Logging Configuration

#### Centralized Logging with Docker
```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  lending-api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=lending-api"

  lending-ui:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=lending-ui"
```

#### Log Aggregation
```bash
# Using ELK Stack
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  elasticsearch:7.14.0

docker run -d \
  --name kibana \
  -p 5601:5601 \
  --link elasticsearch:elasticsearch \
  kibana:7.14.0
```

### 3. Alerting

#### Basic Alerting Script
```bash
#!/bin/bash
# health-check-alert.sh

API_URL="http://localhost:3002/api/health"
WEBHOOK_URL="your_slack_webhook_url"

response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $response -ne 200 ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"🚨 Lending API is down! Status: '$response'"}' \
        $WEBHOOK_URL
fi
```

## Security Considerations

### 1. Network Security

#### Firewall Rules
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3002/tcp   # Block direct API access
sudo ufw deny 3003/tcp   # Block direct UI access
sudo ufw enable
```

#### Docker Network Isolation
```yaml
# Isolate services in custom networks
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external access
```

### 2. Application Security

#### Security Headers
```javascript
// In server.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

#### Rate Limiting
```javascript
// Enhanced rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});
```

### 3. Data Protection

#### Encryption at Rest
```javascript
// Encrypt sensitive data
const crypto = require('crypto');

function encryptData(data, key) {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
```

#### Secure Headers
```nginx
# In nginx configuration
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

## Troubleshooting

### 1. Common Issues

#### OAuth Authentication Failures
```bash
# Check OAuth configuration
curl -v http://localhost:3002/api/health/detailed

# Verify token
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3002/api/users/me
```

#### Port Conflicts
```bash
# Check what's using the port
lsof -i :3002
netstat -tulpn | grep :3002

# Kill process if needed
sudo kill -9 $(lsof -t -i:3002)
```

#### Docker Issues
```bash
# Check container logs
docker logs lending-api
docker logs lending-ui

# Check container status
docker ps -a

# Restart containers
docker-compose -f docker-compose.lending.yml restart
```

### 2. Performance Issues

#### Memory Usage
```bash
# Check memory usage
docker stats

# Increase memory limits
docker run --memory=4g lending-api-server
```

#### Database Performance
```bash
# Check data file sizes
du -sh lending_api_server/data/persistent/

# Clean up old logs
find lending_api_server/logs -name "*.log" -mtime +7 -delete
```

### 3. Debugging

#### Enable Debug Mode
```bash
# API Server
LOG_LEVEL=debug npm run dev

# UI Application
REACT_APP_DEBUG_MODE=true npm start
```

#### Network Debugging
```bash
# Test connectivity
curl -v http://localhost:3002/api/health
telnet localhost 3002

# Check DNS resolution
nslookup api.yourdomain.com
```

### 4. Recovery Procedures

#### Backup and Restore
```bash
# Backup data
tar -czf lending-backup-$(date +%Y%m%d).tar.gz \
    lending_api_server/data/persistent/ \
    lending_api_server/logs/

# Restore data
tar -xzf lending-backup-20240115.tar.gz
```

#### Rollback Deployment
```bash
# Rollback to previous version
docker-compose -f docker-compose.lending.yml down
docker tag lending-api-server:latest lending-api-server:backup
docker tag lending-api-server:previous lending-api-server:latest
docker-compose -f docker-compose.lending.yml up -d
```

## Support and Maintenance

### 1. Regular Maintenance

#### Weekly Tasks
- Check application logs for errors
- Verify backup integrity
- Update security patches
- Monitor resource usage

#### Monthly Tasks
- Review and rotate logs
- Update dependencies
- Performance optimization
- Security audit

### 2. Monitoring Checklist

- [ ] API health endpoints responding
- [ ] UI application accessible
- [ ] OAuth authentication working
- [ ] Database/file storage healthy
- [ ] Logs being generated properly
- [ ] No critical errors in logs
- [ ] Resource usage within limits
- [ ] SSL certificates valid

### 3. Emergency Contacts

- **Development Team**: dev-team@company.com
- **Infrastructure Team**: infra@company.com
- **Security Team**: security@company.com
- **On-call Engineer**: +1-555-ON-CALL

For immediate assistance, check the troubleshooting section first, then contact the appropriate team based on the issue type.