// src/services/v9/v9FlowUIService.tsx
// V9 Wrapper for FlowUIService - Modern Messaging Compliant

import React from 'react';
// Import Modern Messaging (V9) - proper migration to non-toast messaging
import { modernMessaging } from '../../components/v9/V9ModernMessagingComponents';
import { logger } from '../../utils/logger';
import { FlowUIService } from '../flowUIService';

// V9 Wrapper Service - wraps original with Modern Messaging
const V9FlowUIService = {
	// Wrapper for getFlowUIComponents with V9 error handling
	getFlowUIComponents(): ReturnType<typeof FlowUIService.getFlowUIComponents> {
		try {
			const components = FlowUIService.getFlowUIComponents();
			return components;
		} catch (_error) {
			modernMessaging.showCriticalError({
				title: 'UI Components Failed',
				message: 'Failed to load flow UI components',
				contactSupport: false,
			});
			// Return minimal fallback components with proper typing
			return {
				Container: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
				ContentWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
				MainCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
				StepHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
				StepHeaderLeft: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
				StepHeaderRight: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
				VersionBadge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
				StepHeaderTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
				StepHeaderSubtitle: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
				StepNumber: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
				StepTotal: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
				StepContentWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
				CollapsibleSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
				CollapsibleHeaderButton: ({ children }: { children: React.ReactNode }) => (
					<button type="button">{children}</button>
				),
				// Add minimal fallbacks for other expected components
				InfoBox: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
				ParameterGrid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
				ParameterLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
				ParameterValue: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
				ActionRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
				Button: ({ children }: { children: React.ReactNode }) => (
					<button type="button">{children}</button>
				),
				Textarea: ({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
					<textarea {...props} />
				),
				Select: ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
					<select {...props}>{children}</select>
				),
				Input: ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
				Label: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
					<span {...props}>{children}</span>
				),
			} as unknown as ReturnType<typeof FlowUIService.getFlowUIComponents>;
		}
	},

	// Add V9-specific logging for component usage
	logComponentUsage(componentName: string) {
		logger.debug('V9FlowUIService', `[V9 FlowUI] Using component: ${componentName}`);
	},
};

export default V9FlowUIService;
