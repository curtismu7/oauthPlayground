// src/services/__tests__/redirectStateManager.test.ts
// Tests for RedirectStateManager

import RedirectStateManager, { type FlowState } from '../redirectStateManager';

// Mock FlowContextService
jest.mock('../flowContextService');

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

describe('RedirectStateManager', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSessionStorage.clear();
	});

	describe('preserveFlowState', () => {
		it('should preserve flow state successfully', () => {
			const flowState: FlowState = {
				currentStep: 2,
				credentials: {
					environmentId: 'test-env',
					clientId: 'test-client',
					clientSecret: 'test-secret',
				},
				formData: { test: 'data' },
				tokens: { access_token: 'test-token' },
			};

			const result = RedirectStateManager.preserveFlowState('test-flow', flowState);

			expect(result).toBe(true);
			expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
				'flow_state_test-flow',
				expect.stringContaining('"currentStep":2')
			);
		});

		it('should reject oversized flow state', () => {
			const largeFlowState: FlowState = {
				currentStep: 1,
				formData: { largeData: 'x'.repeat(150000) }, // Exceeds 100KB limit
			};

			const result = RedirectStateManager.preserveFlowState('test-flow', largeFlowState);

			expect(result).toBe(false);
			expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
		});
	});

	describe('restoreFlowState', () => {
		it('should restore valid flow state', () => {
			const flowState: FlowState = {
				currentStep: 2,
				credentials: {
					environmentId: 'test-env',
					clientId: 'test-client',
				},
			};

			const preservedState = {
				...flowState,
				_timestamp: Date.now(),
				_flowId: 'test-flow',
			};

			mockSessionStorage.store['flow_state_test-flow'] = JSON.stringify(preservedState);

			const result = RedirectStateManager.restoreFlowState('test-flow');

			expect(result).toEqual(flowState);
		});
	});
});
