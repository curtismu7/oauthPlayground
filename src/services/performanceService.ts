import { logger } from '../utils/logger';
/**
 * @file performanceService.ts
 * @module services
 * @description Performance monitoring and optimization service
 * @version 9.15.1
 * @since 2026-03-06
 */

interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  bundleLoadTime: number;
}

interface ChunkLoadInfo {
  name: string;
  size: number;
  loadTime: number;
  timestamp: number;
}

class PerformanceService {
  private metrics: Partial<PerformanceMetrics> = {};
  private chunkLoads: ChunkLoadInfo[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializePerformanceObservers();
    this.trackChunkLoading();
  }

  /**
   * Initialize performance observers for Core Web Vitals
   */
  private initializePerformanceObservers(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    // First Contentful Paint
    this.observePerformanceEntry('paint', (entries) => {
      const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        this.metrics.firstContentfulPaint = fcp.startTime;
      }
    });

    // Largest Contentful Paint
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      const lcp = entries[entries.length - 1]; // Get the latest LCP
      if (lcp) {
        this.metrics.largestContentfulPaint = lcp.startTime;
      }
    });

    // First Input Delay
    this.observePerformanceEntry('first-input', (entries) => {
      const fid = entries[0];
      if (fid) {
        this.metrics.firstInputDelay = fid.processingStart - fid.startTime;
      }
    });

    // Cumulative Layout Shift
    this.observePerformanceEntry('layout-shift', (entries) => {
      let clsValue = 0;
      entries.forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      this.metrics.cumulativeLayoutShift = clsValue;
    });
  }

  /**
   * Observe performance entries
   */
  private observePerformanceEntry(type: string, callback: (entries: PerformanceEntry[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type, buffered: true });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('PerformanceService', `Performance observer for ${type} not supported:`);
    }
  }

  /**
   * Track chunk loading times
   */
  private trackChunkLoading(): void {
    if (typeof window === 'undefined') return;

    // Override import() to track chunk loading
    const originalImport = window.import || (window as any).__dynamicImport__;
    if (originalImport) {
      (window as any).__dynamicImport__ = async (...args: any[]) => {
        const startTime = performance.now();
        try {
          const result = await originalImport.apply(window, args);
          const loadTime = performance.now() - startTime;
          
          // Extract chunk name from the module URL
          const chunkName = this.extractChunkName(args[0]);
          const chunkSize = this.estimateChunkSize(result);
          
          this.chunkLoads.push({
            name: chunkName,
            size: chunkSize,
            loadTime,
            timestamp: Date.now(),
          });

          return result;
        } catch (error) {
          const loadTime = performance.now() - startTime;
          logger.warn('PerformanceService', `Chunk loading failed after ${loadTime.toFixed(2)}ms:`);
          throw error;
        }
      };
    }
  }

  /**
   * Extract chunk name from module path
   */
  private extractChunkName(modulePath: string): string {
    if (typeof modulePath !== 'string') return 'unknown';
    
    const parts = modulePath.split('/');
    const fileName = parts[parts.length - 1];
    const nameWithoutExtension = fileName.split('.')[0];
    return nameWithoutExtension || 'unknown';
  }

  /**
   * Estimate chunk size (rough approximation)
   */
  private estimateChunkSize(module: any): number {
    if (module && typeof module === 'object') {
      try {
        const jsonString = JSON.stringify(module);
        return new Blob([jsonString]).size;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get chunk loading information
   */
  public getChunkLoads(): ChunkLoadInfo[] {
    return [...this.chunkLoads];
  }

  /**
   * Get average chunk load time
   */
  public getAverageChunkLoadTime(): number {
    if (this.chunkLoads.length === 0) return 0;
    const total = this.chunkLoads.reduce((sum, chunk) => sum + chunk.loadTime, 0);
    return total / this.chunkLoads.length;
  }

  /**
   * Get slowest chunks
   */
  public getSlowestChunks(limit: number = 5): ChunkLoadInfo[] {
    return [...this.chunkLoads]
      .sort((a, b) => b.loadTime - a.loadTime)
      .slice(0, limit);
  }

  /**
   * Check if performance is good
   */
  public isPerformanceGood(): boolean {
    const { firstContentfulPaint = 0, largestContentfulPaint = 0, firstInputDelay = 0, cumulativeLayoutShift = 0 } = this.metrics;
    
    return (
      firstContentfulPaint < 1800 && // Good FCP
      largestContentfulPaint < 2500 && // Good LCP
      firstInputDelay < 100 && // Good FID
      cumulativeLayoutShift < 0.1 // Good CLS
    );
  }

  /**
   * Get performance grade
   */
  public getPerformanceGrade(): 'A' | 'B' | 'C' | 'D' | 'F' {
    const metrics = this.metrics;
    let score = 100;

    // FCP scoring
    if (metrics.firstContentfulPaint) {
      if (metrics.firstContentfulPaint > 3000) score -= 30;
      else if (metrics.firstContentfulPaint > 1800) score -= 20;
      else if (metrics.firstContentfulPaint > 1000) score -= 10;
    }

    // LCP scoring
    if (metrics.largestContentfulPaint) {
      if (metrics.largestContentfulPaint > 4000) score -= 30;
      else if (metrics.largestContentfulPaint > 2500) score -= 20;
      else if (metrics.largestContentfulPaint > 1200) score -= 10;
    }

    // FID scoring
    if (metrics.firstInputDelay) {
      if (metrics.firstInputDelay > 300) score -= 30;
      else if (metrics.firstInputDelay > 100) score -= 20;
      else if (metrics.firstInputDelay > 50) score -= 10;
    }

    // CLS scoring
    if (metrics.cumulativeLayoutShift) {
      if (metrics.cumulativeLayoutShift > 0.25) score -= 30;
      else if (metrics.cumulativeLayoutShift > 0.1) score -= 20;
      else if (metrics.cumulativeLayoutShift > 0.05) score -= 10;
    }

    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Log performance summary
   */
  public logPerformanceSummary(): void {
    const metrics = this.metrics;
    const grade = this.getPerformanceGrade();
    const avgChunkTime = this.getAverageChunkLoadTime();
    const slowChunks = this.getSlowestChunks(3);

    console.group('🚀 Performance Summary');
    console.log(`📊 Grade: ${grade}`);
    console.log(`⚡ FCP: ${metrics.firstContentfulPaint?.toFixed(2)}ms`);
    console.log(`🎯 LCP: ${metrics.largestContentfulPaint?.toFixed(2)}ms`);
    console.log(`⏱️ FID: ${metrics.firstInputDelay?.toFixed(2)}ms`);
    console.log(`📐 CLS: ${metrics.cumulativeLayoutShift?.toFixed(3)}`);
    console.log(`📦 Avg Chunk Load: ${avgChunkTime.toFixed(2)}ms`);
    
    if (slowChunks.length > 0) {
      console.log('🐌 Slowest Chunks:');
      slowChunks.forEach((chunk, index) => {
        console.log(`  ${index + 1}. ${chunk.name}: ${chunk.loadTime.toFixed(2)}ms (${(chunk.size / 1024).toFixed(1)}KB)`);
      });
    }
    
    console.groupEnd();
  }

  /**
   * Cleanup observers
   */
  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();

export default performanceService;
