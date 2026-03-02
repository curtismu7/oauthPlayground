// src/services/v9/v9FlowUIService.tsx
// V9 Wrapper for FlowUIService - Modern Messaging Compliant

import { FlowUIService } from '../flowUIService';
import { V9FlowCredentialService } from './core/V9FlowCredentialService';
// Import Modern Messaging (V8) - established migration pattern
import { ToastNotificationsV8 as toastV8 } from '../../v8/utils/toastNotificationsV8';

// V9 Wrapper Service - wraps original with Modern Messaging
const V9FlowUIService = {
	// Wrapper for getFlowUIComponents with V9 error handling
	getFlowUIComponents() {
		try {
			const components = FlowUIService.getFlowUIComponents();
			return components;
		} catch (error) {
			toastV8.error('Failed to load flow UI components');
			console.error('FlowUI components error:', error);
			// Return minimal fallback components
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
			} as ReturnType<typeof FlowUIService.getFlowUIComponents>;
		}
	},

	// Add V9-specific logging for component usage
	logComponentUsage(componentName: string) {
		console.log(`[V9 FlowUI] Using component: ${componentName}`);
	},
};

export default V9FlowUIService;
