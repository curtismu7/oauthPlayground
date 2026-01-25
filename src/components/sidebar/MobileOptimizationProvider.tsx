/**
 * MobileOptimizationProvider - Mobile touch gestures and responsive behavior
 * Phase 2: User Experience Enhancement
 * 
 * Provides mobile-specific features:
 * - Touch gestures (swipe, long press)
 * - Haptic feedback
 * - Touch-friendly sizing
 * - Responsive breakpoints
 */

import React, { createContext, useContext, useCallback, useRef, useEffect, useState, ReactNode } from 'react';

// Types for mobile optimization
export interface MobileOptimizationContextType {
	isMobile: boolean;
	isTablet: boolean;
	touchStartX: number;
	touchStartY: number;
	isSwiping: boolean;
	swipeDirection: 'left' | 'right' | 'up' | 'down' | null;
	longPressTimer: NodeJS.Timeout | null;
	handleTouchStart: (e: React.TouchEvent) => void;
	handleTouchMove: (e: React.TouchEvent) => void;
	handleTouchEnd: (e: React.TouchEvent) => void;
	triggerHapticFeedback: (type: 'light' | 'medium' | 'heavy') => void;
	getTouchTargetSize: () => number;
}

const MobileOptimizationContext = createContext<MobileOptimizationContextType | undefined>(undefined);

interface MobileOptimizationProviderProps {
	children: ReactNode;
	onSwipeLeft?: () => void;
	onSwipeRight?: () => void;
	onLongPress?: (x: number, y: number) => void;
	breakpointMobile?: number;
	breakpointTablet?: number;
}

export const MobileOptimizationProvider: React.FC<MobileOptimizationProviderProps> = ({
	children,
	onSwipeLeft,
	onSwipeRight,
	onLongPress,
	breakpointMobile = 768,
	breakpointTablet = 1024,
}) => {
	const [isMobile, setIsMobile] = useState(false);
	const [isTablet, setIsTablet] = useState(false);
	const [touchStartX, setTouchStartX] = useState(0);
	const [touchStartY, setTouchStartY] = useState(0);
	const [isSwiping, setIsSwiping] = useState(false);
	const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);
	const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

	const containerRef = useRef<HTMLDivElement>(null);

	// Detect device type
	useEffect(() => {
		const checkDeviceType = () => {
			const width = window.innerWidth;
			setIsMobile(width < breakpointMobile);
			setIsTablet(width >= breakpointMobile && width < breakpointTablet);
		};

		checkDeviceType();
		window.addEventListener('resize', checkDeviceType);
		return () => window.removeEventListener('resize', checkDeviceType);
	}, [breakpointMobile, breakpointTablet]);

	// Touch gesture handlers
	const handleTouchStart = useCallback((e: React.TouchEvent) => {
		const touch = e.touches[0];
		setTouchStartX(touch.clientX);
		setTouchStartY(touch.clientY);
		setIsSwiping(false);
		setSwipeDirection(null);

		// Start long press timer
		if (isMobile && onLongPress) {
			const timer = setTimeout(() => {
				onLongPress(touch.clientX, touch.clientY);
				triggerHapticFeedback('medium');
			}, 500); // 500ms for long press
			setLongPressTimer(timer);
		}
	}, [isMobile, onLongPress]);

	const handleTouchMove = useCallback((e: React.TouchEvent) => {
		// Clear long press timer on move
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			setLongPressTimer(null);
		}

		const touch = e.touches[0];
		const deltaX = touch.clientX - touchStartX;
		const deltaY = touch.clientY - touchStartY;

		// Check if this is a swipe (minimum threshold)
		const minSwipeDistance = 30;
		if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
			setIsSwiping(true);

			// Determine swipe direction
			if (Math.abs(deltaX) > Math.abs(deltaY)) {
				setSwipeDirection(deltaX > 0 ? 'right' : 'left');
			} else {
				setSwipeDirection(deltaY > 0 ? 'down' : 'up');
			}
		}
	}, [touchStartX, touchStartY, longPressTimer]);

	const handleTouchEnd = useCallback((e: React.TouchEvent) => {
		// Clear long press timer
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			setLongPressTimer(null);
		}

		if (isSwiping && swipeDirection) {
			// Trigger swipe callbacks
			if (swipeDirection === 'left' && onSwipeLeft) {
				onSwipeLeft();
				triggerHapticFeedback('light');
			} else if (swipeDirection === 'right' && onSwipeRight) {
				onSwipeRight();
				triggerHapticFeedback('light');
			}
		}

		// Reset swipe state
		setIsSwiping(false);
		setSwipeDirection(null);
	}, [isSwiping, swipeDirection, longPressTimer, onSwipeLeft, onSwipeRight]);

	// Haptic feedback
	const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy') => {
		if ('vibrate' in navigator) {
			switch (type) {
				case 'light':
					navigator.vibrate(10);
					break;
				case 'medium':
					navigator.vibrate(25);
					break;
				case 'heavy':
					navigator.vibrate(50);
					break;
			}
		}
	}, []);

	// Get appropriate touch target size
	const getTouchTargetSize = useCallback(() => {
		if (isMobile) return 44; // iOS HIG minimum
		if (isTablet) return 40;
		return 32; // Desktop
	}, [isMobile, isTablet]);

	// Prevent default touch behaviors on mobile
	useEffect(() => {
		const preventDefaultTouch = (e: TouchEvent) => {
			if (isMobile && containerRef.current?.contains(e.target as Node)) {
				// Allow default scrolling but prevent other default behaviors
				if (e.target === containerRef.current) {
					e.preventDefault();
				}
			}
		};

		if (isMobile) {
			document.addEventListener('touchmove', preventDefaultTouch, { passive: false });
		}

		return () => {
			document.removeEventListener('touchmove', preventDefaultTouch);
		};
	}, [isMobile]);

	const contextValue: MobileOptimizationContextType = {
		isMobile,
		isTablet,
		touchStartX,
		touchStartY,
		isSwiping,
		swipeDirection,
		longPressTimer,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		triggerHapticFeedback,
		getTouchTargetSize,
	};

	return (
		<MobileOptimizationContext.Provider value={contextValue}>
			<div
				ref={containerRef}
				style={{
					touchAction: 'pan-y', // Allow vertical scrolling
					WebkitUserSelect: 'none', // Prevent text selection on mobile
					WebkitTouchCallout: 'none', // Prevent callout on iOS
					WebkitTapHighlightColor: 'transparent', // Remove tap highlight
				}}
			>
				{children}
			</div>
		</MobileOptimizationContext.Provider>
	);
};

export const useMobileOptimization = (): MobileOptimizationContextType => {
	const context = useContext(MobileOptimizationContext);
	if (context === undefined) {
		throw new Error('useMobileOptimization must be used within a MobileOptimizationProvider');
	}
	return context;
};

// Hook for responsive design
export const useResponsive = () => {
	const [windowSize, setWindowSize] = useState({
		width: window.innerWidth,
		height: window.innerHeight,
	});

	useEffect(() => {
		const handleResize = () => {
			setWindowSize({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const isMobile = windowSize.width < 768;
	const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
	const isDesktop = windowSize.width >= 1024;

	return {
		windowSize,
		isMobile,
		isTablet,
		isDesktop,
	};
};

// Hook for touch gestures
export const useTouchGestures = (
	onSwipeLeft?: () => void,
	onSwipeRight?: () => void,
	onSwipeUp?: () => void,
	onSwipeDown?: () => void,
	onLongPress?: (x: number, y: number) => void
) => {
	const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
	const [isGesturing, setIsGesturing] = useState(false);

	const handleTouchStart = useCallback((e: React.TouchEvent) => {
		const touch = e.touches[0];
		setTouchStart({ x: touch.clientX, y: touch.clientY });
		setIsGesturing(false);
	}, []);

	const handleTouchMove = useCallback((e: React.TouchEvent) => {
		const touch = e.touches[0];
		const deltaX = touch.clientX - touchStart.x;
		const deltaY = touch.clientY - touchStart.y;

		const minSwipeDistance = 30;
		if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
			setIsGesturing(true);
		}
	}, [touchStart]);

	const handleTouchEnd = useCallback((e: React.TouchEvent) => {
		if (!isGesturing) return;

		const touch = e.changedTouches[0];
		const deltaX = touch.clientX - touchStart.x;
		const deltaY = touch.clientY - touchStart.y;

		const minSwipeDistance = 30;
		if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
			// Determine swipe direction
			if (Math.abs(deltaX) > Math.abs(deltaY)) {
				// Horizontal swipe
				if (deltaX > 0 && onSwipeRight) {
					onSwipeRight();
				} else if (deltaX < 0 && onSwipeLeft) {
					onSwipeLeft();
				}
			} else {
				// Vertical swipe
				if (deltaY > 0 && onSwipeDown) {
					onSwipeDown();
				} else if (deltaY < 0 && onSwipeUp) {
					onSwipeUp();
				}
			}
		}

		setIsGesturing(false);
	}, [touchStart, isGesturing, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

	return {
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		isGesturing,
	};
};

export default MobileOptimizationProvider;
