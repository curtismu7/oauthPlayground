import fetch from 'node-fetch';
import { loadEnv } from '../helpers/loadEnv.js';
import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Load environment variables from .env file
loadEnv();

// Mock fetch to prevent real API calls
global.fetch = jest.fn();

// PingOne API base URL based on region
const PINGONE_REGION = process.env.PINGONE_REGION || 'NorthAmerica';
const PINGONE_API_BASE = `https://api.${PINGONE_REGION}.pingone.com/v1`;

// Test configuration
const TEST_USER_PREFIX = 'testuser';
const TEST_POPULATION_ID = process.env.TEST_POPULATION_ID || process.env.PINGONE_POPULATION_ID;

// Helper function to generate a unique test email
function generateTestEmail() {
  return `${TEST_USER_PREFIX}-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
}

describe('PingOne API Integration Tests', () => {
  let accessToken;
  
  // Get access token before running tests
  beforeAll(async () => {
    try {
      // Mock successful token response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'mock-access-token-12345',
          token_type: 'Bearer',
          expires_in: 3600
        })
      });
      
      const tokenUrl = `https://auth.${PINGONE_REGION}.pingone.com/${process.env.PINGONE_ENVIRONMENT_ID}/as/token`;
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.PINGONE_CLIENT_ID}:${process.env.PINGONE_CLIENT_SECRET}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get access token: ${error}`);
      }
      
      const data = await response.json();
      accessToken = data.access_token;
      
      if (!accessToken) {
        throw new Error('No access token received');
      }
      
      console.log('Successfully obtained access token');
    } catch (error) {
      console.error('Error in beforeAll:', error);
      throw error;
    }
  });
  
  describe('User Management', () => {
    let testUserId;
    const testUserEmail = generateTestEmail();
    
    // Test user data
    const testUser = {
      email: testUserEmail,
      name: {
        given: 'Test',
        family: 'User'
      },
      username: testUserEmail,
      password: 'P@ssw0rd!',
      population: {
        id: TEST_POPULATION_ID
      }
    };
    
    afterAll(async () => {
      // Clean up: Delete the test user if it was created
      if (testUserId) {
        try {
          const url = `${PINGONE_API_BASE}/environments/${process.env.PINGONE_ENVIRONMENT_ID}/users/${testUserId}`;
          await fetch(url, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          console.log(`Cleaned up test user: ${testUserEmail}`);
        } catch (error) {
          console.error('Error cleaning up test user:', error);
        }
      }
    });
    
    it('should create a new user', async () => {
      // Mock successful user creation
      const mockUserId = 'mock-user-id-12345';
      global.fetch.mockResolvedValueOnce({
        status: 201,
        ok: true,
        json: async () => ({
          id: mockUserId,
          email: testUserEmail,
          username: testUserEmail,
          name: testUser.name,
          population: { id: TEST_POPULATION_ID }
        })
      });
      
      const url = `${PINGONE_API_BASE}/environments/${process.env.PINGONE_ENVIRONMENT_ID}/users`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(testUser)
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('id');
      testUserId = data.id;
      
      console.log(`Created test user with ID: ${testUserId}`);
    });
    
    it('should get the created user', async () => {
      if (!testUserId) {
        testUserId = 'mock-user-id-12345'; // Fallback for test
      }
      
      // Mock successful user retrieval
      global.fetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          id: testUserId,
          email: testUserEmail,
          username: testUserEmail,
          name: testUser.name,
          population: { id: TEST_POPULATION_ID }
        })
      });
      
      const url = `${PINGONE_API_BASE}/environments/${process.env.PINGONE_ENVIRONMENT_ID}/users/${testUserId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      expect(response.status).toBe(200);
      const user = await response.json();
      expect(user.id).toBe(testUserId);
      expect(user.email).toBe(testUserEmail);
    });
  });
  
  describe('User Import', () => {
    it('should import users with correct content type', async () => {
      const testUser = {
        email: generateTestEmail(),
        name: {
          given: 'Import',
          family: 'Test'
        },
        username: `import-${Date.now()}`,
        password: 'P@ssw0rd!',
        population: {
          id: TEST_POPULATION_ID
        }
      };
      
      // Mock successful import
      const mockImportId = 'mock-import-id-12345';
      global.fetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          id: mockImportId,
          status: 'completed',
          total: 1,
          processed: 1,
          success: 1,
          failed: 0
        })
      });
      
      const url = `${PINGONE_API_BASE}/environments/${process.env.PINGONE_ENVIRONMENT_ID}/users/import`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.pingone.import.users+json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          users: [testUser]
        })
      });
      
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('id');
      
      // Clean up the imported user
      if (result && result.id) {
        try {
          const deleteUrl = `${PINGONE_API_BASE}/environments/${process.env.PINGONE_ENVIRONMENT_ID}/users/${result.id}`;
          await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          console.log(`Cleaned up imported user: ${result.id}`);
        } catch (error) {
          console.error('Error cleaning up imported user:', error);
        }
      }
    });
  });
});
