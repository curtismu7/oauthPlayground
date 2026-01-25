/**
 * PerformanceMonitor - Performance monitoring utilities for the sidebar
 * Tracks render times, search performance, and user interactions
 */

import { useCallback, useRef, useEffect } from 'react';

// Performance metrics interface
export interface PerformanceMetrics {
	renderTime: number;
	searchTime: number;
	dragOperations: number;
	searchQueries: number;
	menuClicks: number;
	averageRenderTime: number;
	averageSearchTime: number;
	lastUpdated: number;
}

// Performance monitoring class
export class SidebarPerformanceMonitor {
	private static metrics: PerformanceMetrics = {
		renderTime: 0,
		searchTime: 0,
		dragOperations: 0,
		searchQueries: 0,
		menuClicks: 0,
		averageRenderTime: 0,
		averageSearchTime: 0,
		lastUpdated: Date.now(),
	};

	private static renderTimes: number[] = [];
	private static searchTimes: number[] = [];
	private static maxSamples = 50; // Keep last 50 samples for averaging

	// Start timing a render operation
	static startRenderTimer(): () => void {
		const startTime = performance.now();
		
		return () => {
			const endTime = performance.now();
			const renderTime = endTime - startTime;
			
			this.metrics.renderTime = renderTime;
			this.renderTimes.push(renderTime);
			
			// Keep only the last N samples
			if (this.renderTimes.length > this.maxSamples) {
				this.renderTimes.shift();
			}
			
			// Update average
			this.metrics.averageRenderTime = this.calculateAverage(this.renderTimes);
			this.metrics.lastUpdated = Date.now();
			
			// Log slow renders
			if (renderTime > 16) { // More than one frame at 60fps
				console.warn(`🐌 Slow sidebar render: ${renderTime.toFixed(2)}ms`);
			}
		};
	}

	// Start timing a search operation
	static startSearchTimer(): () => void {
		const startTime = performance.now();
		
		return () => {
			const endTime = performance.now();
			const searchTime = endTime - startTime;
			
			this.metrics.searchTime = searchTime;
			this.searchTimes.push(searchTime);
			this.metrics.searchQueries++;
			
			// Keep only the last N samples
			if (this.searchTimes.length > this.maxSamples) {
				this.searchTimes.shift();
			}
			
			// Update average
			this.metrics.averageSearchTime = this.calculateAverage(this.searchTimes);
			this.metrics.lastUpdated = Date.now();
			
			// Log slow searches
			if (searchTime > 100) { // More than 100ms for search
				console.warn(`🔍 Slow sidebar search: ${searchTime.toFixed(2)}ms`);
			}
		};
	}

	// Track drag operations
	static trackDragOperation(): void {
		this.metrics.dragOperations++;
		this.metrics.lastUpdated = Date.now();
	}

	// Track menu clicks
	static trackMenuClick(): void {
		this.metrics.menuClicks++;
		this.metrics.lastUpdated = Date.now();
	}

	// Get current metrics
	static getMetrics(): PerformanceMetrics {
		return { ...this.metrics };
	}

	// Calculate average from array of numbers
	private static calculateAverage(numbers: number[]): number {
		if (numbers.length === 0) return 0;
		const sum = numbers.reduce((acc, num) => acc + num, 0);
		return sum / numbers.length;
	}

	// Reset metrics
	static resetMetrics(): void {
		this.metrics = {
			renderTime: 0,
			searchTime: 0,
			dragOperations: 0,
			searchQueries: 0,
			menuClicks: 0,
			averageRenderTime: 0,
			averageSearchTime: 0,
			lastUpdated: Date.now(),
		};
		this.renderTimes = [];
		this.searchTimes = [];
	}

	// Log performance summary
	static logPerformanceSummary(): void {
		console.group('📊 Sidebar Performance Summary');
		console.log('Average Render Time:', `${this.metrics.averageRenderTime.toFixed(2)}ms`);
		console.log('Average Search Time:', `${this.metrics.averageSearchTime.toFixed(2)}ms`);
		console.log('Total Drag Operations:', this.metrics.dragOperations);
		console.log('Total Search Queries:', this.metrics.searchQueries);
		console.log('Total Menu Clicks:', this.metrics.menuClicks);
		console.log('Last Updated:', new Date(this.metrics.lastUpdated).toISOString());
		console.groupEnd();
	}

	// Check if performance is good
	static isPerformanceGood(): boolean {
		return (
			this.metrics.averageRenderTime < 16 && // Less than one frame at 60fps
			this.metrics.averageSearchTime < 50 && // Search should be fast
			this.renderTimes.length > 0 // Have some data
		);
	}

	// Get performance grade
	static getPerformanceGrade(): 'A' | 'B' | 'C' | 'D' | 'F' {
		const avgRender = this.metrics.averageRenderTime;
		const avgSearch = this.metrics.averageSearchTime;

		if (avgRender < 8 && avgSearch < 25) return 'A';
		if (avgRender < 12 && avgSearch < 40) return 'B';
		if (avgRender < 16 && avgSearch < 60) return 'C';
		if (avgRender < 25 && avgSearch < 100) return 'D';
		return 'F';
	}
}

// Hook for performance monitoring
export const usePerformanceMonitor = () => {
	const renderTimerRef = useRef<(() => void) | null>(null);
	const searchTimerRef = useRef<(() => void) | null>(null);

	// Start render timer
	const startRenderTimer = useCallback(() => {
		renderTimerRef.current = SidebarPerformanceMonitor.startRenderTimer();
	}, []);

	// End render timer
	const endRenderTimer = useCallback(() => {
		if (renderTimerRef.current) {
			renderTimerRef.current();
			renderTimerRef.current = null;
		}
	}, []);

	// Start search timer
	const startSearchTimer = useCallback(() => {
		searchTimerRef.current = SidebarPerformanceMonitor.startSearchTimer();
	}, []);

	// End search timer
	const endSearchTimer = useCallback(() => {
		if (searchTimerRef.current) {
			searchTimerRef.current();
			searchTimerRef.current = null;
		}
	}, []);

	// Track interactions
	const trackDragOperation = useCallback(() => {
		SidebarPerformanceMonitor.trackDragOperation();
	}, []);

	const trackMenuClick = useCallback(() => {
		SidebarPerformanceMonitor.trackMenuClick();
	}, []);

	// Get metrics
	const getMetrics = useCallback(() => {
		return SidebarPerformanceMonitor.getMetrics();
	}, []);

	// Auto-cleanup on unmount
	useEffect(() => {
		return () => {
			// Clean up any running timers
			if (renderTimerRef.current) {
				renderTimerRef.current();
			}
			if (searchTimerRef.current) {
				searchTimerRef.current();
			}
		};
	}, []);

	return {
		startRenderTimer,
		endRenderTimer,
		startSearchTimer,
		endSearchTimer,
		trackDragOperation,
		trackMenuClick,
		getMetrics,
	};
};

// Development-only performance monitoring hook
export const useDevPerformanceMonitor = () => {
	const { getMetrics, ...monitoringFunctions } = usePerformanceMonitor();

	// Log metrics every 30 seconds in development
	useEffect(() => {
		if (process.env.NODE_ENV !== 'development') return;

		const interval = setInterval(() => {
			const metrics = getMetrics();
			const grade = SidebarPerformanceMonitor.getPerformanceGrade();
			
			if (!SidebarPerformanceMonitor.isPerformanceGood()) {
				console.warn(`⚠️ Sidebar performance grade: ${grade}`);
				SidebarPerformanceMonitor.logPerformanceSummary();
			}
		}, 30000);

		return () => clearInterval(interval);
	}, [getMetrics]);

	return monitoringFunctions;
};

export default SidebarPerformanceMonitor;
