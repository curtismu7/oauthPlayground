/**
 * @file debugLogViewerPopoutHelperV9.ts
 * @module utils/v9
 * @description Helper utility to open Debug Log Viewer V9 in a popout window
 * @version 9.13.4
 */

const POPUP_WIDTH = 1400;
const POPUP_HEIGHT = 900;

/**
 * Open the Debug Log Viewer V9 in a popout window
 * The popout window can be moved anywhere on the screen, outside browser constraints
 */
export function openDebugLogViewerPopoutV9(): void {
	// Calculate center position
	const left = (window.screen.width - POPUP_WIDTH) / 2;
	const top = (window.screen.height - POPUP_HEIGHT) / 2;

	// Open the popout window
	const popup = window.open(
		'/v9/debug-logs-popout',
		'debugLogViewerPopoutV9',
		`width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes,toolbar=no,menubar=no,location=no`
	);

	// Focus the popup window
	if (popup) {
		popup.focus();
	}
}

/**
 * Check if we're running in the V9 popout window
 */
export function isV9PopoutWindow(): boolean {
	return window.location.pathname.includes('/v9/debug-logs-popout');
}

/**
 * Close the popout window (call from within the popout)
 */
export function closeV9PopoutWindow(): void {
	if (isV9PopoutWindow()) {
		window.close();
	}
}

/**
 * Check if popout window is supported
 */
export function isPopoutSupported(): boolean {
	return !!window.open;
}
