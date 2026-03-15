/**
 * @file aiAssistantPopoutHelper.ts
 * @module utils
 * @description Helper to open AI Assistant in a popout window — moveable outside host page, still communicates via postMessage
 */

import { logger } from './logger';

const POPUP_WIDTH = 520;
const POPUP_HEIGHT = 720;

/** Message type for agent → host navigation */
export const AI_ASSISTANT_NAVIGATE = 'ai-assistant-navigate';

/**
 * Open the AI Assistant in a popout window.
 * The popout can be moved anywhere on screen and still communicates with the host via postMessage.
 */
export function openAIAssistantPopout(): Window | null {
	const left = Math.max(0, (window.screen.width - POPUP_WIDTH) / 2);
	const top = Math.max(0, (window.screen.height - POPUP_HEIGHT) / 2);
	const features = `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no`;

	const popup = window.open('/ai-assistant-popout', 'aiAssistantPopout', features);

	if (!popup) {
		logger.warn(
			'aiAssistantPopoutHelper',
			'Popup blocked. Allow popups for this site to use the AI Assistant popout.'
		);
		return null;
	}

	popup.focus();
	return popup;
}

/** Returns true when the current page is the AI Assistant popout window. */
export function isAIAssistantPopout(): boolean {
	return typeof window !== 'undefined' && window.location.pathname.includes('/ai-assistant-popout');
}

/** Tell the host page to navigate to a path. Call from popout when user clicks an internal link. */
export function notifyHostNavigate(path: string): void {
	if (window.opener && !window.opener.closed) {
		window.opener.postMessage({ type: AI_ASSISTANT_NAVIGATE, path }, window.location.origin);
		window.opener.focus();
	}
}
