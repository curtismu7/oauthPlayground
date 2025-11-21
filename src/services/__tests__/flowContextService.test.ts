// src/services/__tests__/flowContextService.test.ts
// Tests for FlowContextService

import FlowContextService, { type FlowContext } from '../flowContextService';

// Mock sessionStorage
const mockSessionStorage = {
	store: {} as Record<string, string>,
	getItem: jest.fn((key: string) => mockSessionStorage.store[key] || null),
	setItem: jest.fn((key: string, value: string) => {
		mockSessionStorage.store[key] = value;
	}),
	removeItem: jest.fn((key: string) => {
		delete mockSessionStorage.store[key];
	}),
	clear: jest.fn(() => {
		mockSessionStorage.store = {};
	}),
};

Object.defineProperty(window, 'sessionStorage', {
	value: mockSessionStorage,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
	value: {
		userAgent: 'Mozilla/5.0 (Test Browser)',
	},
});

describe('FlowContextService', () => {
	beforeEach(() => {
		// Clear mocks and storage
		jest.clearAllMocks();
		mockSessionStorage.clear();
	});

	describe('saveFlowContext', () => {
		it('should save valid flow context', () => {
			const context: FlowContext = {
				flowType: 'authorization-code',
				currentStep: 1,
				returnPath: '/flows/authorization-code',
				flowState: { test: 'data' },
				timestamp: Date.now(),
			};

			const result = FlowContextService.saveFlowContext('test-flow', context);

			expect(result).toBe(true);
			expect(mockSessionStorage.setItem).toHaveBeenCalled();
		});

		it('should reject invalid flow context', () => {
			const invalidContext = {
				// Missing required fields
				flowType: '',
				currentStep: -1,
				returnPath: '',
				flowState: null,
				timestamp: 0,
			} as unknown as FlowContext;

			const result = FlowContextService.saveFlowContext('test-flow', invalidContext);

			expect(result).toBe(false);
			expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
		});

		it('should reject oversized context', () => {
			const largeContext: FlowContext = {
				flowType: 'authorization-code',
				currentStep: 1,
				returnPath: '/flows/authorization-code',
				flowState: { largeData: 'x'.repeat(60000) }, // Exceeds 50KB limit
				timestamp: Date.now(),
			};

			const result = FlowContextService.saveFlowContext('test-flow', largeContext);

			expect(result).toBe(false);
			expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
		});
	});

	describe('getFlowContext', () => {
		it('should retrieve valid flow context', () => {
			const context: FlowContext = {
				flowType: 'authorization-code',
				currentStep: 1,
				returnPath: '/flows/authorization-code',
				flowState: { test: 'data' },
				timestamp: Date.now(),
			};

			mockSessionStorage.store['flowContext'] = JSON.stringify(context);

			const result = FlowContextService.getFlowContext();

			expect(result).toEqual(
				expect.objectContaining({
					flowType: 'authorization-code',
					currentStep: 1,
					returnPath: '/flows/authorization-code',
				})
			);
		});

		it('should return null for expired context', () => {
			const expiredContext: FlowContext = {
				flowType: 'authorization-code',
				currentStep: 1,
				returnPath: '/flows/authorization-code',
				flowState: { test: 'data' },
				timestamp: Date.now() - 40 * 60 * 1000, // 40 minutes ago (expired)
			};

			mockSessionStorage.store['flowContext'] = JSON.stringify(expiredContext);

			const result = FlowContextService.getFlowContext();

			expect(result).toBeNull();
			expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('flowContext');
		});

		it('should return null for invalid JSON', () => {
			mockSessionStorage.store['flowContext'] = 'invalid-json';

			const result = FlowContextService.getFlowContext();

			expect(result).toBeNull();
		});

		it('should return null when no context exists', () => {
			const result = FlowContextService.getFlowContext();

			expect(result).toBeNull();
		});
	});

	describe('clearFlowContext', () => {
		it('should clear specific flow context', () => {
			mockSessionStorage.store['flowContext'] = 'test-data';

			FlowContextService.clearFlowContext('flowContext');

			expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('flowContext');
		});

		it('should clear all flow contexts when no specific key provided', () => {
			mockSessionStorage.store['flowContext'] = 'test-data';
			mockSessionStorage.store['tokenManagementFlowContext'] = 'test-data';
			mockSessionStorage.store['implicit_flow_v3_context'] = 'test-data';

			FlowContextService.clearFlowContext();

			expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('flowContext');
			expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('tokenManagementFlowContext');
			expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('implicit_flow_v3_context');
		});
	});

	describe('buildReturnPath', () => {
		it('should build correct path for known flow types', () => {
			const path = FlowContextService.buildReturnPath('authorization-code');
			expect(path).toBe('/flows/authorization-code');
		});

		it('should build path with step parameter', () => {
			const path = FlowContextService.buildReturnPath('authorization-code', '2');
			expect(path).toBe('/flows/authorization-code?step=2');
		});

		it('should build path with additional parameters', () => {
			const path = FlowContextService.buildReturnPath('authorization-code', '2', {
				test: 'value',
				another: 'param',
			});
			expect(path).toContain('/flows/authorization-code?');
			expect(path).toContain('step=2');
			expect(path).toContain('test=value');
			expect(path).toContain('another=param');
		});

		it('should return dashboard for unknown flow types', () => {
			const path = FlowContextService.buildReturnPath('unknown-flow');
			expect(path).toBe('/dashboard');
		});

		it('should handle RAR flows correctly', () => {
			expect(FlowContextService.buildReturnPath('rar')).toBe('/flows/rar');
			expect(FlowContextService.buildReturnPath('rar-v5')).toBe('/flows/rar-v5');
			expect(FlowContextService.buildReturnPath('rar-v6')).toBe('/flows/rar-v6');
		});

		it('should handle MFA flows correctly', () => {
			expect(FlowContextService.buildReturnPath('pingone-mfa')).toBe('/flows/pingone-mfa');
			expect(FlowContextService.buildReturnPath('pingone-mfa-v5')).toBe('/flows/pingone-mfa-v5');
			expect(FlowContextService.buildReturnPath('pingone-mfa-v6')).toBe('/flows/pingone-mfa-v6');
		});
	});

	describe('validateFlowContext', () => {
		it('should validate correct flow context', () => {
			const context: FlowContext = {
				flowType: 'authorization-code',
				currentStep: 1,
				returnPath: '/flows/authorization-code',
				flowState: { test: 'data' },
				timestamp: Date.now(),
			};

			const result = FlowContextService.validateFlowContext(context);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should detect missing required fields', () => {
			const invalidContext = {
				// Missing flowType
				currentStep: 1,
				returnPath: '/flows/authorization-code',
				flowState: { test: 'data' },
				timestamp: Date.now(),
			} as unknown as FlowContext;

			const result = FlowContextService.validateFlowContext(invalidContext);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('flowType is required and must be a string');
		});

		it('should detect invalid return path', () => {
			const context: FlowContext = {
				flowType: 'authorization-code',
				currentStep: 1,
				returnPath: 'javascript:alert("xss")', // Dangerous path
				flowState: { test: 'data' },
				timestamp: Date.now(),
			};

			const result = FlowContextService.validateFlowContext(context);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('returnPath contains invalid characters or patterns');
		});

		it('should detect negative step numbers', () => {
			const context: FlowContext = {
				flowType: 'authorization-code',
				currentStep: -1, // Invalid
				returnPath: '/flows/authorization-code',
				flowState: { test: 'data' },
				timestamp: Date.now(),
			};

			const result = FlowContextService.validateFlowContext(context);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('currentStep must be a non-negative number');
		});
	});

	describe('handleRedirectReturn', () => {
		it('should handle redirect with valid context', () => {
			const context: FlowContext = {
				flowType: 'authorization-code',
				currentStep: 1,
				returnPath: '/flows/authorization-code',
				flowState: { test: 'data' },
				timestamp: Date.now(),
			};

			mockSessionStorage.store['flowContext'] = JSON.stringify(context);

			const result = FlowContextService.handleRedirectReturn({
				code: 'test-code',
				state: 'test-state',
			});

			expect(result.success).toBe(true);
			expect(result.redirectUrl).toContain('/flows/authorization-code');
			expect(result.redirectUrl).toContain('code=test-code');
			expect(result.redirectUrl).toContain('state=test-state');
		});

		it('should handle redirect without context', () => {
			const result = FlowContextService.handleRedirectReturn({
				code: 'test-code',
			});

			expect(result.success).toBe(true);
			expect(result.redirectUrl).toBe('/dashboard');
		});

		it('should handle security validation failure', () => {
			const maliciousContext: FlowContext = {
				flowType: 'authorization-code',
				currentStep: 1,
				returnPath: 'javascript:alert("xss")',
				flowState: { test: 'data' },
				timestamp: Date.now(),
			};

			mockSessionStorage.store['flowContext'] = JSON.stringify(maliciousContext);

			const result = FlowContextService.handleRedirectReturn({
				code: 'test-code',
			});

			expect(result.success).toBe(true);
			expect(result.redirectUrl).toBe('/dashboard');
		});
	});

	describe('createFlowContext', () => {
		it('should create valid flow context', () => {
			const context = FlowContextService.createFlowContext(
				'authorization-code',
				'/flows/authorization-code',
				1,
				{ test: 'data' }
			);

			expect(context.flowType).toBe('authorization-code');
			expect(context.returnPath).toBe('/flows/authorization-code');
			expect(context.currentStep).toBe(1);
			expect(context.flowState).toEqual({ test: 'data' });
			expect(context.timestamp).toBeGreaterThan(0);
		});

		it('should create context with credentials', () => {
			const credentials = {
				environmentId: 'test-env',
				clientId: 'test-client',
				clientSecret: 'test-secret',
			};

			const context = FlowContextService.createFlowContext(
				'authorization-code',
				'/flows/authorization-code',
				1,
				{},
				credentials
			);

			expect(context.credentials).toEqual(credentials);
		});
	});

	describe('updateFlowContext', () => {
		it('should update existing flow context', () => {
			const originalContext: FlowContext = {
				flowType: 'authorization-code',
				currentStep: 1,
				returnPath: '/flows/authorization-code',
				flowState: { test: 'data' },
				timestamp: Date.now(),
			};

			mockSessionStorage.store['flowContext'] = JSON.stringify(originalContext);

			const result = FlowContextService.updateFlowContext('test-flow', {
				currentStep: 2,
				flowState: { updated: 'data' },
			});

			expect(result).toBe(true);
			expect(mockSessionStorage.setItem).toHaveBeenCalled();
		});

		it('should return false for non-existent context', () => {
			const result = FlowContextService.updateFlowContext('non-existent', {
				currentStep: 2,
			});

			expect(result).toBe(false);
		});
	});

	describe('security features', () => {
		it('should reject dangerous return paths', () => {
			const dangerousPaths = [
				'javascript:alert("xss")',
				'data:text/html,<script>alert("xss")</script>',
				'vbscript:msgbox("xss")',
				'//evil.com/redirect',
				'../../../etc/passwd',
			];

			dangerousPaths.forEach((path) => {
				const context: FlowContext = {
					flowType: 'authorization-code',
					currentStep: 1,
					returnPath: path,
					flowState: {},
					timestamp: Date.now(),
				};

				const result = FlowContextService.validateFlowContext(context);
				expect(result.valid).toBe(false);
			});
		});

		it('should accept safe return paths', () => {
			const safePaths = [
				'/flows/authorization-code',
				'/flows/rar-v6?step=2',
				'/flows/pingone-mfa-v5?test=value',
				'/dashboard',
			];

			safePaths.forEach((path) => {
				const context: FlowContext = {
					flowType: 'authorization-code',
					currentStep: 1,
					returnPath: path,
					flowState: {},
					timestamp: Date.now(),
				};

				const result = FlowContextService.validateFlowContext(context);
				expect(result.valid).toBe(true);
			});
		});
	});
});
