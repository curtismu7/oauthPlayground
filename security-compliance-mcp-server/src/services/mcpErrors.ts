/**
 * Decoupled error handler for compliance checking operations
 */

export class ComplianceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'ComplianceError';
  }
}

export class ValidationError extends ComplianceError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class DiscoveryError extends ComplianceError {
  constructor(message: string) {
    super(message, 'DISCOVERY_ERROR', 502);
    this.name = 'DiscoveryError';
  }
}

export class ConfigurationError extends ComplianceError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR', 400);
    this.name = 'ConfigurationError';
  }
}

export interface ErrorResponse {
  error: string;
  code: string;
  message: string;
  statusCode: number;
}

export function handleError(error: unknown): ErrorResponse {
  if (error instanceof ComplianceError) {
    return {
      error: error.name,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.name,
      code: 'INTERNAL_ERROR',
      message: error.message,
      statusCode: 500,
    };
  }

  return {
    error: 'Unknown Error',
    code: 'UNKNOWN_ERROR',
    message: String(error),
    statusCode: 500,
  };
}
