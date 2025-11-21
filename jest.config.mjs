// @jest-environment node --experimental-vm-modules
export default {
	preset: null,
	testEnvironment: 'node',
	setupFilesAfterEnv: ['<rootDir>/tests/backend/setup.js'],
	collectCoverageFrom: ['server.js', '!**/node_modules/**', '!**/tests/**'],
	testMatch: ['**/tests/backend/**/*.test.js', '**/tests/backend/**/*.spec.js'],
	coverageDirectory: 'coverage/backend',
	transform: {},
	transformIgnorePatterns: ['node_modules/'],
};
