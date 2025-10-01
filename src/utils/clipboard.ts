// src/utils/clipboard.ts - Clipboard utilities

/**
 * Show visual copy success feedback
 * @param label - Label for the copied item
 */
const showCopySuccess = (label: string) => {
	// Create a temporary success message
	const successMsg = document.createElement('div');
	successMsg.textContent = ` ${label} copied to clipboard!`;
	successMsg.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideInRight 0.3s ease-out;
  `;

	// Add animation keyframes if not already present
	if (!document.getElementById('copy-feedback-styles')) {
		const style = document.createElement('style');
		style.id = 'copy-feedback-styles';
		style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
		document.head.appendChild(style);
	}

	document.body.appendChild(successMsg);

	// Remove after 3 seconds with fade out
	setTimeout(() => {
		successMsg.style.animation = 'slideOutRight 0.3s ease-in';
		setTimeout(() => {
			if (successMsg.parentNode) {
				successMsg.parentNode.removeChild(successMsg);
			}
		}, 300);
	}, 3000);
};

/**
 * Copy text to clipboard with user feedback
 * @param text - Text to copy
 * @param label - Label for user feedback (optional)
 */
export const copyToClipboard = async (text: string, label?: string): Promise<void> => {
	try {
		await navigator.clipboard.writeText(text);
		console.log(` [Clipboard] Copied ${label || 'text'} to clipboard`);

		// Show visual success feedback
		const labelText = label || 'Text';
		showCopySuccess(labelText);
	} catch (error) {
		console.error(' [Clipboard] Failed to copy to clipboard:', error);

		// Fallback for older browsers
		try {
			const textArea = document.createElement('textarea');
			textArea.value = text;
			textArea.style.position = 'fixed';
			textArea.style.left = '-999999px';
			textArea.style.top = '-999999px';
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			document.execCommand('copy');
			textArea.remove();

			console.log(` [Clipboard] Copied ${label || 'text'} using fallback method`);
			showCopySuccess(label || 'Text');
		} catch (fallbackError) {
			console.error(' [Clipboard] Fallback copy failed:', fallbackError);
			throw new Error(`Failed to copy ${label || 'text'} to clipboard`);
		}
	}
};

export default { copyToClipboard };
