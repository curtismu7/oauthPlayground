/**
 * @file PageTransition.tsx
 * @module v8/components
 * @description Page transition component for smooth navigation
 * @version 9.1.0
 */

import React, { ReactNode, useEffect, useState } from 'react';

interface PageTransitionProps {
	children: ReactNode;
	duration?: number;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
	children,
	duration = 300,
}) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setIsVisible(true);
	}, []);

	return (
		<div
			style={{
				opacity: isVisible ? 1 : 0,
				transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
				transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
			}}
		>
			{children}
		</div>
	);
};
