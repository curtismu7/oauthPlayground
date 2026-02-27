/**
 * @file webhookViewerPopoutHelper.ts
 * @module v8/utils
 * @description Helper utility to open PingOne Webhook Viewer in a popout window
 * @version 1.0.0
 */

const POPUP_WIDTH = 1400;
const POPUP_HEIGHT = 900;

/**
 * Open the Webhook Viewer in a popout window.
 * The popout can be moved anywhere on screen — ideal for monitoring events
 * while running another flow in the main browser tab.
 */
export function openWebhookViewerPopout(): void {
	const left = (window.screen.width - POPUP_WIDTH) / 2;
	const top = (window.screen.height - POPUP_HEIGHT) / 2;

	const popup = window.open(
		'/pingone-webhook-viewer-popout',
		'webhookViewerPopout',
		`width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes,toolbar=no,menubar=no,location=no`
	);

	if (!popup) {
		// Popup blocked — notify user
		alert('Popup blocked. Please allow popups for this site to use the Webhook Viewer popout.');
		return;
	}

	popup.focus();

	const checkClosed = setInterval(() => {
		if (popup.closed) clearInterval(checkClosed);
	}, 1000);

	// Safety cleanup after 2 hours
	setTimeout(() => clearInterval(checkClosed), 7_200_000);
}

/**
 * Returns true when the current page is the webhook viewer popout.
 */
export function isWebhookPopout(): boolean {
	return window.location.pathname.includes('/pingone-webhook-viewer-popout');
}
