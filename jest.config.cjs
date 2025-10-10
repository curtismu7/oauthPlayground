module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/backend/setup.js'],
  collectCoverageFrom: [
    'server.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  testMatch: [
    '**/tests/backend/**/*.test.js',
    '**/tests/backend/**/*.spec.js'
  ],
  coverageDirectory: 'coverage/backend',
  // Transform files with babel-jest
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  // Ignore node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(@babel|@jest)/)'
  ]
};
