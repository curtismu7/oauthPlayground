import { logger } from './logger.js';

export class McpError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'McpError';
    logger.error(`[${code}] ${message}`);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

export class ValidationError extends McpError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
    this.name = 'ValidationError';
  }
}

export class ConfigError extends McpError {
  constructor(message: string) {
    super('CONFIG_ERROR', message, 400);
    this.name = 'ConfigError';
  }
}

export class FlowError extends McpError {
  constructor(message: string) {
    super('FLOW_ERROR', message, 400);
    this.name = 'FlowError';
  }
}

export class TokenError extends McpError {
  constructor(message: string) {
    super('TOKEN_ERROR', message, 400);
    this.name = 'TokenError';
  }
}
