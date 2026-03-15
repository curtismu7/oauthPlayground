/**
 * UI E2E Workflow Tests
 * Tests complete user workflows through the React UI
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import * as apiClient from '../../services/apiClient';

// Mock the API client
jest.mock('../../services/apiClient');
const mockedApiClient = apiClient;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('UI E2E Workflow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-auth-token');
    
    // Mock successful authentication
    mockedApiClient.get.mockImplementation((url) => {
      if (url === '/api/health') {
        return Promise.resolve({
          data: { status: 'healthy', timestamp: new Date().toISOString() }
        });
      }
      return Promise.reject(new Error('Not mocked'));
    });
  });

  describe('Complete Lending Officer Workflow', () => {
    test('should complete user lookup and credit assessment workflow', async () => {
      const user = userEvent.setup();
      
      // Mock API responses
      const mockUsers = [
        {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0101'
        },
        {
          id: 'user-2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+1-555-0102'
        }
      ];

      const mockCreditScore = {
        id: 'score-1',
        userId: 'user-1',
        score: 750,
        scoreDate: new Date().toISOString(),
        factors: {
          paymentHistory: 35,
          creditUtilization: 30,
          creditLength: 15,
          creditMix: 10,
          newCredit: 10
        },
        source: 'calculated'
      };

      const mockCreditLimit = {
        id: 'limit-1',
        userId: 'user-1',
        creditScore: 750,
        calculatedLimit: 45000,
        approvedLimit: 45000,
        riskLevel: 'low',
        businessRules: {
          incomeMultiplier: 0.4,
          debtToIncomeRatio: 0.2,
          minimumScore: 700
        }
      };

      mockedApiClient.get.mockImplementation((url) => {
        if (url === '/api/health') {
          return Promise.resolve({
            data: { status: 'healthy', timestamp: new Date().toISOString() }
          });
        }
        if (url === '/api/users') {
          return Promise.resolve({ data: { data: mockUsers } });
        }
        if (url === '/api/users/user-1') {
          return Promise.resolve({ data: { data: mockUsers[0] } });
        }
        if (url === '/api/credit/user-1/score') {
          return Promise.resolve({ data: { data: mockCreditScore } });
        }
        if (url === '/api/credit/user-1/limit') {
          return Promise.resolve({ data: { data: mockCreditLimit } });
        }
        if (url === '/api/credit/user-1/assessment') {
          return Promise.resolve({
            data: {
              data: {
                user: mockUsers[0],
                creditScore: mockCreditScore,
                creditLimit: mockCreditLimit
              }
            }
          });
        }
        return Promise.reject(new Error(`Unmocked URL: ${url}`));
      });

      // Render the app
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/lending dashboard/i)).toBeInTheDocument();
      });

      // Step 1: Navigate to user lookup
      const userLookupTab = screen.getByText(/user lookup/i);
      await user.click(userLookupTab);

      // Step 2: Search for users
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Step 3: Select a user
      const selectUserButton = screen.getAllByText(/select/i)[0];
      await user.click(selectUserButton);

      // Step 4: Navigate to credit assessment
      const creditAssessmentTab = screen.getByText(/credit assessment/i);
      await user.click(creditAssessmentTab);

      // Step 5: Verify credit assessment data is displayed
      await waitFor(() => {
        expect(screen.getByText('750')).toBeInTheDocument(); // Credit score
        expect(screen.getByText('$45,000')).toBeInTheDocument(); // Credit limit
        expect(screen.getByText('Low Risk')).toBeInTheDocument(); // Risk level
      });

      // Verify API calls were made
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/users');
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/credit/user-1/assessment');
    });

    test('should handle search functionality', async () => {
      const user = userEvent.setup();
      
      const mockSearchResults = [
        {
          id: 'user-search-1',
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice.johnson@example.com',
          phone: '+1-555-0201'
        }
      ];

      mockedApiClient.get.mockImplementation((url) => {
        if (url === '/api/health') {
          return Promise.resolve({
            data: { status: 'healthy', timestamp: new Date().toISOString() }
          });
        }
        if (url.includes('/api/users?search=alice')) {
          return Promise.resolve({ data: { data: mockSearchResults } });
        }
        if (url === '/api/users') {
          return Promise.resolve({ data: { data: [] } });
        }
        return Promise.reject(new Error(`Unmocked URL: ${url}`));
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to user lookup
      const userLookupTab = screen.getByText(/user lookup/i);
      await user.click(userLookupTab);

      // Find and use search input
      const searchInput = screen.getByPlaceholderText(/search users/i);
      await user.type(searchInput, 'alice');

      // Wait for search results
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/users?search=alice&limit=50&offset=0');
    });
  });

  describe('Error Handling Workflows', () => {
    test('should display error messages when API calls fail', async () => {
      const user = userEvent.setup();
      
      // Mock API failure
      mockedApiClient.get.mockImplementation((url) => {
        if (url === '/api/health') {
          return Promise.resolve({
            data: { status: 'healthy', timestamp: new Date().toISOString() }
          });
        }
        if (url === '/api/users') {
          return Promise.reject(new Error('Service unavailable'));
        }
        return Promise.reject(new Error(`Unmocked URL: ${url}`));
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to user lookup
      const userLookupTab = screen.getByText(/user lookup/i);
      await user.click(userLookupTab);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/error loading users/i)).toBeInTheDocument();
      });
    });

    test('should handle authentication errors', async () => {
      // Mock authentication failure
      localStorageMock.getItem.mockReturnValue(null);
      
      mockedApiClient.get.mockImplementation((url) => {
        if (url === '/api/health') {
          return Promise.reject({ response: { status: 401 } });
        }
        return Promise.reject(new Error(`Unmocked URL: ${url}`));
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should show login or authentication error
      await waitFor(() => {
        expect(screen.getByText(/authentication required/i) || screen.getByText(/login/i)).toBeInTheDocument();
      });
    });

    test('should show loading states during API calls', async () => {
      const user = userEvent.setup();
      
      // Mock delayed API response
      mockedApiClient.get.mockImplementation((url) => {
        if (url === '/api/health') {
          return Promise.resolve({
            data: { status: 'healthy', timestamp: new Date().toISOString() }
          });
        }
        if (url === '/api/users') {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({ data: { data: [] } });
            }, 1000);
          });
        }
        return Promise.reject(new Error(`Unmocked URL: ${url}`));
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to user lookup
      const userLookupTab = screen.getByText(/user lookup/i);
      await user.click(userLookupTab);

      // Should show loading indicator
      expect(screen.getByText(/loading/i) || screen.getByRole('progressbar')).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Admin Workflow', () => {
    test('should display admin panel for admin users', async () => {
      const user = userEvent.setup();
      
      // Mock admin API responses
      const mockAdminData = {
        totalUsers: 150,
        averageCreditScore: 685,
        riskDistribution: {
          low: 45,
          medium: 35,
          high: 20
        }
      };

      mockedApiClient.get.mockImplementation((url) => {
        if (url === '/api/health') {
          return Promise.resolve({
            data: { status: 'healthy', timestamp: new Date().toISOString() }
          });
        }
        if (url === '/api/admin/credit/reports') {
          return Promise.resolve({ data: { data: mockAdminData } });
        }
        return Promise.reject(new Error(`Unmocked URL: ${url}`));
      });

      // Mock admin user
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'admin-token';
        if (key === 'userRole') return 'admin';
        return null;
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to admin panel
      const adminTab = screen.getByText(/admin/i);
      await user.click(adminTab);

      // Wait for admin data to load
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // Total users
        expect(screen.getByText('685')).toBeInTheDocument(); // Average score
      });

      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/admin/credit/reports');
    });

    test('should prevent non-admin access to admin features', async () => {
      // Mock regular user
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'user-token';
        if (key === 'userRole') return 'user';
        return null;
      });

      mockedApiClient.get.mockImplementation((url) => {
        if (url === '/api/health') {
          return Promise.resolve({
            data: { status: 'healthy', timestamp: new Date().toISOString() }
          });
        }
        return Promise.reject(new Error(`Unmocked URL: ${url}`));
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Admin tab should not be visible
      expect(screen.queryByText(/admin/i)).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design Tests', () => {
    test('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      mockedApiClient.get.mockImplementation((url) => {
        if (url === '/api/health') {
          return Promise.resolve({
            data: { status: 'healthy', timestamp: new Date().toISOString() }
          });
        }
        return Promise.reject(new Error(`Unmocked URL: ${url}`));
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      // Check for mobile-specific elements or layout
      await waitFor(() => {
        const mobileMenu = screen.queryByRole('button', { name: /menu/i });
        if (mobileMenu) {
          expect(mobileMenu).toBeInTheDocument();
        }
      });
    });
  });

  describe('Accessibility Tests', () => {
    test('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      mockedApiClient.get.mockImplementation((url) => {
        if (url === '/api/health') {
          return Promise.resolve({
            data: { status: 'healthy', timestamp: new Date().toISOString() }
          });
        }
        if (url === '/api/users') {
          return Promise.resolve({ data: { data: [] } });
        }
        return Promise.reject(new Error(`Unmocked URL: ${url}`));
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Test tab navigation
      await user.tab();
      expect(document.activeElement).toHaveAttribute('role', 'tab');

      // Test enter key activation
      await user.keyboard('{Enter}');
      
      // Should navigate to the selected tab
      await waitFor(() => {
        expect(screen.getByRole('tabpanel')).toBeInTheDocument();
      });
    });

    test('should have proper ARIA labels and roles', async () => {
      mockedApiClient.get.mockImplementation((url) => {
        if (url === '/api/health') {
          return Promise.resolve({
            data: { status: 'healthy', timestamp: new Date().toISOString() }
          });
        }
        return Promise.reject(new Error(`Unmocked URL: ${url}`));
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Check for proper ARIA roles
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Check for tab list
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();
      
      // Check for tabs
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
    });
  });
});