// src/hooks/useNotifications.ts
import { useMemo } from 'react';
import type { NotificationOptions } from '../contexts/NotificationSystem';
import {
	NotificationContainer,
	NotificationProvider,
	showGlobalApiError,
	showGlobalError,
	showGlobalInfo,
	showGlobalNotification,
	showGlobalNotify,
	showGlobalRetryableError,
	showGlobalSaveSuccess,
	showGlobalSuccess,
	showGlobalWarning,
	useNotifications as useNotificationContext,
} from '../contexts/NotificationSystem';

export {
	NotificationContainer,
	NotificationProvider,
	showGlobalApiError,
	showGlobalError,
	showGlobalInfo,
	showGlobalNotification,
	showGlobalNotify,
	showGlobalRetryableError,
	showGlobalSaveSuccess,
	showGlobalSuccess,
	showGlobalWarning,
};

export const useNotifications = () => {
	const context = useNotificationContext();

	return useMemo(
		() => ({
			show: context.show,
			dismiss: context.dismiss,
			showSuccess: context.showSuccess,
			showError: context.showError,
			showWarning: context.showWarning,
			showInfo: context.showInfo,
			showApiError: context.showApiError,
			showSaveSuccess: context.showSaveSuccess,
			showRetryableError: context.showRetryableError,
			notify: context.notify,
		}),
		[context]
	);
};

export type { NotificationOptions };
