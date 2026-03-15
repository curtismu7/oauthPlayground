/**
 * Admin Account and Transaction Management Validation Script
 * 
 * This script provides validation utilities for testing admin account and transaction
 * management endpoints in the Banking API Admin Postman collection.
 */

// Admin Account Management Validation Functions
const AdminAccountValidation = {
    
    /**
     * Validate account data structure
     */
    validateAccountStructure: function(account) {
        const requiredFields = ['id', 'accountNumber', 'accountType', 'balance', 'userId', 'createdAt'];
        const missingFields = requiredFields.filter(field => !account.hasOwnProperty(field));
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required account fields: ${missingFields.join(', ')}`);
        }
        
        // Validate data types
        if (typeof account.id !== 'string') throw new Error('Account ID must be a string');
        if (typeof account.accountNumber !== 'string') throw new Error('Account number must be a string');
        if (typeof account.accountType !== 'string') throw new Error('Account type must be a string');
        if (typeof account.balance !== 'number') throw new Error('Balance must be a number');
        if (typeof account.userId !== 'string') throw new Error('User ID must be a string');
        
        // Validate business rules
        if (account.balance < 0) throw new Error('Account balance cannot be negative');
        if (!['checking', 'savings', 'credit'].includes(account.accountType)) {
            throw new Error('Invalid account type');
        }
        
        return true;
    },
    
    /**
     * Validate account creation response
     */
    validateAccountCreation: function(response) {
        if (!response.message) throw new Error('Account creation response missing message');
        if (!response.account) throw new Error('Account creation response missing account data');
        
        this.validateAccountStructure(response.account);
        
        // Validate UUID format for account ID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(response.account.id)) {
            throw new Error('Account ID is not a valid UUID');
        }
        
        return true;
    },
    
    /**
     * Validate account balance response
     */
    validateAccountBalance: function(response) {
        if (!response.hasOwnProperty('balance')) {
            throw new Error('Balance response missing balance field');
        }
        
        if (typeof response.balance !== 'number') {
            throw new Error('Balance must be a number');
        }
        
        if (response.balance < 0) {
            throw new Error('Balance cannot be negative');
        }
        
        return true;
    },
    
    /**
     * Calculate account statistics
     */
    calculateAccountStats: function(accounts) {
        if (!Array.isArray(accounts)) {
            throw new Error('Accounts must be an array');
        }
        
        const stats = {
            totalAccounts: accounts.length,
            totalBalance: accounts.reduce((sum, acc) => sum + acc.balance, 0),
            averageBalance: 0,
            accountTypes: {},
            userDistribution: {}
        };
        
        if (accounts.length > 0) {
            stats.averageBalance = stats.totalBalance / accounts.length;
            
            // Count account types
            accounts.forEach(account => {
                stats.accountTypes[account.accountType] = 
                    (stats.accountTypes[account.accountType] || 0) + 1;
                stats.userDistribution[account.userId] = 
                    (stats.userDistribution[account.userId] || 0) + 1;
            });
        }
        
        return stats;
    }
};

// Admin Transaction Management Validation Functions
const AdminTransactionValidation = {
    
    /**
     * Validate transaction data structure
     */
    validateTransactionStructure: function(transaction) {
        const requiredFields = ['id', 'amount', 'type', 'userId', 'createdAt'];
        const missingFields = requiredFields.filter(field => !transaction.hasOwnProperty(field));
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required transaction fields: ${missingFields.join(', ')}`);
        }
        
        // Validate data types
        if (typeof transaction.id !== 'string') throw new Error('Transaction ID must be a string');
        if (typeof transaction.amount !== 'number') throw new Error('Amount must be a number');
        if (typeof transaction.type !== 'string') throw new Error('Type must be a string');
        if (typeof transaction.userId !== 'string') throw new Error('User ID must be a string');
        
        // Validate business rules
        if (transaction.amount <= 0) throw new Error('Transaction amount must be positive');
        if (!['deposit', 'withdrawal', 'transfer'].includes(transaction.type)) {
            throw new Error('Invalid transaction type');
        }
        
        return true;
    },
    
    /**
     * Validate transaction creation response
     */
    validateTransactionCreation: function(response) {
        if (!response.message) throw new Error('Transaction creation response missing message');
        
        // Handle both single transaction and transfer responses
        if (response.transaction) {
            this.validateTransactionStructure(response.transaction);
        } else if (response.withdrawalTransaction && response.depositTransaction) {
            // Transfer creates two transactions
            this.validateTransactionStructure(response.withdrawalTransaction);
            this.validateTransactionStructure(response.depositTransaction);
        } else {
            throw new Error('Transaction creation response missing transaction data');
        }
        
        return true;
    },
    
    /**
     * Validate transaction amounts and limits
     */
    validateTransactionAmounts: function(transactions) {
        if (!Array.isArray(transactions)) {
            throw new Error('Transactions must be an array');
        }
        
        const invalidTransactions = transactions.filter(txn => {
            return txn.amount <= 0 || txn.amount > 1000000; // Reasonable upper limit
        });
        
        if (invalidTransactions.length > 0) {
            throw new Error(`Found ${invalidTransactions.length} transactions with invalid amounts`);
        }
        
        return true;
    },
    
    /**
     * Calculate transaction statistics
     */
    calculateTransactionStats: function(transactions) {
        if (!Array.isArray(transactions)) {
            throw new Error('Transactions must be an array');
        }
        
        const stats = {
            totalTransactions: transactions.length,
            totalVolume: transactions.reduce((sum, txn) => sum + txn.amount, 0),
            averageAmount: 0,
            transactionTypes: {},
            userDistribution: {},
            dailyVolume: {}
        };
        
        if (transactions.length > 0) {
            stats.averageAmount = stats.totalVolume / transactions.length;
            
            // Count transaction types and user distribution
            transactions.forEach(transaction => {
                stats.transactionTypes[transaction.type] = 
                    (stats.transactionTypes[transaction.type] || 0) + 1;
                stats.userDistribution[transaction.userId] = 
                    (stats.userDistribution[transaction.userId] || 0) + 1;
                
                // Daily volume calculation
                const date = new Date(transaction.createdAt).toDateString();
                stats.dailyVolume[date] = (stats.dailyVolume[date] || 0) + transaction.amount;
            });
        }
        
        return stats;
    }
};

// Admin Security Validation Functions
const AdminSecurityValidation = {
    
    /**
     * Validate admin token and scope
     */
    validateAdminToken: function(token) {
        if (!token) throw new Error('Admin token is required');
        
        try {
            // Decode JWT payload (simple base64 decode)
            const parts = token.split('.');
            if (parts.length !== 3) throw new Error('Invalid JWT token format');
            
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            
            // Check for admin scope
            const scopes = payload.scope ? payload.scope.split(' ') : [];
            if (!scopes.includes('banking:admin')) {
                throw new Error('Token missing banking:admin scope');
            }
            
            // Check token expiration
            if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
                throw new Error('Admin token has expired');
            }
            
            return {
                valid: true,
                scopes: scopes,
                userId: payload.sub,
                username: payload.preferred_username,
                expiresAt: payload.exp
            };
        } catch (error) {
            throw new Error(`Token validation failed: ${error.message}`);
        }
    },
    
    /**
     * Validate admin operation audit trail
     */
    validateAuditTrail: function(operation, response) {
        const auditFields = ['createdAt', 'updatedAt'];
        const missingAuditFields = auditFields.filter(field => {
            return !response.hasOwnProperty(field) && 
                   !(response.account && response.account.hasOwnProperty(field)) &&
                   !(response.transaction && response.transaction.hasOwnProperty(field));
        });
        
        if (missingAuditFields.length > 0) {
            console.warn(`Missing audit fields for ${operation}: ${missingAuditFields.join(', ')}`);
        }
        
        return true;
    },
    
    /**
     * Validate response security headers
     */
    validateSecurityHeaders: function(headers) {
        const requiredHeaders = [
            'X-Content-Type-Options',
            'X-Frame-Options',
            'Strict-Transport-Security'
        ];
        
        const missingHeaders = requiredHeaders.filter(header => !headers.get(header));
        
        if (missingHeaders.length > 0) {
            console.warn(`Missing security headers: ${missingHeaders.join(', ')}`);
        }
        
        // Validate header values
        if (headers.get('X-Content-Type-Options') && 
            headers.get('X-Content-Type-Options') !== 'nosniff') {
            console.warn('X-Content-Type-Options should be "nosniff"');
        }
        
        if (headers.get('X-Frame-Options') && 
            !['DENY', 'SAMEORIGIN'].includes(headers.get('X-Frame-Options'))) {
            console.warn('X-Frame-Options should be "DENY" or "SAMEORIGIN"');
        }
        
        return true;
    }
};

// Performance Validation Functions
const PerformanceValidation = {
    
    /**
     * Validate response time for admin operations
     */
    validateResponseTime: function(responseTime, operation) {
        const thresholds = {
            'GET': 3000,    // 3 seconds for read operations
            'POST': 5000,   // 5 seconds for create operations
            'PUT': 5000,    // 5 seconds for update operations
            'DELETE': 3000  // 3 seconds for delete operations
        };
        
        const threshold = thresholds[operation] || 3000;
        
        if (responseTime > threshold) {
            console.warn(`Response time ${responseTime}ms exceeds threshold ${threshold}ms for ${operation} operation`);
            return false;
        }
        
        return true;
    },
    
    /**
     * Monitor admin operation performance
     */
    monitorPerformance: function(operation, responseTime, dataSize) {
        const performance = {
            operation: operation,
            responseTime: responseTime,
            dataSize: dataSize || 0,
            timestamp: new Date().toISOString(),
            status: responseTime < 3000 ? 'GOOD' : responseTime < 5000 ? 'WARNING' : 'POOR'
        };
        
        console.log(`📊 Performance: ${operation} - ${responseTime}ms (${performance.status})`);
        
        return performance;
    }
};

// Export validation functions for use in Postman tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AdminAccountValidation,
        AdminTransactionValidation,
        AdminSecurityValidation,
        PerformanceValidation
    };
}

// Make available in Postman global scope
if (typeof pm !== 'undefined') {
    pm.globals.set('AdminAccountValidation', JSON.stringify(AdminAccountValidation));
    pm.globals.set('AdminTransactionValidation', JSON.stringify(AdminTransactionValidation));
    pm.globals.set('AdminSecurityValidation', JSON.stringify(AdminSecurityValidation));
    pm.globals.set('PerformanceValidation', JSON.stringify(PerformanceValidation));
}