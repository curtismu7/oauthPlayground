// src/services/errorHandlingService.demo.ts
// Demonstration of ErrorHandlingService capabilities

import { ErrorHandlingService, ErrorType } from './errorHandlingService';

console.log('🚀 ErrorHandlingService Demonstration\n');

// Demonstrate error classification
console.log('📋 Error Classification Examples:');
const testErrors = [
  new Error('Network request failed'),
  new Error('invalid_client: Bad credentials'),
  new Error('invalid_request: Missing parameter'),
  { status: 500, message: 'Internal server error' },
  { status: 429, message: 'Too many requests' },
  new Error('Request timed out')
];

testErrors.forEach((error, index) => {
  const errorType = ErrorHandlingService.classifyError(error);
  console.log(`  ${index + 1}. "${error.message || error}" → ${errorType}`);
});

console.log('\n💬 User-Friendly Messages:');
Object.values(ErrorType).forEach(errorType => {
  const message = ErrorHandlingService.getUserFriendlyMessage(errorType);
  console.log(`  ${errorType}: ${message}`);
});

console.log('\n🔧 Complete Error Handling Flow:');
const networkError = new Error('Failed to connect to PingOne');
const errorResponse = ErrorHandlingService.handleFlowError(networkError, {
  flowId: 'demo-flow',
  stepId: 'token-request',
  metadata: {
    environmentId: 'demo-env',
    authMethod: 'client_secret_post'
  }
});

console.log('Error Response:', {
  type: errorResponse.type,
  severity: errorResponse.severity,
  shouldRetry: errorResponse.shouldRetry,
  contactSupport: errorResponse.contactSupport,
  recoveryOptionsCount: errorResponse.recoveryOptions.length,
  correlationId: errorResponse.correlationId
});

console.log('\n📊 Recovery Options:');
errorResponse.recoveryOptions.forEach((option, index) => {
  console.log(`  ${index + 1}. ${option.label} (${option.primary ? 'PRIMARY' : 'secondary'})`);
});

console.log('\n✅ ErrorHandlingService Demo Complete!');
console.log('The service provides comprehensive error handling with classification,');
console.log('user-friendly messages, recovery options, and analytics tracking.');
