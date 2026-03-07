/**
 * @file performanceService.test.ts
 * @module services/__tests__
 * @description Performance service tests
 * @version 9.15.3
 * @since 2026-03-06
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { performanceService } from '../performanceService';

// Mock performance API
const mockPerformance = {
	now: vi.fn(),
	mark: vi.fn(),
	measure: vi.fn(),
	getEntriesByType: vi.fn(),
	getEntriesByName: vi.fn(),
};

// Mock PerformanceObserver
const mockPerformanceObserver = vi.fn();

describe('PerformanceService', () => {
	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks();

		// Mock global performance
		Object.defineProperty(global, 'performance', {
			value: mockPerformance,
			writable: true,
		});

		// Mock PerformanceObserver
		global.PerformanceObserver = mockPerformanceObserver as any;

		// Reset performance service state
		(performanceService as any).metrics = {};
		(performanceService as any).chunkLoads = [];
		(performanceService as any).observers = [];
	});

	describe('Initialization', () => {
		it('should initialize without errors', () => {
			expect(performanceService).toBeDefined();
		});

		it('should have empty metrics initially', () => {
			const metrics = performanceService.getMetrics();
			expect(metrics).toEqual({});
		});

		it('should have empty chunk loads initially', () => {
			const chunkLoads = performanceService.getChunkLoads();
			expect(chunkLoads).toEqual([]);
		});
	});

	describe('Metrics Tracking', () => {
		it('should track performance metrics', () => {
			// Mock performance entries
			mockPerformance.getEntriesByType.mockReturnValue([
				{ name: 'first-contentful-paint', startTime: 1000 },
				{ name: 'largest-contentful-paint', startTime: 2000 },
			]);

			// Simulate metrics being set
			(performanceService as any).metrics = {
				firstContentfulPaint: 1000,
				largestContentfulPaint: 2000,
				firstInputDelay: 50,
				cumulativeLayoutShift: 0.1,
			};

			const metrics = performanceService.getMetrics();

			expect(metrics.firstContentfulPaint).toBe(1000);
			expect(metrics.largestContentfulPaint).toBe(2000);
			expect(metrics.firstInputDelay).toBe(50);
			expect(metrics.cumulativeLayoutShift).toBe(0.1);
		});
	});

	describe('Performance Grade', () => {
		it('should return grade A for excellent performance', () => {
			(performanceService as any).metrics = {
				firstContentfulPaint: 1000,
				largestContentfulPaint: 1200,
				firstInputDelay: 50,
				cumulativeLayoutShift: 0.05,
			};

			const grade = performanceService.getPerformanceGrade();
			expect(grade).toBe('A');
		});

		it('should return grade D for moderate performance', () => {
			(performanceService as any).metrics = {
				firstContentfulPaint: 1100,
				largestContentfulPaint: 1300,
				firstInputDelay: 60,
				cumulativeLayoutShift: 0.06,
			};

			const grade = performanceService.getPerformanceGrade();
			expect(grade).toBe('D');
		});

		it('should return grade F for poor performance', () => {
			(performanceService as any).metrics = {
				firstContentfulPaint: 4000,
				largestContentfulPaint: 5000,
				firstInputDelay: 400,
				cumulativeLayoutShift: 0.3,
			};

			const grade = performanceService.getPerformanceGrade();
			expect(grade).toBe('F');
		});
	});

	describe('Chunk Loading', () => {
		it('should track chunk loads', () => {
			const mockChunk = {
				name: 'test-chunk',
				size: 1024,
				loadTime: 150,
				timestamp: Date.now(),
			};

			(performanceService as any).chunkLoads = [mockChunk];

			const chunkLoads = performanceService.getChunkLoads();
			expect(chunkLoads).toHaveLength(1);
			expect(chunkLoads[0]).toEqual(mockChunk);
		});

		it('should calculate average chunk load time', () => {
			const mockChunks = [
				{ name: 'chunk1', size: 1024, loadTime: 100, timestamp: Date.now() },
				{ name: 'chunk2', size: 2048, loadTime: 200, timestamp: Date.now() },
				{ name: 'chunk3', size: 512, loadTime: 150, timestamp: Date.now() },
			];

			(performanceService as any).chunkLoads = mockChunks;

			const avgTime = performanceService.getAverageChunkLoadTime();
			expect(avgTime).toBe(150); // (100 + 200 + 150) / 3
		});

		it('should return 0 for empty chunk loads', () => {
			const avgTime = performanceService.getAverageChunkLoadTime();
			expect(avgTime).toBe(0);
		});

		it('should get slowest chunks', () => {
			const mockChunks = [
				{ name: 'chunk1', size: 1024, loadTime: 100, timestamp: Date.now() },
				{ name: 'chunk2', size: 2048, loadTime: 300, timestamp: Date.now() },
				{ name: 'chunk3', size: 512, loadTime: 200, timestamp: Date.now() },
				{ name: 'chunk4', size: 1024, loadTime: 250, timestamp: Date.now() },
			];

			(performanceService as any).chunkLoads = mockChunks;

			const slowest = performanceService.getSlowestChunks(2);
			expect(slowest).toHaveLength(2);
			expect(slowest[0].name).toBe('chunk2'); // 300ms
			expect(slowest[1].name).toBe('chunk4'); // 250ms
		});
	});

	describe('Performance Check', () => {
		it('should return true for good performance', () => {
			(performanceService as any).metrics = {
				firstContentfulPaint: 1500,
				largestContentfulPaint: 2000,
				firstInputDelay: 80,
				cumulativeLayoutShift: 0.08,
			};

			const isGood = performanceService.isPerformanceGood();
			expect(isGood).toBe(true);
		});

		it('should return false for poor performance', () => {
			(performanceService as any).metrics = {
				firstContentfulPaint: 2000,
				largestContentfulPaint: 3000,
				firstInputDelay: 150,
				cumulativeLayoutShift: 0.15,
			};

			const isGood = performanceService.isPerformanceGood();
			expect(isGood).toBe(false);
		});
	});

	describe('Cleanup', () => {
		it('should cleanup observers', () => {
			const mockDisconnect = vi.fn();
			const mockObserver = { disconnect: mockDisconnect };

			(performanceService as any).observers = [mockObserver];

			performanceService.cleanup();

			expect(mockDisconnect).toHaveBeenCalled();
			expect((performanceService as any).observers).toHaveLength(0);
		});
	});
});
