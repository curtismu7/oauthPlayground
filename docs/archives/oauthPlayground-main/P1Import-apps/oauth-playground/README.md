# PingOne OAuth 2.0 & OpenID Connect Playground

An interactive playground for learning, testing, and mastering OAuth 2.0 and OpenID Connect with PingOne.

## Features

- Interactive OAuth 2.0 flows:
  - Authorization Code Flow
  - PKCE (Proof Key for Code Exchange)
  - Implicit Flow
  - Client Credentials
  - Device Code Flow
- OpenID Connect integration
- Real-time token inspection and validation
- Comprehensive documentation and guides
- Responsive design for all devices

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later) or yarn
- A PingOne account with an environment and application configured

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/oauth-playground.git
cd oauth-playground
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure your environment

Create a `.env` file in the root directory with your PingOne configuration:

```env
PINGONE_ENVIRONMENT_ID=your-environment-id
PINGONE_CLIENT_ID=your-client-id
PINGONE_REDIRECT_URI=http://localhost:3000/callback
PINGONE_API_URL=https://auth.pingone.com
```

### 4. Start the development server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/src
  /components      # Reusable UI components
  /contexts       # React contexts
  /hooks          # Custom React hooks
  /pages          # Page components
  /services       # API and service integrations
  /styles         # Global styles and theme
  /utils          # Utility functions
  App.jsx         # Main application component
  main.jsx        # Application entry point
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Ping Identity](https://www.pingidentity.com/) for their identity and access management solutions
- [React](https://reactjs.org/) for the UI library
- [Vite](https://vitejs.dev/) for the build tool
- [Styled Components](https://styled-components.com/) for styling
- [React Router](https://reactrouter.com/) for routing
