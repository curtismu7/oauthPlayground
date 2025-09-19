/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  Validator,
  validateOAuthConfig,
  validateTokenRequest,
  validateAuthorizationRequest,
  validateForm,
  sanitizeInput,
  sanitizeUrl,
  sanitizeOAuthConfig,
  validateWithErrorHandling,
  VALIDATION_PATTERNS,
  VALIDATION_MESSAGES
} from '../utils/validation';

// Mock the error handler
vi.mock('../utils/errorHandler', () => ({
  errorHandler: {
    handleError: vi.fn()
  }
}));

describe('Validator', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator();
  });

  describe('addRule', () => {
    it('should add validation rule', () => {
      validator.addRule({
        field: 'email',
        rules: [{ type: 'required' }]
      });

      expect(result.isValid).toBe(true);
    });
  });

  describe('validate', () => {
    it('should validate required fields', () => {
      validator.addRule({
        field: 'name',
        rules: [{ type: 'required' }]
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('REQUIRED');
    });

    it('should validate email format', () => {
      validator.addRule({
        field: 'email',
        rules: [{ type: 'email' }]
      });

      const validResult = validator.validate({ email: 'test@example.com' });
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate({ email: 'invalid-email' });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors[0].code).toBe('EMAIL');
    });

    it('should validate URL format', () => {
      validator.addRule({
        field: 'url',
        rules: [{ type: 'url' }]
      });

      const validResult = validator.validate({ url: 'https://example.com' });
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate({ url: 'not-a-url' });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors[0].code).toBe('URL');
    });

    it('should validate minimum length', () => {
      validator.addRule({
        field: 'password',
        rules: [{ type: 'minLength', value: 8 }]
      });

      const validResult = validator.validate({ password: 'password123' });
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate({ password: 'short' });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors[0].code).toBe('MIN_LENGTH');
    });

    it('should validate maximum length', () => {
      validator.addRule({
        field: 'description',
        rules: [{ type: 'maxLength', value: 100 }]
      });

      const validResult = validator.validate({ description: 'Short description' });
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate({ 
        description: 'A'.repeat(101) 
      });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors[0].code).toBe('MAX_LENGTH');
    });

    it('should validate pattern', () => {
      validator.addRule({
        field: 'clientId',
        rules: [{ type: 'pattern', value: VALIDATION_PATTERNS.CLIENT_ID }]
      });

      const validResult = validator.validate({ clientId: 'test-client-123' });
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate({ clientId: 'invalid@client' });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors[0].code).toBe('PATTERN');
    });

    it('should validate custom validator', () => {
      validator.addRule({
        field: 'age',
        rules: [{ 
          type: 'custom', 
          validator: (value) => value >= 18 
        }]
      });

      const validResult = validator.validate({ age: 25 });
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate({ age: 16 });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors[0].code).toBe('CUSTOM');
    });

    it('should handle multiple rules for same field', () => {
      validator.addRule({
        field: 'username',
        rules: [
          { type: 'required' },
          { type: 'minLength', value: 3 },
          { type: 'maxLength', value: 20 }
        ]
      });

      const validResult = validator.validate({ username: 'testuser' });
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate({ username: 'ab' });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toHaveLength(2); // required and minLength
    });

    it('should handle empty values correctly', () => {
      validator.addRule({
        field: 'optional',
        rules: [{ type: 'email' }]
      });

      expect(result.isValid).toBe(true); // Empty values should pass non-required validations
    });
  });

  describe('addCustomValidator', () => {
    it('should add custom validator', () => {
      validator.addCustomValidator('even', (value) => value % 2 === 0);
      validator.addRule({
        field: 'number',
        rules: [{ type: 'custom', validator: 'even' }]
      });

      const validResult = validator.validate({ number: 4 });
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate({ number: 3 });
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all rules', () => {
      validator.addRule({
        field: 'test',
        rules: [{ type: 'required' }]
      });

      validator.clear();

      expect(result.isValid).toBe(true);
    });
  });
});

describe('OAuth-specific validation', () => {
  describe('validateOAuthConfig', () => {
    it('should validate valid OAuth config', () => {

      expect(result.isValid).toBe(true);
    });

    it('should validate invalid OAuth config', () => {

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
    });
  });

  describe('validateTokenRequest', () => {
    it('should validate authorization code request', () => {
      const request = {
        grant_type: 'authorization_code',
        client_id: 'test-client-123',
        code: 'auth-code-123'
      };

      expect(result.isValid).toBe(true);
    });

    it('should validate refresh token request', () => {
      const request = {
        grant_type: 'refresh_token',
        client_id: 'test-client-123',
        refresh_token: 'refresh-token-123'
      };

      expect(result.isValid).toBe(true);
    });

    it('should validate invalid token request', () => {
      const request = {
        grant_type: 'invalid_grant',
        client_id: 'invalid@client'
      };

      expect(result.isValid).toBe(false);
    });
  });

  describe('validateAuthorizationRequest', () => {
    it('should validate valid authorization request', () => {
      const request = {
        client_id: 'test-client-123',
        redirect_uri: 'https://example.com/callback',
        response_type: 'code',
        scope: 'openid profile',
        state: 'random-state-123'
      };

      expect(result.isValid).toBe(true);
    });

    it('should validate invalid authorization request', () => {
      const request = {
        client_id: 'invalid@client',
        redirect_uri: 'not-a-url',
        response_type: 'invalid_type',
        scope: ''
      };

      expect(result.isValid).toBe(false);
    });
  });
});

describe('Form validation', () => {
  it('should validate form data', () => {
    const rules = [
      {
        field: 'name',
        rules: [{ type: 'required' }]
      },
      {
        field: 'email',
        rules: [{ type: 'email' }]
      }
    ];

    const validData = { name: 'John Doe', email: 'john@example.com' };
    const invalidData = { name: '', email: 'invalid-email' };

    const validResult = validateForm(validData, rules);
    const invalidResult = validateForm(invalidData, rules);

    expect(validResult.isValid).toBe(true);
    expect(invalidResult.isValid).toBe(false);
  });
});

describe('Sanitization', () => {
  describe('sanitizeInput', () => {
    it('should sanitize HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';

      expect(result).toBe('scriptalert("xss")/scriptHello');
    });

    it('should sanitize javascript protocol', () => {
      const input = 'javascript:alert("xss")';

      expect(result).toBe('alert("xss")');
    });

    it('should sanitize event handlers', () => {
      const input = 'onclick=alert("xss")';

      expect(result).toBe('alert("xss")');
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';

      expect(result).toBe('hello world');
    });
  });

  describe('sanitizeUrl', () => {
    it('should sanitize valid URL', () => {
      const url = 'https://example.com/path?query=value';

      expect(result).toBe(url);
    });

    it('should reject invalid protocol', () => {
      const url = 'javascript:alert("xss")';

      expect(result).toBe('');
    });

    it('should handle invalid URL', () => {
      const url = 'not-a-url';

      expect(result).toBe('');
    });
  });

  describe('sanitizeOAuthConfig', () => {
    it('should sanitize OAuth config', () => {

      expect(result.clientId).toBe('test-client-123');
      expect(result.redirectUri).toBe('https://example.com/callback');
      expect(result.scope).toBe('scriptalert("xss")/scriptopenid');
    });
  });
});

describe('Validation with error handling', () => {
  it('should handle validation errors gracefully', () => {
    const validator = new Validator();
    validator.addRule({
      field: 'test',
      rules: [{ type: 'required' }]
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });
});

describe('Validation patterns and messages', () => {
  it('should have correct validation patterns', () => {
    expect(VALIDATION_PATTERNS.EMAIL.test('test@example.com')).toBe(true);
    expect(VALIDATION_PATTERNS.EMAIL.test('invalid-email')).toBe(false);
    
    expect(VALIDATION_PATTERNS.URL.test('https://example.com')).toBe(true);
    expect(VALIDATION_PATTERNS.URL.test('not-a-url')).toBe(false);
    
    expect(VALIDATION_PATTERNS.CLIENT_ID.test('test-client-123')).toBe(true);
    expect(VALIDATION_PATTERNS.CLIENT_ID.test('invalid@client')).toBe(false);
  });

  it('should have validation messages', () => {
    expect(VALIDATION_MESSAGES.REQUIRED).toBe('This field is required');
    expect(VALIDATION_MESSAGES.EMAIL).toBe('Please enter a valid email address');
    expect(VALIDATION_MESSAGES.URL).toBe('Please enter a valid URL');
  });
});
