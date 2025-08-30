# Deployment Guide

## Overview
The PingOne OAuth Playground is a comprehensive educational tool for learning OAuth 2.0 and OpenID Connect with PingOne. This guide covers deployment options and configuration.

## Prerequisites
- Node.js 18+
- npm or yarn
- PingOne environment configured

## Local Development

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your PingOne configuration
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Production Deployment

### Netlify Deployment
1. Push code to Git repository
2. Connect repository to Netlify
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy

### Manual Build and Deploy
```bash
# Build the application
npm run build

# The built files will be in the 'dist' directory
# Deploy the 'dist' directory to your web server
```

## Configuration

### Required Environment Variables
```env
# PingOne Configuration
PINGONE_ENVIRONMENT_ID=your-environment-id
PINGONE_CLIENT_ID=your-client-id
PINGONE_CLIENT_SECRET=your-client-secret
PINGONE_REDIRECT_URI=https://yourdomain.com/callback
PINGONE_LOGOUT_REDIRECT_URI=https://yourdomain.com
PINGONE_API_URL=https://auth.pingone.com
PINGONE_AUTH_SERVER_ID=your-auth-server-id

# App Configuration
PINGONE_APP_TITLE="PingOne OAuth Playground"
PINGONE_APP_DESCRIPTION="Interactive playground for OAuth 2.0 and OpenID Connect with PingOne"
PINGONE_APP_VERSION=1.0.0
PINGONE_APP_DEFAULT_THEME=light

# Development Configuration (optional)
PINGONE_DEV_SERVER_PORT=3000
PINGONE_DEV_SERVER_HTTPS=false

# Feature Flags (optional)
PINGONE_FEATURE_DEBUG_MODE=false
PINGONE_FEATURE_ANALYTICS=false
```

### PingOne Setup
1. Create a PingOne environment
2. Create an OAuth 2.0 application
3. Configure redirect URIs
4. Note down client ID, client secret, and environment ID

## Features

### Available Pages
- **Dashboard** (`/`) - Main landing page with feature overview
- **OAuth Flows** (`/flows`) - Interactive OAuth flow demonstrations
- **Token Inspector** (`/inspector`) - JWT token analysis tool
- **Configuration** (`/config`) - PingOne settings management
- **Documentation** (`/docs`) - OAuth 2.0 and OpenID Connect guides
- **Login** (`/login`) - Authentication page
- **Callback** (`/callback`) - OAuth redirect handler

### OAuth Flows Supported
- Authorization Code Flow
- PKCE Flow
- Implicit Flow (deprecated)
- Client Credentials Flow
- Device Code Flow

### Educational Features
- Interactive flow demonstrations
- Token inspection and validation
- Real-time code examples
- Comprehensive documentation
- Configuration management

## Security Considerations

### Client-Side Limitations
- Client secrets should never be stored in client-side code
- Use PKCE for mobile/native applications
- Implement proper CORS policies
- Use HTTPS in production

### Best Practices
- Store sensitive configuration server-side
- Use environment variables for configuration
- Implement proper error handling
- Validate all user inputs
- Use secure redirect URIs

## Troubleshooting

### Common Issues
1. **Import Errors**: Ensure all dependencies are installed
2. **Build Errors**: Check Node.js version compatibility
3. **OAuth Errors**: Verify PingOne configuration
4. **CORS Issues**: Configure proper redirect URIs

### Debug Mode
Enable debug mode by setting:
```env
PINGONE_FEATURE_DEBUG_MODE=true
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test thoroughly
5. Submit a pull request

## License
This project is licensed under the MIT License.
