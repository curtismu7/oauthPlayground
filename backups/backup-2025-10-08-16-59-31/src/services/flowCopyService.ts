// src/services/flowCopyService.ts
import { v4ToastManager } from '../utils/v4ToastMessages';

export class FlowCopyService {
	/**
	 * Creates a copy handler for flow components
	 */
	static createCopyHandler(setCopiedField: (field: string | null) => void) {
		return (text: string, label: string) => {
			v4ToastManager.handleCopyOperation(text, label);
			setCopiedField(label);
			setTimeout(() => setCopiedField(null), 1000);
		};
	}

	/**
	 * Copies text to clipboard with toast notification
	 */
	static async copyToClipboard(text: string, label: string): Promise<void> {
		try {
			await navigator.clipboard.writeText(text);
			v4ToastManager.showSuccess(`Copied ${label} to clipboard`);
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
			v4ToastManager.showError('Failed to copy to clipboard');
		}
	}

	/**
	 * Creates a copy handler that uses the modern clipboard API
	 */
	static createModernCopyHandler() {
		return async (text: string, label: string) => {
			await FlowCopyService.copyToClipboard(text, label);
		};
	}
}
