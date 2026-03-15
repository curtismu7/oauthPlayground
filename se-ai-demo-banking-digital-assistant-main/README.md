# Banking Services Docker Setup

This repository contains a complete banking services stack that can be run as Docker containers. The stack includes:

## Services Overview

| Service | Port | Description |
|---------|------|-------------|
| Banking API Server | 3001 | Core banking API backend (Node.js/Express) |
| Banking API UI | 3000 | Banking admin interface (React) |
| Banking MCP Server | 8080 | Model Context Protocol server (Node.js/TypeScript) |
| LangChain Agent Backend | 8081 | AI agent backend (Python/FastAPI) |
| LangChain Agent Frontend | 3002 | AI agent interface (React) |
| LangChain Trace Server | 8082 | Tracing and monitoring (Python) |

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM
- Ports 3000, 3001, 3002, 8080, 8081, 8082 available

### 1. Start All Services

```bash
./start-all-services.sh
```

This script will:
- Check Docker availability
- Create necessary directories
- Copy example environment files if needed
- Build and start all containers
- Perform health checks

### 2. Access Services

Once started, you can access:

- **Banking Admin UI**: http://localhost:3000
- **Banking API**: http://localhost:3001
- **LangChain Agent UI**: http://localhost:3002
- **MCP Server**: http://localhost:8080
- **LangChain Backend**: http://localhost:8081
- **Trace Server**: http://localhost:8082

### 3. Check Service Health

```bash
./check-services.sh
```

### 4. Stop All Services

```bash
./stop-all-services.sh
```

## Manual Docker Commands

### Start services
```bash
docker-compose up -d
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f banking-api-server
```

### Restart a service
```bash
docker-compose restart banking-api-server
```

### Stop services
```bash
docker-compose down
```

### Clean up everything
```bash
docker-compose down -v --rmi all
```

## Environment Configuration

Each service requires environment variables. Example files are provided:

- `banking_api_server/.env.example` → `banking_api_server/.env`
- `banking_api_ui/.env.example` → `banking_api_ui/.env`
- `banking_mcp_server/.env.example` → `banking_mcp_server/.env.development`
- `langchain_agent/.env.example` → `langchain_agent/.env`

The startup script will automatically copy example files if the actual `.env` files don't exist.

## Development Mode

For development with hot reloading:

```bash
# Start specific services in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Or modify the main compose file to use development targets
```

## Troubleshooting

### Port Conflicts
If you get port conflicts, you can modify the ports in `docker-compose.yml`:

```yaml
ports:
  - "3001:3001"  # Change first number to use different host port
```

### Service Won't Start
1. Check logs: `docker-compose logs [service-name]`
2. Verify environment files exist and are properly configured
3. Ensure no other services are using the same ports
4. Check Docker resources (memory, disk space)

### Database/Data Issues
If you need to reset data:

```bash
# Stop services and remove volumes
docker-compose down -v

# Restart
./start-all-services.sh
```

### Trace Server Shows No Traces
The LangChain trace server and agent backend share trace files through a Docker volume named `langchain-visualizations`. If traces aren't appearing:

1. Verify both containers are running: `docker-compose ps`
2. Check that both containers can access the shared volume:
   ```bash
   docker exec langchain-agent-backend ls -la /app/visualizations
   docker exec langchain-trace-server ls -la /app/visualizations
   ```
3. Generate a test conversation through the LangChain Agent UI at http://localhost:3002
4. Check the trace server at http://localhost:8090

### Memory Issues
The stack requires significant resources. You can:

1. Increase Docker memory allocation
2. Start services individually:
   ```bash
   docker-compose up -d banking-api-server banking-api-ui
   ```

## Service Dependencies

The services have the following dependencies:

```
Banking API UI → Banking API Server
LangChain Agent Frontend → LangChain Agent Backend
LangChain Agent Backend → Banking MCP Server
```

Services will wait for their dependencies to be healthy before starting.

## Monitoring

### View Resource Usage
```bash
docker stats
```

### View Container Status
```bash
docker-compose ps
```

### Health Checks
All services include health checks that Docker monitors automatically. Unhealthy services will be restarted.

## Production Deployment

For production deployment:

1. Use production environment files
2. Configure proper secrets management
3. Set up reverse proxy (nginx/traefik)
4. Configure SSL certificates
5. Set up monitoring and logging
6. Use Docker Swarm or Kubernetes for orchestration

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│  Banking API UI │    │ LangChain Agent │
│   (React:3000)  │    │   UI (React:3002)│
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│ Banking API     │    │ LangChain Agent │
│ Server (Node:   │    │ Backend (Python:│
│        3001)    │    │         8081)   │
└─────────────────┘    └─────────┬───────┘
                                 │
                                 ▼
                       ┌─────────────────┐
                       │ Banking MCP     │
                       │ Server (Node:   │
                       │        8080)    │
                       └─────────────────┘
                                 │
                                 ▼
                       ┌─────────────────┐
                       │ LangChain Trace │
                       │ Server (Python: │
                       │        8082)    │
                       └─────────────────┘
```

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment configuration
3. Ensure all required ports are available
4. Check Docker resources and permissions