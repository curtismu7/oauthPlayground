import { userDatabaseService } from './src/server/services/userDatabaseService.js';

async function testSQLite() {
  try {
    userDatabaseService.init();

    // Insert some test users (matching PingOne API structure)
    const testUsers = [
      {
        id: 'user1',
        username: 'john.doe',
        email: 'john.doe@example.com',
        name: { given: 'John', family: 'Doe', formatted: 'John Doe' },
        enabled: true,
        population: { id: 'pop1' },
        lifecycle: { status: 'ACTIVE' }
      },
      {
        id: 'user2',
        username: 'jane.smith',
        email: 'jane.smith@example.com',
        name: { given: 'Jane', family: 'Smith', formatted: 'Jane Smith' },
        enabled: true,
        population: { id: 'pop1' },
        lifecycle: { status: 'ACTIVE' }
      },
      {
        id: 'user3',
        username: 'bob.wilson',
        email: 'bob.wilson@example.com',
        name: { given: 'Bob', family: 'Wilson', formatted: 'Bob Wilson' },
        enabled: true,
        population: { id: 'pop1' },
        lifecycle: { status: 'ACTIVE' }
      }
    ];

    console.log('Inserting test users...');
    userDatabaseService.saveUsers('b9817c16-9910-4415-b67e-4ac687da74d9', testUsers);
    console.log('✅ Test users inserted');

    const count = userDatabaseService.getUserCount('b9817c16-9910-4415-b67e-4ac687da74d9');
    console.log('📊 User count:', count);

    console.log('🔍 Testing search for "john"...');
    const searchResults = userDatabaseService.searchUsers('b9817c16-9910-4415-b67e-4ac687da74d9', 'john');
    console.log('Search results:', searchResults.length, 'users found');

    console.log('🔍 Testing search for "smith"...');
    const smithResults = userDatabaseService.searchUsers('b9817c16-9910-4415-b67e-4ac687da74d9', 'smith');
    console.log('Search results:', smithResults.length, 'users found');

    console.log('🔍 Testing search for "wilson"...');
    const wilsonResults = userDatabaseService.searchUsers('b9817c16-9910-4415-b67e-4ac687da74d9', 'wilson');
    console.log('Search results:', wilsonResults.length, 'users found');

    console.log('✅ SQLite database test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSQLite();