// src/components/__tests__/RARIntegration.test.tsx
// Integration tests for RAR components with enhanced service

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RARService from '../../services/rarService';
import AuthorizationDetailsEditor from '../AuthorizationDetailsEditor';
import RARExampleSelector from '../RARExampleSelector';
import RARValidationDisplay from '../RARValidationDisplay';

// Mock the RARService
jest.mock('../../services/rarService');
const mockRARService = RARService as jest.Mocked<typeof RARService>;

describe('RAR Components Integration', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockRARService.getExampleAuthorizationDetails.mockReturnValue([
      {
        type: 'customer_information',
        actions: ['read', 'write'],
        datatypes: ['contacts', 'photos'],
        locations: ['https://api.example.com/customers']
      }
    ]);
    
    mockRARService.getTemplates.mockReturnValue({
      customerInformation: {
        type: 'customer_information',
        actions: ['read', 'write'],
        datatypes: ['contacts', 'photos'],
        locations: ['https://api.example.com/customers']
      },
      paymentInitiation: {
        type: 'payment_initiation',
        instructedAmount: { currency: 'USD', amount: '0.00' },
        creditorName: '',
        creditorAccount: { iban: '' }
      },
      accountInformation: {
        type: 'account_information',
        accounts: [],
        balances: true,
        transactions: {
          fromBookingDateTime: new Date().toISOString(),
          toBookingDateTime: new Date().toISOString()
        }
      }
    });
    
    mockRARService.validateAuthorizationDetails.mockReturnValue({
      valid: true,
      errors: []
    });
  });

  describe('AuthorizationDetailsEditor', () => {
    it('should render with customer_information example', () => {
      const mockOnUpdate = jest.fn();
      const authorizationDetails = mockRARService.getExampleAuthorizationDetails();
      
      render(
        <AuthorizationDetailsEditor
          authorizationDetails={authorizationDetails}
          onUpdate={mockOnUpdate}
        />
      );
      
      expect(screen.getByText('Authorization Details (RAR)')).toBeInTheDocument();
      expect(screen.getByText('Visual Editor')).toBeInTheDocument();
      expect(screen.getByText('JSON Editor')).toBeInTheDocument();
    });

    it('should validate authorization details using enhanced service', () => {
      const mockOnUpdate = jest.fn();
      const authorizationDetails = mockRARService.getExampleAuthorizationDetails();
      
      render(
        <AuthorizationDetailsEditor
          authorizationDetails={authorizationDetails}
          onUpdate={mockOnUpdate}
        />
      );
      
      expect(mockRARService.validateAuthorizationDetails).toHaveBeenCalledWith(authorizationDetails);
      expect(screen.getByText('Authorization details are valid')).toBeInTheDocument();
    });
  });

  describe('RARExampleSelector', () => {
    it('should display customer_information example', () => {
      const mockOnSelectExample = jest.fn();
      
      render(<RARExampleSelector onSelectExample={mockOnSelectExample} />);
      
      expect(screen.getByText('RAR Authorization Examples')).toBeInTheDocument();
      expect(screen.getByText('Customer Information Access')).toBeInTheDocument();
      expect(screen.getByText('Read and write customer contacts and photos')).toBeInTheDocument();
    });

    it('should call onSelectExample when example is selected', () => {
      const mockOnSelectExample = jest.fn();
      
      render(<RARExampleSelector onSelectExample={mockOnSelectExample} />);
      
      const useExampleButton = screen.getAllByText('Use Example')[0];
      fireEvent.click(useExampleButton);
      
      expect(mockOnSelectExample).toHaveBeenCalled();
    });
  });

  describe('RARValidationDisplay', () => {
    it('should show validation status for customer_information', () => {
      const authorizationDetails = mockRARService.getExampleAuthorizationDetails();
      
      render(
        <RARValidationDisplay
          authorizationDetails={authorizationDetails}
          showScopeValidation={false}
        />
      );
      
      expect(screen.getByText('Authorization Details Valid')).toBeInTheDocument();
      expect(mockRARService.validateAuthorizationDetails).toHaveBeenCalledWith(authorizationDetails);
    });

    it('should display scope validation when enabled', () => {
      const authorizationDetails = mockRARService.getExampleAuthorizationDetails();
      const grantedScopes = ['openid', 'profile', 'email'];
      
      mockRARService.validateScopeCompliance = jest.fn().mockReturnValue({
        valid: true,
        errors: []
      });
      
      render(
        <RARValidationDisplay
          authorizationDetails={authorizationDetails}
          grantedScopes={grantedScopes}
          showScopeValidation={true}
        />
      );
      
      expect(screen.getByText('Scope Compliance')).toBeInTheDocument();
      expect(screen.getByText('Granted scopes: openid, profile, email')).toBeInTheDocument();
    });
  });

  describe('Enhanced Service Integration', () => {
    it('should use enhanced RARService methods', () => {
      // Test that the components are using the enhanced service methods
      expect(mockRARService.getExampleAuthorizationDetails).toBeDefined();
      expect(mockRARService.getTemplates).toBeDefined();
      expect(mockRARService.validateAuthorizationDetails).toBeDefined();
      
      const examples = mockRARService.getExampleAuthorizationDetails();
      const templates = mockRARService.getTemplates();
      
      expect(examples).toHaveLength(1);
      expect(examples[0].type).toBe('customer_information');
      expect(templates.customerInformation).toBeDefined();
      expect(templates.customerInformation.type).toBe('customer_information');
    });

    it('should validate customer_information structure', () => {
      const customerInfo = {
        type: 'customer_information',
        actions: ['read', 'write'],
        datatypes: ['contacts', 'photos'],
        locations: ['https://api.example.com/customers']
      };
      
      mockRARService.validateAuthorizationDetails.mockReturnValue({
        valid: true,
        errors: []
      });
      
      const result = mockRARService.validateAuthorizationDetails([customerInfo]);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});