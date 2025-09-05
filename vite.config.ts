import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react(), basicSsl()],
    server: {
      port: 3000,
      open: true,
      https: true, // Enable HTTPS in development
      // In production, Vercel will handle HTTPS
      // In development, basic-ssl plugin provides self-signed certificates
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false, // Allow self-signed certificates
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    define: {
      // Expose environment variables to the client
      __PINGONE_ENVIRONMENT_ID__: JSON.stringify(env.PINGONE_ENVIRONMENT_ID),
      __PINGONE_CLIENT_ID__: JSON.stringify(env.PINGONE_CLIENT_ID),
      __PINGONE_CLIENT_SECRET__: JSON.stringify(env.PINGONE_CLIENT_SECRET),
      __PINGONE_REDIRECT_URI__: JSON.stringify(env.PINGONE_REDIRECT_URI),
      __PINGONE_LOGOUT_REDIRECT_URI__: JSON.stringify(env.PINGONE_LOGOUT_REDIRECT_URI),
      __PINGONE_API_URL__: JSON.stringify(env.PINGONE_API_URL),
      __PINGONE_APP_TITLE__: JSON.stringify(env.PINGONE_APP_TITLE),
      __PINGONE_APP_DESCRIPTION__: JSON.stringify(env.PINGONE_APP_DESCRIPTION),
      __PINGONE_APP_VERSION__: JSON.stringify(env.PINGONE_APP_VERSION),
      __PINGONE_APP_DEFAULT_THEME__: JSON.stringify(env.PINGONE_APP_DEFAULT_THEME),
      __PINGONE_DEV_SERVER_PORT__: JSON.stringify(env.PINGONE_DEV_SERVER_PORT),
      __PINGONE_DEV_SERVER_HTTPS__: JSON.stringify(env.PINGONE_DEV_SERVER_HTTPS),
      __PINGONE_FEATURE_DEBUG_MODE__: JSON.stringify(env.PINGONE_FEATURE_DEBUG_MODE),
      __PINGONE_FEATURE_ANALYTICS__: JSON.stringify(env.PINGONE_FEATURE_ANALYTICS),
    },
  };
});
