/**
 * Test Data Management and Cleanup Utilities
 * Provides utilities for managing test data across E2E tests
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class TestDataManager {
  constructor() {
    this.testDataPath = path.join(__dirname, '../../data/test');
    this.backupPath = path.join(__dirname, '../../data/backup');
    this.createdUsers = [];
    this.createdCreditScores = [];
    this.createdCreditLimits = [];
    this.originalData = {};
  }

  /**
   * Initialize test environment
   */
  async initialize() {
    try {
      // Ensure test data directories exist
      await this.ensureDirectories();
      
      // Backup original data
      await this.backupOriginalData();
      
      // Create test data
      await this.createTestData();
      
      console.log('Test data manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize test data manager:', error);
      throw error;
    }
  }

  /**
   * Cleanup test environment
   */
  async cleanup() {
    try {
      // Remove created test data
      await this.removeTestData();
      
      // Restore original data
      await this.restoreOriginalData();
      
      console.log('Test data cleanup completed successfully');
    } catch (error) {
      console.error('Failed to cleanup test data:', error);
      throw error;
    }
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const directories = [this.testDataPath, this.backupPath];
    
    for (const dir of directories) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * Backup original data files
   */
  async backupOriginalData() {
    const dataPath = path.join(__dirname, '../../../data/persistent');
    const files = ['users.json', 'creditScores.json', 'creditLimits.json', 'activityLogs.json'];
    
    for (const file of files) {
      const sourcePath = path.join(dataPath, file);
      const backupFilePath = path.join(this.backupPath, `${Date.now()}_${file}`);
      
      try {
        const data = await fs.readFile(sourcePath, 'utf8');
        await fs.writeFile(backupFilePath, data);
        this.originalData[file] = JSON.parse(data);
      } catch (error) {
        // File might not exist, create empty structure
        this.originalData[file] = [];
        await fs.writeFile(backupFilePath, JSON.stringify([]));
      }
    }
  }

  /**
   * Restore original data files
   */
  async restoreOriginalData() {
    const dataPath = path.join(__dirname, '../../../data/persistent');
    
    for (const [file, data] of Object.entries(this.originalData)) {
      const filePath = path.join(dataPath, file);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }
  }

  /**
   * Create comprehensive test data
   */
  async createTestData() {
    // Create test users
    await this.createTestUsers();
    
    // Create test credit scores
    await this.createTestCreditScores();
    
    // Create test credit limits
    await this.createTestCreditLimits();
    
    // Create test activity logs
    await this.createTestActivityLogs();
  }

  /**
   * Create test users with various profiles
   */
  async createTestUsers() {
    const testUsers = [
      {
        id: 'test-user-excellent-credit',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@example.com',
        phone: '+1-555-0101',
        dateOfBirth: '1985-03-15',
        ssn: 'encrypted_ssn_1',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        },
        employment: {
          employer: 'Tech Corp',
          position: 'Software Engineer',
          annualIncome: 120000,
          employmentLength: 60
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-user-good-credit',
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob.smith@example.com',
        phone: '+1-555-0102',
        dateOfBirth: '1990-07-22',
        ssn: 'encrypted_ssn_2',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210'
        },
        employment: {
          employer: 'Marketing Inc',
          position: 'Marketing Manager',
          annualIncome: 85000,
          employmentLength: 36
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-user-fair-credit',
        firstName: 'Carol',
        lastName: 'Davis',
        email: 'carol.davis@example.com',
        phone: '+1-555-0103',
        dateOfBirth: '1988-11-08',
        ssn: 'encrypted_ssn_3',
        address: {
          street: '789 Pine Rd',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601'
        },
        employment: {
          employer: 'Retail Store',
          position: 'Store Manager',
          annualIncome: 55000,
          employmentLength: 24
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-user-poor-credit',
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.wilson@example.com',
        phone: '+1-555-0104',
        dateOfBirth: '1992-01-30',
        ssn: 'encrypted_ssn_4',
        address: {
          street: '321 Elm St',
          city: 'Houston',
          state: 'TX',
          zipCode: '77001'
        },
        employment: {
          employer: 'Freelance',
          position: 'Contractor',
          annualIncome: 35000,
          employmentLength: 12
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'high-risk-user',
        firstName: 'Eve',
        lastName: 'Brown',
        email: 'eve.brown@example.com',
        phone: '+1-555-0105',
        dateOfBirth: '1995-05-12',
        ssn: 'encrypted_ssn_5',
        address: {
          street: '654 Maple Dr',
          city: 'Phoenix',
          state: 'AZ',
          zipCode: '85001'
        },
        employment: {
          employer: 'Part-time Job',
          position: 'Cashier',
          annualIncome: 25000,
          employmentLength: 6
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    this.createdUsers = testUsers;
    await this.saveTestData('users.json', testUsers);
  }

  /**
   * Create test credit scores
   */
  async createTestCreditScores() {
    const testCreditScores = [
      {
        id: uuidv4(),
        userId: 'test-user-excellent-credit',
        score: 780,
        scoreDate: new Date().toISOString(),
        factors: {
          paymentHistory: 40,
          creditUtilization: 25,
          creditLength: 20,
          creditMix: 10,
          newCredit: 5
        },
        source: 'calculated',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        userId: 'test-user-good-credit',
        score: 720,
        scoreDate: new Date().toISOString(),
        factors: {
          paymentHistory: 35,
          creditUtilization: 30,
          creditLength: 18,
          creditMix: 12,
          newCredit: 5
        },
        source: 'calculated',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        userId: 'test-user-fair-credit',
        score: 650,
        scoreDate: new Date().toISOString(),
        factors: {
          paymentHistory: 30,
          creditUtilization: 35,
          creditLength: 15,
          creditMix: 15,
          newCredit: 5
        },
        source: 'calculated',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        userId: 'test-user-poor-credit',
        score: 580,
        scoreDate: new Date().toISOString(),
        factors: {
          paymentHistory: 25,
          creditUtilization: 40,
          creditLength: 10,
          creditMix: 20,
          newCredit: 5
        },
        source: 'calculated',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        userId: 'high-risk-user',
        score: 520,
        scoreDate: new Date().toISOString(),
        factors: {
          paymentHistory: 20,
          creditUtilization: 45,
          creditLength: 5,
          creditMix: 25,
          newCredit: 5
        },
        source: 'calculated',
        createdAt: new Date().toISOString()
      }
    ];

    this.createdCreditScores = testCreditScores;
    await this.saveTestData('creditScores.json', testCreditScores);
  }

  /**
   * Create test credit limits
   */
  async createTestCreditLimits() {
    const testCreditLimits = [
      {
        id: uuidv4(),
        userId: 'test-user-excellent-credit',
        creditScore: 780,
        calculatedLimit: 50000,
        approvedLimit: 50000,
        riskLevel: 'low',
        businessRules: {
          incomeMultiplier: 0.4,
          debtToIncomeRatio: 0.2,
          minimumScore: 700
        },
        calculatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        userId: 'test-user-good-credit',
        creditScore: 720,
        calculatedLimit: 30000,
        approvedLimit: 30000,
        riskLevel: 'low',
        businessRules: {
          incomeMultiplier: 0.35,
          debtToIncomeRatio: 0.25,
          minimumScore: 700
        },
        calculatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        userId: 'test-user-fair-credit',
        creditScore: 650,
        calculatedLimit: 15000,
        approvedLimit: 15000,
        riskLevel: 'medium',
        businessRules: {
          incomeMultiplier: 0.25,
          debtToIncomeRatio: 0.35,
          minimumScore: 600
        },
        calculatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        userId: 'test-user-poor-credit',
        creditScore: 580,
        calculatedLimit: 5000,
        approvedLimit: 5000,
        riskLevel: 'high',
        businessRules: {
          incomeMultiplier: 0.15,
          debtToIncomeRatio: 0.45,
          minimumScore: 550
        },
        calculatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        userId: 'high-risk-user',
        creditScore: 520,
        calculatedLimit: 2000,
        approvedLimit: 2000,
        riskLevel: 'high',
        businessRules: {
          incomeMultiplier: 0.08,
          debtToIncomeRatio: 0.5,
          minimumScore: 500
        },
        calculatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    this.createdCreditLimits = testCreditLimits;
    await this.saveTestData('creditLimits.json', testCreditLimits);
  }

  /**
   * Create test activity logs
   */
  async createTestActivityLogs() {
    const testActivityLogs = [
      {
        id: uuidv4(),
        userId: 'test-user-excellent-credit',
        action: 'credit_score_calculated',
        details: { score: 780, method: 'automated' },
        performedBy: 'system',
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      },
      {
        id: uuidv4(),
        userId: 'test-user-good-credit',
        action: 'credit_limit_calculated',
        details: { limit: 30000, riskLevel: 'low' },
        performedBy: 'system',
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      }
    ];

    await this.saveTestData('activityLogs.json', testActivityLogs);
  }

  /**
   * Save test data to file
   */
  async saveTestData(filename, data) {
    const dataPath = path.join(__dirname, '../../../data/persistent');
    const filePath = path.join(dataPath, filename);
    
    // Merge with existing data
    let existingData = [];
    try {
      const existingContent = await fs.readFile(filePath, 'utf8');
      existingData = JSON.parse(existingContent);
    } catch {
      // File doesn't exist or is empty
    }

    const mergedData = [...existingData, ...data];
    await fs.writeFile(filePath, JSON.stringify(mergedData, null, 2));
  }

  /**
   * Remove test data
   */
  async removeTestData() {
    const dataPath = path.join(__dirname, '../../../data/persistent');
    const files = ['users.json', 'creditScores.json', 'creditLimits.json', 'activityLogs.json'];
    
    for (const file of files) {
      const filePath = path.join(dataPath, file);
      
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        
        // Remove test data based on created IDs
        let filteredData = data;
        
        if (file === 'users.json') {
          const testUserIds = this.createdUsers.map(u => u.id);
          filteredData = data.filter(item => !testUserIds.includes(item.id));
        } else if (file === 'creditScores.json') {
          const testScoreIds = this.createdCreditScores.map(s => s.id);
          filteredData = data.filter(item => !testScoreIds.includes(item.id));
        } else if (file === 'creditLimits.json') {
          const testLimitIds = this.createdCreditLimits.map(l => l.id);
          filteredData = data.filter(item => !testLimitIds.includes(item.id));
        }
        
        await fs.writeFile(filePath, JSON.stringify(filteredData, null, 2));
      } catch (error) {
        console.warn(`Could not clean up ${file}:`, error.message);
      }
    }
  }

  /**
   * Create specific test user
   */
  async createTestUser(userData) {
    const user = {
      id: uuidv4(),
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.createdUsers.push(user);
    await this.saveTestData('users.json', [user]);
    return user;
  }

  /**
   * Create specific test credit score
   */
  async createTestCreditScore(userId, scoreData) {
    const creditScore = {
      id: uuidv4(),
      userId,
      ...scoreData,
      createdAt: new Date().toISOString()
    };

    this.createdCreditScores.push(creditScore);
    await this.saveTestData('creditScores.json', [creditScore]);
    return creditScore;
  }

  /**
   * Create specific test credit limit
   */
  async createTestCreditLimit(userId, limitData) {
    const creditLimit = {
      id: uuidv4(),
      userId,
      ...limitData,
      calculatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    this.createdCreditLimits.push(creditLimit);
    await this.saveTestData('creditLimits.json', [creditLimit]);
    return creditLimit;
  }

  /**
   * Get test user by ID
   */
  getTestUser(userId) {
    return this.createdUsers.find(user => user.id === userId);
  }

  /**
   * Get all test users
   */
  getTestUsers() {
    return this.createdUsers;
  }

  /**
   * Reset specific data type
   */
  async resetData(dataType) {
    const dataPath = path.join(__dirname, '../../../data/persistent');
    const filePath = path.join(dataPath, `${dataType}.json`);
    
    if (this.originalData[`${dataType}.json`]) {
      await fs.writeFile(filePath, JSON.stringify(this.originalData[`${dataType}.json`], null, 2));
    }
  }

  /**
   * Generate performance test data
   */
  async generatePerformanceTestData(userCount = 1000) {
    const users = [];
    const creditScores = [];
    const creditLimits = [];

    for (let i = 0; i < userCount; i++) {
      const userId = `perf-test-user-${i}`;
      
      // Create user
      const user = {
        id: userId,
        firstName: `TestUser${i}`,
        lastName: `LastName${i}`,
        email: `testuser${i}@example.com`,
        phone: `+1-555-${String(i).padStart(4, '0')}`,
        dateOfBirth: new Date(1980 + (i % 20), (i % 12), (i % 28) + 1).toISOString().split('T')[0],
        ssn: `encrypted_ssn_${i}`,
        address: {
          street: `${i} Test St`,
          city: 'TestCity',
          state: 'TS',
          zipCode: String(10000 + (i % 90000)).padStart(5, '0')
        },
        employment: {
          employer: `Company${i % 100}`,
          position: 'Employee',
          annualIncome: 30000 + (i % 100000),
          employmentLength: 12 + (i % 120)
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create credit score
      const creditScore = {
        id: uuidv4(),
        userId,
        score: 300 + (i % 550),
        scoreDate: new Date().toISOString(),
        factors: {
          paymentHistory: 20 + (i % 20),
          creditUtilization: 25 + (i % 20),
          creditLength: 10 + (i % 20),
          creditMix: 5 + (i % 20),
          newCredit: 0 + (i % 10)
        },
        source: 'calculated',
        createdAt: new Date().toISOString()
      };

      // Create credit limit
      const creditLimit = {
        id: uuidv4(),
        userId,
        creditScore: creditScore.score,
        calculatedLimit: Math.max(1000, (creditScore.score - 300) * 100),
        approvedLimit: Math.max(1000, (creditScore.score - 300) * 100),
        riskLevel: creditScore.score > 700 ? 'low' : creditScore.score > 600 ? 'medium' : 'high',
        businessRules: {
          incomeMultiplier: 0.1 + (creditScore.score / 8500),
          debtToIncomeRatio: 0.5 - (creditScore.score / 1700),
          minimumScore: 500
        },
        calculatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      users.push(user);
      creditScores.push(creditScore);
      creditLimits.push(creditLimit);
    }

    // Save performance test data
    await this.saveTestData('users.json', users);
    await this.saveTestData('creditScores.json', creditScores);
    await this.saveTestData('creditLimits.json', creditLimits);

    this.createdUsers.push(...users);
    this.createdCreditScores.push(...creditScores);
    this.createdCreditLimits.push(...creditLimits);

    return { users, creditScores, creditLimits };
  }
}

module.exports = TestDataManager;