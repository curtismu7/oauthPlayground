/**
 * Account Management Validation Script
 * Validates that the end user collection properly implements account management endpoints
 */

const fs = require('fs');
const path = require('path');

// Load the collection
const collectionPath = path.join(__dirname, '..', 'collections', 'Banking-API-End-User.postman_collection.json');
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

console.log('🔍 Validating Account Management Implementation...\n');

// Find the Account Management folder
const accountManagementFolder = collection.item.find(item => 
    item.name === '2. Account Management'
);

if (!accountManagementFolder) {
    console.error('❌ Account Management folder not found');
    process.exit(1);
}

console.log('✅ Account Management folder found');

// Expected endpoints
const expectedEndpoints = [
    'Get My Accounts',
    'Get Account Balance', 
    'Try Admin Account Details (Should Fail)',
    'Try Access Other User Account (Should Fail)',
    'Get Checking Account Balance',
    'Get Savings Account Balance'
];

console.log('\n📋 Checking required endpoints:');

expectedEndpoints.forEach(endpoint => {
    const found = accountManagementFolder.item.find(item => item.name === endpoint);
    if (found) {
        console.log(`✅ ${endpoint}`);
        
        // Validate request structure
        if (!found.request) {
            console.log(`   ⚠️  Missing request object`);
        } else {
            // Check for proper headers
            const hasAuthHeader = found.request.header?.some(h => h.key === 'Authorization');
            const hasAcceptHeader = found.request.header?.some(h => h.key === 'Accept');
            
            if (hasAuthHeader) console.log(`   ✅ Authorization header present`);
            else console.log(`   ⚠️  Missing Authorization header`);
            
            if (hasAcceptHeader) console.log(`   ✅ Accept header present`);
            else console.log(`   ⚠️  Missing Accept header`);
        }
        
        // Validate test scripts
        const hasTests = found.event?.some(e => e.listen === 'test' && e.script?.exec?.length > 0);
        if (hasTests) {
            console.log(`   ✅ Test scripts present`);
        } else {
            console.log(`   ⚠️  Missing test scripts`);
        }
        
    } else {
        console.log(`❌ ${endpoint} - NOT FOUND`);
    }
});

// Validate test coverage
console.log('\n🧪 Validating test coverage:');

const testCategories = [
    'Status code validation',
    'Response structure validation', 
    'Data type validation',
    'Access control validation',
    'Security validation'
];

let totalTests = 0;
accountManagementFolder.item.forEach(item => {
    const testEvent = item.event?.find(e => e.listen === 'test');
    if (testEvent && testEvent.script?.exec) {
        const testCount = testEvent.script.exec.filter(line => 
            line.includes('pm.test(')
        ).length;
        totalTests += testCount;
    }
});

console.log(`✅ Total test assertions: ${totalTests}`);

// Validate scope requirements
console.log('\n🔐 Validating scope and security requirements:');

const hasNegativeTests = accountManagementFolder.item.some(item => 
    item.name.toLowerCase().includes('should fail') || 
    item.name.toLowerCase().includes('negative')
);

if (hasNegativeTests) {
    console.log('✅ Negative tests for access control present');
} else {
    console.log('⚠️  Missing negative tests for access control');
}

// Check for proper error handling
const hasErrorHandling = accountManagementFolder.item.some(item => {
    const testEvent = item.event?.find(e => e.listen === 'test');
    return testEvent?.script?.exec?.some(line => 
        line.includes('403') || line.includes('404') || line.includes('error')
    );
});

if (hasErrorHandling) {
    console.log('✅ Error handling tests present');
} else {
    console.log('⚠️  Missing error handling tests');
}

console.log('\n🎯 Account Management Implementation Summary:');
console.log(`   📁 Endpoints implemented: ${accountManagementFolder.item.length}`);
console.log(`   🧪 Total test assertions: ${totalTests}`);
console.log(`   🔒 Security tests: ${hasNegativeTests ? 'Present' : 'Missing'}`);
console.log(`   ⚠️  Error handling: ${hasErrorHandling ? 'Present' : 'Missing'}`);

console.log('\n✅ Account Management validation complete!');