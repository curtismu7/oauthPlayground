// Demo: How to use the new React components
// This shows how developers would integrate the new tools

import React from 'react';
import ServiceDiscoveryBrowser from './components/ServiceDiscoveryBrowser';
import ConfigurationManager from './components/ConfigurationManager';
import { FlowType, Environment } from './services/enhancedConfigurationService';

// Example 1: Service Discovery Browser
// This component provides an interactive way to explore all available services
function ServiceDiscoveryPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <ServiceDiscoveryBrowser
        initialFlowType={FlowType.OAUTH_AUTHORIZATION_CODE}
        showStatistics={true}
      />
    </div>
  );
}

// Example 2: Configuration Manager
// This component allows editing and validating flow configurations
function ConfigurationPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <ConfigurationManager
        initialFlowType={FlowType.OIDC_AUTHORIZATION_CODE}
        initialEnvironment={Environment.DEVELOPMENT}
      />
    </div>
  );
}

// Example 3: Using the enhanced Error Boundary
// The ErrorBoundary now uses the ErrorHandlingService automatically
import ErrorBoundary from './components/ErrorBoundary';

function AppWithErrorHandling() {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong. Please try again.</div>}
      onError={(error, errorInfo) => {
        console.log('Error caught by boundary:', error, errorInfo);
      }}
    >
      <YourAppComponents />
    </ErrorBoundary>
  );
}

// Example 4: Programmatic usage of services
import { ServiceDiscoveryService, EnhancedConfigurationService } from './services/';

// Get service recommendations for a flow
const recommendations = ServiceDiscoveryService.getServiceRecommendations(
  FlowType.OAUTH_AUTHORIZATION_CODE
);

// Get validated configuration
const config = EnhancedConfigurationService.getFlowConfig(
  FlowType.OIDC_HYBRID,
  Environment.PRODUCTION
);

// Validate configuration
const validation = EnhancedConfigurationService.validateConfiguration(config);

// Export configuration for backup
const configJson = EnhancedConfigurationService.exportConfiguration(
  FlowType.OAUTH_CLIENT_CREDENTIALS
);

export {
  ServiceDiscoveryPage,
  ConfigurationPage,
  AppWithErrorHandling
};
