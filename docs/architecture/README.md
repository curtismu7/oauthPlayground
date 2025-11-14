# Architecture Documentation

System architecture, design patterns, and technical decisions.

## Contents

### [Services](services/)
Service layer architecture and implementations:
- Credential storage services
- Token management services
- API client services
- State management services

### [Components](components/)
React component architecture:
- Component hierarchy
- Shared components
- Flow-specific components
- UI patterns

### [Patterns](patterns/)
Design patterns and best practices:
- Service patterns
- Component patterns
- State management patterns
- Error handling patterns
- Async patterns

## System Overview

The PingOne OAuth Playground is built with:
- **Frontend**: React + TypeScript
- **Styling**: Styled Components
- **State**: React Context + Hooks
- **Storage**: Multi-tier (memory, localStorage, file system)
- **Testing**: Jest + React Testing Library

## Key Architectural Decisions

### Multi-Tier Storage
Credentials are stored in three tiers for reliability:
1. Memory cache (fastest)
2. Browser localStorage (persistent)
3. File system (backup)

### Flow Isolation
Each OAuth flow maintains isolated credentials to prevent cross-contamination.

### Worker Token Sharing
Worker tokens are shared across all flows for PingOne Management API access.

### Service Layer
Business logic is separated into services for testability and reusability.

## Design Principles

- **Separation of Concerns**: Clear boundaries between UI, business logic, and data
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Graceful degradation and user-friendly errors
- **Security**: Encrypted storage, secure token handling
- **Performance**: Caching, lazy loading, code splitting
- **Accessibility**: WCAG 2.1 AA compliance

## Component Structure

```
src/
├── components/        # Reusable UI components
├── flows/            # Flow-specific pages
├── services/         # Business logic services
├── hooks/            # Custom React hooks
├── types/            # TypeScript definitions
├── utils/            # Utility functions
└── contexts/         # React contexts
```

## Data Flow

1. User interacts with UI component
2. Component calls service method
3. Service performs business logic
4. Service updates storage
5. Storage change triggers re-render
6. UI reflects new state

## Extension Points

- Add new flows by creating flow components
- Add new services by implementing service interfaces
- Add new storage backends by extending storage manager
- Add new UI components using existing patterns
