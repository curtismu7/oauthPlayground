/**
 * @file debugLogViewerPopoutHelperV8.ts
 * @module v8/utils
 * @description Helper utility to open Debug Log Viewer in a popout window
 * @version 9.9.6
 */

const POPUP_WIDTH = 1400;
const POPUP_HEIGHT = 900;

/**
 * Open the Debug Log Viewer in a popout window
 * The popout window can be moved anywhere on the screen, outside browser constraints
 */
export function openDebugLogViewerPopout(): void {
	// Calculate center position
	const left = (window.screen.width - POPUP_WIDTH) / 2;
	const top = (window.screen.height - POPUP_HEIGHT) / 2;

	// Open the popout window
	const popup = window.open(
		'/v8/debug-logs-popout',
		'debugLogViewerPopout',
		`width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes,toolbar=no,menubar=no,location=no`
	);

	if (!popup) {
		// Failed to open popout - user may have blocked popups
		return;
	}

	// Focus the popup
	popup.focus();

	// Handle popup close
	const checkClosed = setInterval(() => {
		if (popup.closed) {
			clearInterval(checkClosed);
		}
	}, 1000);

	// Cleanup after 10 minutes just in case
	setTimeout(() => {
		clearInterval(checkClosed);
	}, 600000);
}

/**
 * Check if we're running in the popout window
 */
export function isPopoutWindow(): boolean {
	return window.location.pathname.includes('/v8/debug-logs-popout');
}
