/**
 * @file AIAssistantPopoutPage.tsx
 * @module pages
 * @description AI Assistant in a popout window — moveable outside host page, communicates with host via postMessage
 */

import React from 'react';
import AIAssistant from '@/components/AIAssistant';

/**
 * Popout window for the AI Assistant. Renders full-page AI Assistant in popout mode.
 * When user clicks internal links, sends postMessage to host to navigate.
 */
export const AIAssistantPopoutPage: React.FC = () => {
	return (
		<div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
			<AIAssistant fullPage={true} popout={true} />
		</div>
	);
};
