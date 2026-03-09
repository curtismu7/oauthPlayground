// src/contexts/NotificationSystem.tsx

import { FiAlertOctagon, FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from '@icons';
import type { ReactNode } from 'react';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import styled, { css, keyframes } from 'styled-components';

export type NotificationTone = 'success' | 'error' | 'warning' | 'info';
export type NotificationActionVariant = 'primary' | 'secondary';

export interface NotificationAction {
	label: string;
	onClick: () => void;
	variant?: NotificationActionVariant;
	autoClose?: boolean;
}

export interface NotificationOptions {
	message: string;
	description?: string;
	type?: NotificationTone;
	duration?: number;
	actions?: NotificationAction[];
	allowDuplicates?: boolean;
	id?: string;
	persistent?: boolean;
	ariaLabel?: string;
	focusOnRender?: boolean;
	icon?: ReactNode;
	meta?: Record<string, unknown>;
}

interface NotificationItem extends NotificationOptions {
	id: string;
	type: NotificationTone;
	duration: number;
	createdAt: number;
	isExiting: boolean;
	focusOnRender: boolean;
}

interface NotificationContextValue {
	notifications: NotificationItem[];
	show: (options: NotificationOptions) => string;
	dismiss: (id: string) => void;
	showSuccess: (
		message: string,
		options?: Partial<Omit<NotificationOptions, 'message' | 'type'>>
	) => string;
	showError: (
		message: string,
		options?: Partial<Omit<NotificationOptions, 'message' | 'type'>>
	) => string;
	showWarning: (
		message: string,
		options?: Partial<Omit<NotificationOptions, 'message' | 'type'>>
	) => string;
	showInfo: (
		message: string,
		options?: Partial<Omit<NotificationOptions, 'message' | 'type'>>
	) => string;
	showApiError: (error: unknown, fallbackMessage?: string) => string;
	showSaveSuccess: (resource: string) => string;
	showRetryableError: (
		message: string,
		onRetry: () => void,
		options?: Partial<Omit<NotificationOptions, 'message' | 'type'>>
	) => string;
	notify: (message: string, type?: NotificationTone, duration?: number) => string;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const DEFAULT_NOTIFICATION_DURATIONS: Record<NotificationTone, number> = {
	success: 5000, // Increased from 2000ms to 5000ms (5 seconds)
	warning: 4000,
	error: 6000,
	info: 4000,
};

const toneIcons: Record<NotificationTone, JSX.Element> = {
	success: <FiCheckCircle aria-hidden="true" />,
	error: <FiAlertOctagon aria-hidden="true" />,
	warning: <FiAlertTriangle aria-hidden="true" />,
	info: <FiInfo aria-hidden="true" />,
};

const toneStyles: Record<
	NotificationTone,
	{
		background: string;
		border: string;
		shadow: string;
		progress: string;
		iconAccent: string;
	}
> = {
	success: {
		background: 'linear-gradient(135deg, rgba(34,197,94,0.95) 0%, rgba(22,163,74,0.95) 100%)',
		border: 'rgba(187,247,208,0.45)',
		shadow: '0 18px 40px rgba(22,163,74,0.3)',
		progress: 'linear-gradient(90deg, rgba(187,247,208,1) 0%, rgba(74,222,128,1) 100%)',
		iconAccent: 'rgba(220,252,231,0.45)',
	},
	error: {
		background: 'linear-gradient(135deg, rgba(248,113,113,0.95) 0%, rgba(185,28,28,0.95) 100%)',
		border: 'rgba(248,113,113,0.55)',
		shadow: '0 20px 48px rgba(185,28,28,0.3)',
		progress: 'linear-gradient(90deg, rgba(252,165,165,1) 0%, rgba(248,113,113,1) 100%)',
		iconAccent: 'rgba(254,202,202,0.45)',
	},
	warning: {
		background: 'linear-gradient(135deg, rgba(250,204,21,0.95) 0%, rgba(217,119,6,0.95) 100%)',
		border: 'rgba(253,224,71,0.55)',
		shadow: '0 20px 44px rgba(202,138,4,0.3)',
		progress: 'linear-gradient(90deg, rgba(254,240,138,1) 0%, rgba(250,204,21,1) 100%)',
		iconAccent: 'rgba(254,240,138,0.45)',
	},
	info: {
		background: 'linear-gradient(135deg, rgba(96,165,250,0.95) 0%, rgba(14,116,144,0.95) 100%)',
		border: 'rgba(147,197,253,0.5)',
		shadow: '0 18px 42px rgba(37,99,235,0.3)',
		progress: 'linear-gradient(90deg, rgba(191,219,254,1) 0%, rgba(59,130,246,1) 100%)',
		iconAccent: 'rgba(191,219,254,0.45)',
	},
};

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(110%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
`;

const slideOut = keyframes`
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(110%) scale(0.96);
  }
`;

const progressSlide = keyframes`
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
`;

const ToastStack = styled.div`
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 360px;
  z-index: 12000;
  pointer-events: none;

  @media (max-width: 640px) {
    left: 1rem;
    right: 1rem;
    top: 0.75rem;
    max-width: none;
  }
`;

const Toast = styled.div<{ $tone: NotificationTone; $isExiting: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.15rem 1.25rem;
  border-radius: 0.9rem;
  color: #ffffff;
  background: ${({ $tone }) => toneStyles[$tone].background};
  border: 1px solid ${({ $tone }) => toneStyles[$tone].border};
  box-shadow: ${({ $tone }) => toneStyles[$tone].shadow};
  pointer-events: auto;
  animation: ${({ $isExiting }) => ($isExiting ? slideOut : slideIn)} 0.34s ease forwards;
  outline: none;
  backdrop-filter: blur(18px);

  @media (prefers-reduced-motion: reduce) {
    animation-duration: 1ms;
    animation-iteration-count: 1;
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const ToastHeader = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: flex-start;
`;

const IconWrap = styled.div<{ $tone: NotificationTone }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background: ${({ $tone }) => toneStyles[$tone].iconAccent};
  border: 1px solid rgba(255, 255, 255, 0.32);
`;

const TextGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const Title = styled.div`
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.3;
`;

const Description = styled.div`
  font-size: 0.85rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.85);
`;

const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.26);
  }

  &:focus-visible {
    outline: 3px solid rgba(255, 255, 255, 0.5);
    outline-offset: 2px;
  }
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.45rem 0.85rem;
  border-radius: 0.6rem;
  font-weight: 600;
  font-size: 0.82rem;
  border: none;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease;

  ${({ 'data-variant': variant }) => {
		if (variant === 'primary') {
			return css`
        background: rgba(255, 255, 255, 0.25);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.4);
        &:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.32);
        }
      `;
		}

		return css`
      background: rgba(255, 255, 255, 0.92);
      color: #0f172a;
      &:hover {
        transform: translateY(-1px);
        background: rgba(255, 255, 255, 0.98);
      }
    `;
	}}

  &:focus-visible {
    outline: 3px solid rgba(255, 255, 255, 0.45);
    outline-offset: 1px;
  }
`;

const ProgressTrack = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 0 0 0.9rem 0.9rem;
  overflow: hidden;
`;

const ProgressIndicator = styled.div<{
	$tone: NotificationTone;
	$duration: number;
}>`
  width: 100%;
  height: 100%;
  background: ${({ $tone }) => toneStyles[$tone].progress};
  transform-origin: left;
  animation: ${progressSlide} ${({ $duration }) => `${$duration}ms`} linear forwards;

  @media (prefers-reduced-motion: reduce) {
    animation-duration: 1ms;
    animation-iteration-count: 1;
  }
`;

const generateId = (): string => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}

	return Math.random().toString(36).slice(2, 11);
};

interface ParsedApiError {
	message: string;
	description?: string;
}

const parseApiError = (error: unknown, fallback = 'Request failed'): ParsedApiError => {
	if (!error) {
		return { message: fallback };
	}

	if (typeof error === 'string') {
		return { message: error };
	}

	if (error instanceof Error) {
		return { message: error.message || fallback };
	}

	const possibleAxios = error as {
		response?: {
			data?: {
				error?: string;
				error_description?: string;
				message?: string;
				detail?: string;
			};
			status?: number;
			statusText?: string;
		};
		message?: string;
	};

	const detail =
		possibleAxios?.response?.data?.error_description ??
		possibleAxios?.response?.data?.message ??
		possibleAxios?.response?.data?.detail ??
		possibleAxios?.message;

	if (detail) {
		const status = possibleAxios?.response?.status;
		const statusText = possibleAxios?.response?.statusText;
		return {
			message: status ? `${status}: ${statusText ?? 'Error'}` : fallback,
			description: detail,
		};
	}

	if (typeof Response !== 'undefined' && error instanceof Response) {
		return {
			message: `${error.status}: ${error.statusText}`,
			description: fallback,
		};
	}

	return { message: fallback };
};

type NotificationBridge = Pick<
	NotificationContextValue,
	| 'show'
	| 'showSuccess'
	| 'showError'
	| 'showWarning'
	| 'showInfo'
	| 'showApiError'
	| 'showSaveSuccess'
	| 'showRetryableError'
>;

let globalBridge: NotificationBridge | null = null;

const setGlobalBridge = (bridge: NotificationBridge | null) => {
	globalBridge = bridge;
};

const warnMissingProvider = () => {
	if (!globalBridge && typeof console !== 'undefined') {
		console.warn('[Notification] NotificationProvider is not mounted. Notification skipped.');
	}
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const autoDismissTimers = useRef<Map<string, number>>(new Map());
	const duplicateMap = useRef<Map<string, string>>(new Map());

	const clearTimer = useCallback((id: string) => {
		const timer = autoDismissTimers.current.get(id);
		if (timer) {
			window.clearTimeout(timer);
			autoDismissTimers.current.delete(id);
		}
	}, []);

	const finalizeDismiss = useCallback((id: string) => {
		setNotifications((prev) => {
			const target = prev.find((entry) => entry.id === id);
			if (!target) {
				return prev;
			}

			const key = `${target.type}:${target.message.trim()}`;
			if (duplicateMap.current.get(key) === id) {
				duplicateMap.current.delete(key);
			}

			return prev.filter((entry) => entry.id !== id);
		});
	}, []);

	const dismiss = useCallback(
		(id: string) => {
			clearTimer(id);
			setNotifications((prev) =>
				prev.map((entry) => (entry.id === id ? { ...entry, isExiting: true } : entry))
			);
			window.setTimeout(() => finalizeDismiss(id), 240);
		},
		[clearTimer, finalizeDismiss]
	);

	const scheduleAutoDismiss = useCallback(
		(item: NotificationItem) => {
			if (item.duration <= 0) {
				return;
			}

			clearTimer(item.id);
			const timer = window.setTimeout(() => dismiss(item.id), item.duration);
			autoDismissTimers.current.set(item.id, timer);
		},
		[dismiss, clearTimer]
	);

	const show = useCallback(
		(options: NotificationOptions) => {
			const tone: NotificationTone = options.type ?? 'info';
			const messageKey = `${tone}:${options.message.trim()}`;
			const focusOnRender = options.focusOnRender ?? (tone === 'error' || tone === 'warning');
			const duration = options.persistent
				? 0
				: (options.duration ?? DEFAULT_NOTIFICATION_DURATIONS[tone]);

			if (!options.allowDuplicates) {
				const existingId = duplicateMap.current.get(messageKey);
				if (existingId) {
					let updated: NotificationItem | undefined;
					setNotifications((prev) =>
						prev.map((entry) => {
							if (entry.id !== existingId) {
								return entry;
							}

							updated = {
								...entry,
								message: options.message,
								description: options.description,
								actions: options.actions,
								duration,
								createdAt: Date.now(),
								persistent: options.persistent,
								focusOnRender,
								icon: options.icon ?? entry.icon,
								meta: options.meta,
							};
							return updated;
						})
					);

					if (updated) {
						scheduleAutoDismiss(updated);
					}

					return existingId;
				}
			}

			const id = options.id ?? generateId();
			const notification: NotificationItem = {
				...options,
				id,
				type: tone,
				duration,
				createdAt: Date.now(),
				isExiting: false,
				focusOnRender,
			};

			setNotifications((prev) => [...prev, notification]);
			duplicateMap.current.set(messageKey, id);
			scheduleAutoDismiss(notification);
			return id;
		},
		[scheduleAutoDismiss]
	);

	const showSuccess = useCallback(
		(message: string, options?: Partial<Omit<NotificationOptions, 'message' | 'type'>>) =>
			show({ message, type: 'success', ...options }),
		[show]
	);

	const showError = useCallback(
		(message: string, options?: Partial<Omit<NotificationOptions, 'message' | 'type'>>) =>
			show({
				message,
				type: 'error',
				duration: options?.duration ?? DEFAULT_NOTIFICATION_DURATIONS.error,
				...options,
			}),
		[show]
	);

	const showWarning = useCallback(
		(message: string, options?: Partial<Omit<NotificationOptions, 'message' | 'type'>>) =>
			show({
				message,
				type: 'warning',
				duration: options?.duration ?? DEFAULT_NOTIFICATION_DURATIONS.warning,
				...options,
			}),
		[show]
	);

	const showInfo = useCallback(
		(message: string, options?: Partial<Omit<NotificationOptions, 'message' | 'type'>>) =>
			show({
				message,
				type: 'info',
				duration: options?.duration ?? DEFAULT_NOTIFICATION_DURATIONS.info,
				...options,
			}),
		[show]
	);

	const showApiError = useCallback(
		(error: unknown, fallbackMessage?: string) => {
			const parsed = parseApiError(error, fallbackMessage);
			return showError(parsed.message, {
				description: parsed.description,
				duration: DEFAULT_NOTIFICATION_DURATIONS.error,
			});
		},
		[showError]
	);

	const showSaveSuccess = useCallback(
		(resource: string) =>
			showSuccess(`${resource} saved successfully`, {
				description: 'All changes are now up to date.',
				duration: DEFAULT_NOTIFICATION_DURATIONS.success,
			}),
		[showSuccess]
	);

	const showRetryableError = useCallback(
		(
			message: string,
			onRetry: () => void,
			options?: Partial<Omit<NotificationOptions, 'message' | 'type'>>
		) => {
			let id = '';
			id = showError(message, {
				duration: 0,
				persistent: true,
				description: options?.description ?? 'Double-check your configuration, then try again.',
				actions: [
					{
						label: options?.actions?.[0]?.label ?? 'Retry',
						variant: 'primary',
						onClick: () => {
							dismiss(id);
							onRetry();
						},
						autoClose: false,
					},
					{
						label: options?.actions?.[1]?.label ?? 'Dismiss',
						variant: 'secondary',
						onClick: () => dismiss(id),
						autoClose: false,
					},
				],
				...options,
			});
			return id;
		},
		[showError, dismiss]
	);

	const notify = useCallback(
		(message: string, type: NotificationTone = 'info', duration?: number) =>
			show({ message, type, duration }),
		[show]
	);

	useEffect(
		() => () => {
			autoDismissTimers.current.forEach((timer) => {
				window.clearTimeout(timer);
			});
			autoDismissTimers.current.clear();
		},
		[]
	);

	useEffect(() => {
		setGlobalBridge({
			show,
			showSuccess,
			showError,
			showWarning,
			showInfo,
			showApiError,
			showSaveSuccess,
			showRetryableError,
		});

		return () => {
			setGlobalBridge(null);
		};
	}, [
		show,
		showSuccess,
		showError,
		showWarning,
		showInfo,
		showApiError,
		showSaveSuccess,
		showRetryableError,
	]);

	const value = useMemo<NotificationContextValue>(
		() => ({
			notifications,
			show,
			dismiss,
			showSuccess,
			showError,
			showWarning,
			showInfo,
			showApiError,
			showSaveSuccess,
			showRetryableError,
			notify,
		}),
		[
			notifications,
			show,
			dismiss,
			showSuccess,
			showError,
			showWarning,
			showInfo,
			showApiError,
			showSaveSuccess,
			showRetryableError,
			notify,
		]
	);

	return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = (): NotificationContextValue => {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error('useNotifications must be used within a NotificationProvider');
	}
	return context;
};

export const NotificationContainer: React.FC = () => {
	const { notifications, dismiss } = useNotifications();
	const closeRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
	const previousIds = useRef<string[]>([]);

	useEffect(() => {
		const previous = previousIds.current;
		notifications.forEach((notification) => {
			if (!notification.focusOnRender || previous.includes(notification.id)) {
				return;
			}
			const closeEl = closeRefs.current.get(notification.id);
			if (closeEl) {
				closeEl.focus({ preventScroll: true });
			}
		});
		previousIds.current = notifications.map((item) => item.id);
	}, [notifications]);

	if (notifications.length === 0) {
		return null;
	}

	return (
		<ToastStack>
			{notifications.map((notification) => {
				const role: 'alert' | 'status' =
					notification.type === 'error' || notification.type === 'warning' ? 'alert' : 'status';
				const ariaLive: 'assertive' | 'polite' =
					notification.type === 'error' || notification.type === 'warning' ? 'assertive' : 'polite';

				return (
					<Toast
						key={notification.id}
						$tone={notification.type}
						$isExiting={notification.isExiting}
						role={role}
						aria-live={ariaLive}
						tabIndex={0}
						onKeyDown={(event) => {
							if (event.key === 'Escape') {
								event.preventDefault();
								dismiss(notification.id);
							}
						}}
					>
						<ToastHeader>
							<IconWrap $tone={notification.type}>
								{notification.icon ?? toneIcons[notification.type]}
							</IconWrap>
							<TextGroup>
								<Title>{notification.message}</Title>
								{notification.description ? (
									<Description>{notification.description}</Description>
								) : null}
							</TextGroup>
							<CloseButton
								type="button"
								aria-label={notification.ariaLabel ?? 'Dismiss notification'}
								onClick={() => dismiss(notification.id)}
								ref={(node) => {
									if (node) {
										closeRefs.current.set(notification.id, node);
									} else {
										closeRefs.current.delete(notification.id);
									}
								}}
							>
								<FiX aria-hidden="true" />
							</CloseButton>
						</ToastHeader>

						{notification.actions?.length ? (
							<ActionRow>
								{notification.actions.map((action, index) => (
									<ActionButton
										key={`${notification.id}-action-${index}`}
										type="button"
										data-variant={action.variant ?? 'secondary'}
										onClick={() => {
											action.onClick();
											if (action.autoClose !== false) {
												dismiss(notification.id);
											}
										}}
									>
										{action.label}
									</ActionButton>
								))}
							</ActionRow>
						) : null}

						{notification.duration > 0 ? (
							<ProgressTrack aria-hidden="true">
								<ProgressIndicator $tone={notification.type} $duration={notification.duration} />
							</ProgressTrack>
						) : null}
					</Toast>
				);
			})}
		</ToastStack>
	);
};

const callBridge = <T,>(fn: ((...args: never[]) => T) | undefined, ...args: never[]): T | '' => {
	if (!globalBridge || !fn) {
		warnMissingProvider();
		return '';
	}
	return fn(...args);
};

export const showGlobalNotification = (options: NotificationOptions): string =>
	callBridge(globalBridge?.show, options) as string;

export const showGlobalSuccess = (
	message: string,
	options?: Partial<Omit<NotificationOptions, 'message' | 'type'>>
): string => callBridge(globalBridge?.showSuccess, message, options) as string;

export const showGlobalError = (
	message: string,
	options?: Partial<Omit<NotificationOptions, 'message' | 'type'>>
): string => callBridge(globalBridge?.showError, message, options) as string;

export const showGlobalWarning = (
	message: string,
	options?: Partial<Omit<NotificationOptions, 'message' | 'type'>>
): string => callBridge(globalBridge?.showWarning, message, options) as string;

export const showGlobalInfo = (
	message: string,
	options?: Partial<Omit<NotificationOptions, 'message' | 'type'>>
): string => callBridge(globalBridge?.showInfo, message, options) as string;

export const showGlobalApiError = (error: unknown, fallbackMessage?: string): string =>
	callBridge(globalBridge?.showApiError, error, fallbackMessage) as string;

export const showGlobalSaveSuccess = (resource: string): string =>
	callBridge(globalBridge?.showSaveSuccess, resource) as string;

export const showGlobalRetryableError = (
	message: string,
	onRetry: () => void,
	options?: Partial<Omit<NotificationOptions, 'message' | 'type'>>
): string => callBridge(globalBridge?.showRetryableError, message, onRetry, options) as string;

export const showGlobalNotify = (
	message: string,
	type: NotificationTone = 'info',
	duration?: number
): string => callBridge(globalBridge?.show, { message, type, duration }) as string;
