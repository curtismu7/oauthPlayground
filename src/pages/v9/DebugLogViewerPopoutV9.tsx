/**
 * @file DebugLogViewerPopoutV9.tsx
 * @module pages/v9
 * @description V9 Popout: renders the same Log Viewer as in-browser (EnhancedFloatingLogViewer in standalone mode).
 * @version 9.13.4
 */

import React from 'react';
import { EnhancedFloatingLogViewer } from '@/components/EnhancedFloatingLogViewer';

/**
 * Popout window for the debug log viewer. Uses the same EnhancedFloatingLogViewer
 * as the in-browser floating panel so behavior and data are identical.
 */
export const DebugLogViewerPopoutV9: React.FC = () => {
	const handleClose = () => {
		if (typeof window !== 'undefined' && window.close) {
			window.close();
		}
	};

	return (
		<EnhancedFloatingLogViewer
			isOpen={true}
			onClose={handleClose}
			initialWidth={typeof window !== 'undefined' ? window.innerWidth : 1200}
			initialHeight={typeof window !== 'undefined' ? window.innerHeight : 800}
			initialX={0}
			initialY={0}
			standalone={true}
		/>
	);
};
