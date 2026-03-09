import React, { lazy, Suspense, useEffect, useState } from 'react';
import { UI_STANDARDS } from '@/v8/constants/uiStandardsV8';

interface LazyLoadWrapperV8Props {
	loader: () => Promise<{ default: React.ComponentType<any> }>;
	fallback?: React.ReactNode;
	errorFallback?: React.ReactNode;
	delay?: number;
	threshold?: number;
	rootMargin?: string;
	className?: string;
	onLoad?: () => void;
	onError?: (error: Error) => void;
	children?: React.ReactNode;
}

interface LoadingSpinnerProps {
	size?: 'sm' | 'md' | 'lg';
	message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', message = 'Loading...' }) => {
	const getSizeStyles = () => {
		switch (size) {
			case 'sm':
				return { width: '20px', height: '20px', fontSize: '12px' };
			case 'md':
				return { width: '32px', height: '32px', fontSize: '14px' };
			case 'lg':
				return { width: '48px', height: '48px', fontSize: '16px' };
			default:
				return { width: '32px', height: '32px', fontSize: '14px' };
		}
	};

	const sizeStyles = getSizeStyles();

	return (
		<div className="loading-spinner" style={sizeStyles}>
			<div className="spinner-circle" />
			{message && <div className="spinner-message">{message}</div>}
			<style>{`
				.loading-spinner {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					gap: ${UI_STANDARDS.spacing.sm};
				}

				.spinner-circle {
					border: 2px solid ${UI_STANDARDS.colors.default};
					border-top: 2px solid ${UI_STANDARDS.colors.focus};
					border-radius: 50%;
					animation: spin 1s linear infinite;
				}

				.spinner-message {
					color: ${UI_STANDARDS.colors.default};
					font-size: ${sizeStyles.fontSize};
					text-align: center;
				}

				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			`}</style>
		</div>
	);
};

export const LazyLoadWrapperV8: React.FC<LazyLoadWrapperV8Props> = ({
	loader,
	fallback,
	errorFallback,
	delay = 200,
	threshold = 0.1,
	rootMargin = '50px',
	className = '',
	onLoad,
	onError,
}) => {
	const [LazyComponent, setLazyComponent] = useState<React.ComponentType<any> | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [hasIntersected, setHasIntersected] = useState(false);
	const [showDelayFallback, setShowDelayFallback] = useState(false);
	const observerRef = React.useRef<HTMLDivElement>(null);

	// Delay fallback visibility
	useEffect(() => {
		if (isLoading) {
			const timer = setTimeout(() => {
				setShowDelayFallback(true);
			}, delay);
			return () => clearTimeout(timer);
		} else {
			setShowDelayFallback(false);
		}
	}, [isLoading, delay]);

	// Intersection Observer for lazy loading
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry.isIntersecting && !hasIntersected) {
					setHasIntersected(true);
					loadComponent();
				}
			},
			{
				threshold,
				rootMargin,
			}
		);

		const currentRef = observerRef.current;
		if (currentRef) {
			observer.observe(currentRef);
		}

		return () => {
			if (currentRef) {
				observer.unobserve(currentRef);
			}
		};
	}, [threshold, rootMargin, hasIntersected, loadComponent]);

	const loadComponent = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const module = await loader();
			setLazyComponent(() => module.default);
			onLoad?.();
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Failed to load component');
			setError(error);
			onError?.(error);
		} finally {
			setIsLoading(false);
		}
	};

	const defaultFallback = (
		<div className="lazy-load-fallback">
			{showDelayFallback && <LoadingSpinner message="Loading component..." />}
			<style>{`
				.lazy-load-fallback {
					display: flex;
					align-items: center;
					justify-content: center;
					min-height: 200px;
					background: ${UI_STANDARDS.colors.background};
					border: 1px solid ${UI_STANDARDS.colors.default};
					border-radius: ${UI_STANDARDS.borders.radius.md};
				}
			`}</style>
		</div>
	);

	const defaultErrorFallback = (
		<div className="lazy-load-error">
			<div className="error-icon">⚠</div>
			<div className="error-message">Failed to load component</div>
			<button type="button" className="retry-button" onClick={loadComponent}>
				Retry
			</button>
			<style>{`
				.lazy-load-error {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					min-height: 200px;
					gap: ${UI_STANDARDS.spacing.md};
					background: ${UI_STANDARDS.messageColors.error.background};
					border: 1px solid ${UI_STANDARDS.messageColors.error.border};
					border-radius: ${UI_STANDARDS.borders.radius.md};
					padding: ${UI_STANDARDS.spacing.lg};
				}

				.error-icon {
					font-size: 32px;
					color: ${UI_STANDARDS.messageColors.error.border};
				}

				.error-message {
					color: ${UI_STANDARDS.messageColors.error.text};
					font-size: ${UI_STANDARDS.typography.fontSizes.sm};
					text-align: center;
				}

				.retry-button {
					padding: ${UI_STANDARDS.spacing.sm} ${UI_STANDARDS.spacing.md};
					background: ${UI_STANDARDS.colors.focus};
					color: white;
					border: none;
					border-radius: ${UI_STANDARDS.borders.radius.sm};
					cursor: pointer;
					font-size: ${UI_STANDARDS.typography.fontSizes.sm};
					transition: background-color ${UI_STANDARDS.animations.duration.fast} ${UI_STANDARDS.animations.easing.default};
				}

				.retry-button:hover {
					background: ${UI_STANDARDS.colors.hover};
				}
			`}</style>
		</div>
	);

	if (error) {
		return <>{errorFallback || defaultErrorFallback}</>;
	}

	if (LazyComponent) {
		return (
			<Suspense fallback={fallback || defaultFallback}>
				<LazyComponent />
			</Suspense>
		);
	}

	return (
		<div ref={observerRef} className={`lazy-load-wrapper ${className}`}>
			{isLoading && (fallback || defaultFallback)}
		</div>
	);
};

// Higher-order component for easy lazy loading
export function withLazyLoad<P extends object>(
	componentLoader: () => Promise<{ default: React.ComponentType<P> }>,
	options?: Omit<LazyLoadWrapperV8Props, 'loader'>
) {
	const LazyComponent = lazy(componentLoader);

	return function WithLazyLoadWrapper(props: P) {
		return (
			<LazyLoadWrapperV8 loader={componentLoader} {...options}>
				<LazyComponent {...props} />
			</LazyLoadWrapperV8>
		);
	};
}

// Preloading utility
export class ComponentPreloader {
	private static preloadCache = new Map<string, Promise<any>>();

	static preload(key: string, loader: () => Promise<{ default: React.ComponentType<any> }>) {
		if (!ComponentPreloader.preloadCache.has(key)) {
			ComponentPreloader.preloadCache.set(key, loader());
		}
		return ComponentPreloader.preloadCache.get(key);
	}

	static preloadMultiple(
		preloadMap: Record<string, () => Promise<{ default: React.ComponentType<any> }>>
	) {
		const promises = Object.entries(preloadMap).map(([key, loader]) =>
			ComponentPreloader.preload(key, loader)
		);
		return Promise.allSettled(promises);
	}

	static clearCache() {
		ComponentPreloader.preloadCache.clear();
	}
}

export default LazyLoadWrapperV8;
