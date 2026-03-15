# Consumer Lending UI

A React-based web application for consumer lending operations, providing an intuitive interface for lending officers to assess credit applications and manage user data.

## Features

- **OAuth 2.0 Authentication**: Secure login with PingOne AIC integration
- **User Management**: Search, view, and manage user profiles
- **Credit Assessment**: View credit scores and limits in real-time
- **Admin Panel**: Administrative functions for system management
- **Responsive Design**: Mobile-friendly interface
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Offline Support**: Graceful handling of network issues

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Consumer Lending API Server running

### Installation

1. **Navigate to the project**
   ```bash
   cd lending_api_ui
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

4. **Start the development server**
   ```bash
   npm start
   ```

The application will open at `http://localhost:3003`

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:3002

# OAuth Configuration (Required)
REACT_APP_OAUTH_CLIENT_ID=your_lending_client_id
REACT_APP_OAUTH_ISSUER_URL=https://auth.pingone.com/your-environment-id/as
REACT_APP_OAUTH_REDIRECT_URI=http://localhost:3003/callback

# Application Configuration
REACT_APP_APP_NAME=Consumer Lending Service
REACT_APP_VERSION=1.0.0

# Feature Flags
REACT_APP_ENABLE_ADMIN_PANEL=true
REACT_APP_ENABLE_CREDIT_REPORTS=true
```

## User Guide

### Getting Started

1. **Login**: Click "Login" and authenticate with your OAuth provider
2. **Dashboard**: View the main lending officer dashboard
3. **User Lookup**: Search for users by name, email, or ID
4. **Credit Assessment**: View detailed credit information for selected users
5. **Admin Functions**: Access administrative features (if authorized)

### Main Features

#### Dashboard
- Overview of recent activities
- Quick access to common functions
- System status indicators

#### User Lookup
- Real-time search functionality
- Filter by various criteria
- Pagination for large result sets

#### Credit Assessment
- Current credit score display
- Credit limit information
- Risk level indicators
- Historical data trends

#### User Profile
- Complete user information
- Contact details
- Employment information
- Account status

#### Admin Panel
- User management functions
- System configuration
- Credit recalculation tools
- Reporting and analytics

### Navigation

- **Dashboard**: Main overview page
- **Users**: User search and management
- **Credit**: Credit assessment tools
- **Admin**: Administrative functions (admin users only)
- **Profile**: Current user profile and settings

## Development

### Project Structure

```
lending_api_ui/
├── public/               # Static assets
│   ├── index.html        # Main HTML template
│   └── favicon.ico       # Application icon
├── src/                  # Source code
│   ├── App.js            # Main application component
│   ├── index.js          # Application entry point
│   ├── components/       # React components
│   │   ├── Dashboard.js
│   │   ├── UserLookup.js
│   │   ├── CreditAssessment.js
│   │   ├── UserProfile.js
│   │   ├── AdminPanel.js
│   │   ├── ErrorBoundary.js
│   │   └── LoadingComponents.js
│   ├── services/         # API and utility services
│   │   ├── apiClient.js
│   │   ├── AuthService.js
│   │   ├── CreditService.js
│   │   └── UserService.js
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useCredit.js
│   │   └── useUsers.js
│   └── __tests__/        # Test files
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

### Available Scripts

```bash
# Development
npm start            # Start development server
npm run dev          # Alias for npm start

# Building
npm run build        # Build for production
npm run build:analyze # Build with bundle analysis

# Testing
npm test             # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run test:ci      # Run tests for CI/CD

# Linting
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues

# Utilities
npm run eject        # Eject from Create React App (irreversible)
```

### Component Development

#### Creating New Components

1. Create component file in `src/components/`
2. Follow naming convention: `ComponentName.js`
3. Include PropTypes for type checking
4. Add corresponding test file: `ComponentName.test.js`

Example component structure:
```jsx
import React from 'react';
import PropTypes from 'prop-types';

const MyComponent = ({ prop1, prop2 }) => {
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

MyComponent.propTypes = {
  prop1: PropTypes.string.required,
  prop2: PropTypes.number
};

export default MyComponent;
```

#### State Management

The application uses React hooks for state management:

- `useState` for local component state
- `useContext` for shared state
- Custom hooks for complex logic
- `useEffect` for side effects

#### API Integration

API calls are handled through service classes:

```jsx
import { CreditService } from '../services/CreditService';

const MyComponent = () => {
  const [creditData, setCreditData] = useState(null);
  
  useEffect(() => {
    const fetchCredit = async () => {
      try {
        const data = await CreditService.getCreditAssessment(userId);
        setCreditData(data);
      } catch (error) {
        console.error('Failed to fetch credit data:', error);
      }
    };
    
    fetchCredit();
  }, [userId]);
  
  return <div>{/* Render credit data */}</div>;
};
```

### Testing

#### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

#### Test Structure

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows

#### Writing Tests

Example test file:
```jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent prop1="test" />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });
  
  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Docker Deployment

### Build and Run

```bash
# Build the image
docker build -t lending-ui .

# Run the container
docker run -p 3003:3003 \
  -e REACT_APP_API_URL=http://your-api-server:3002 \
  -e REACT_APP_OAUTH_CLIENT_ID=your_client_id \
  lending-ui
```

### Docker Compose

Use the provided `docker-compose.lending.yml`:

```bash
# Start all services
docker-compose -f docker-compose.lending.yml up -d

# View logs
docker-compose -f docker-compose.lending.yml logs -f lending-ui

# Stop services
docker-compose -f docker-compose.lending.yml down
```

### Production Build

The Docker image uses a multi-stage build:

1. **Build Stage**: Compiles React application
2. **Production Stage**: Serves static files with Nginx

## Error Handling

### Error Boundaries

The application includes comprehensive error boundaries:

- **Global Error Boundary**: Catches all unhandled errors
- **Component Error Boundaries**: Isolate errors to specific features
- **Network Error Handling**: Graceful handling of API failures

### User Feedback

- **Loading States**: Visual indicators during API calls
- **Error Messages**: User-friendly error descriptions
- **Retry Mechanisms**: Automatic and manual retry options
- **Offline Indicators**: Network status awareness

### Debugging

Enable debug mode for development:

```bash
REACT_APP_DEBUG_MODE=true npm start
```

This enables:
- Detailed error logging
- API request/response logging
- Performance monitoring
- Redux DevTools (if applicable)

## Performance

### Optimization Techniques

- **Code Splitting**: Lazy loading of components
- **Memoization**: React.memo and useMemo for expensive operations
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Image Optimization**: Compressed and responsive images

### Monitoring

The application includes performance monitoring:

- **Core Web Vitals**: LCP, FID, CLS tracking
- **API Performance**: Request timing and error rates
- **User Experience**: Navigation and interaction metrics

## Accessibility

### WCAG Compliance

The application follows WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and descriptions
- **Color Contrast**: Sufficient contrast ratios
- **Focus Management**: Proper focus handling

### Testing Accessibility

```bash
# Run accessibility tests
npm run test:a11y

# Manual testing with screen reader
# Use NVDA, JAWS, or VoiceOver
```

## Browser Support

### Supported Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Polyfills

The application includes polyfills for:
- ES6+ features
- Fetch API
- IntersectionObserver
- ResizeObserver

## Troubleshooting

### Common Issues

1. **OAuth Authentication Failures**
   - Check OAuth configuration in `.env`
   - Verify redirect URI matches OAuth provider settings
   - Ensure API server is running and accessible

2. **API Connection Issues**
   - Verify `REACT_APP_API_URL` in `.env`
   - Check CORS configuration on API server
   - Ensure network connectivity

3. **Build Failures**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for TypeScript errors: `npm run type-check`
   - Verify environment variables are set

### Debug Tools

1. **React Developer Tools**: Browser extension for React debugging
2. **Network Tab**: Monitor API requests and responses
3. **Console Logs**: Check for JavaScript errors
4. **Application Tab**: Inspect localStorage and sessionStorage

### Getting Help

1. Check browser console for errors
2. Verify API server is running: `curl http://localhost:3002/api/health`
3. Test OAuth flow manually
4. Review application logs

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Run linting: `npm run lint:fix`
7. Commit your changes: `git commit -m "Add new feature"`
8. Push to your fork: `git push origin feature/new-feature`
9. Submit a pull request

### Code Standards

- Use ESLint configuration
- Follow React best practices
- Write comprehensive tests
- Document complex functionality
- Use TypeScript for type safety (if applicable)

## License

This project is licensed under the MIT License.