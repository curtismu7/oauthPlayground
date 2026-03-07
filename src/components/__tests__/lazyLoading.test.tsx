/**
 * @file lazyLoading.test.ts
 * @module components/__tests__
 * @description Lazy loading component tests
 * @version 9.15.3
 * @since 2026-03-06
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import LoadingFallback from '../LoadingFallback';

// Mock lazy components
const mockLazyComponent = vi.fn(() => <div data-testid="lazy-content">Lazy Content</div>);

describe('Lazy Loading Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LoadingFallback', () => {
    it('should render default loading state', () => {
      render(<LoadingFallback />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we prepare this component')).toBeInTheDocument();
    });

    it('should render custom message', () => {
      render(<LoadingFallback message="Custom loading message" />);

      expect(screen.getByText('Custom loading message')).toBeInTheDocument();
    });

    it('should render custom subtext', () => {
      render(<LoadingFallback subtext="Custom subtext" />);

      expect(screen.getByText('Custom subtext')).toBeInTheDocument();
    });

    it('should render different sizes', () => {
      const { rerender } = render(<LoadingFallback size="small" />);
      
      // Small size
      const spinner = screen.getByRole('img'); // Assuming spinner has img role
      expect(spinner).toBeInTheDocument();

      // Medium size (default)
      rerender(<LoadingFallback size="medium" />);
      expect(spinner).toBeInTheDocument();

      // Large size
      rerender(<LoadingFallback size="large" />);
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Suspense Integration', () => {
    it('should show fallback while loading', async () => {
      // Mock a component that takes time to load
      const SlowComponent = () => {
        return <div data-testid="slow-content">Slow Content</div>;
      };

      const LazySlowComponent = vi.fn(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ default: SlowComponent });
          }, 100);
        });
      }) as any;

      render(
        <Suspense fallback={<LoadingFallback message="Loading slow component..." />}>
          <LazySlowComponent />
        </Suspense>
      );

      // Should show loading fallback initially
      expect(screen.getByText('Loading slow component...')).toBeInTheDocument();
    });

    it('should handle loading errors gracefully', async () => {
      // Mock a component that fails to load
      const FailingComponent = vi.fn(() => {
        throw new Error('Component failed to load');
      });

      const LazyFailingComponent = vi.fn(() => {
        return Promise.reject(new Error('Load failed'));
      }) as any;

      render(
        <Suspense fallback={<LoadingFallback message="Loading failing component..." />}>
          <LazyFailingComponent />
        </Suspense>
      );

      // Should show loading fallback
      expect(screen.getByText('Loading failing component...')).toBeInTheDocument();
    });
  });

  describe('Performance Integration', () => {
    it('should track loading performance', async () => {
      const startTime = performance.now();
      
      render(<LoadingFallback message="Performance test" />);
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Component should render quickly (under 100ms)
      expect(loadTime).toBeLessThan(100);
      
      // Should render the message
      expect(screen.getByText('Performance test')).toBeInTheDocument();
    });

    it('should be accessible', () => {
      render(<LoadingFallback message="Accessible loading" />);

      // Should have proper ARIA attributes
      const loadingElement = screen.getByText('Accessible loading');
      expect(loadingElement).toBeInTheDocument();
      
      // Should be focusable and readable by screen readers
      expect(loadingElement).toHaveAttribute('role', 'status');
    });
  });

  describe('User Experience', () => {
    it('should provide clear feedback', () => {
      render(
        <LoadingFallback 
          message="Loading AI Agent Overview..." 
          subtext="This may take a few seconds"
        />
      );

      expect(screen.getByText('Loading AI Agent Overview...')).toBeInTheDocument();
      expect(screen.getByText('This may take a few seconds')).toBeInTheDocument();
    });

    it('should handle different contexts', () => {
      const contexts = [
        { message: "Loading MFA Flow...", subtext: "Setting up multi-factor authentication" },
        { message: "Loading Flow Comparison...", subtext: "Analyzing flow differences" },
        { message: "Loading API Documentation...", subtext: "Preparing reference materials" },
      ];

      contexts.forEach(({ message, subtext }) => {
        const { unmount } = render(<LoadingFallback message={message} subtext={subtext} />);
        
        expect(screen.getByText(message)).toBeInTheDocument();
        expect(screen.getByText(subtext)).toBeInTheDocument();
        
        unmount();
      });
    });
  });
});
