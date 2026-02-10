/**
 * @file spinner.ts
 * @module types
 * @description TypeScript definitions for common spinner system
 * @version 1.0.0
 */

export type SpinnerTheme = 'blue' | 'green' | 'orange' | 'purple';
export type SpinnerVariant = 'inline' | 'modal' | 'overlay';
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface CommonSpinnerState {
	show: boolean;
	message: string;
	type: SpinnerVariant;
	theme: SpinnerTheme;
	size?: SpinnerSize;
	progress?: number;
	allowDismiss?: boolean;
	startTime?: number;
}

export interface CommonSpinnerConfig {
	message?: string;
	type?: SpinnerVariant;
	theme?: SpinnerTheme;
	size?: SpinnerSize;
	progress?: number;
	allowDismiss?: boolean;
}

export interface SpinnerInstance {
	id: string;
	state: CommonSpinnerState;
	show: (config?: Partial<CommonSpinnerConfig>) => void;
	hide: () => void;
	updateMessage: (message: string) => void;
	updateProgress: (progress: number) => void;
	updateConfig: (config: Partial<CommonSpinnerConfig>) => void;
}

export interface ProductionSpinnerWrapperProps {
	appId: string;
	children: React.ReactNode;
	fallbackMessage?: string;
	customTheme?: SpinnerTheme;
	onSpinnerShow?: (config: CommonSpinnerConfig) => void;
	onSpinnerHide?: () => void;
}

export interface UseProductionSpinnerReturn {
	showSpinner: (message?: string, config?: Partial<CommonSpinnerConfig>) => void;
	hideSpinner: () => void;
	updateMessage: (message: string) => void;
	updateProgress: (progress: number) => void;
	withSpinner: <T>(
		operation: () => Promise<T>,
		message?: string,
		config?: Partial<CommonSpinnerConfig>
	) => Promise<T>;
	spinnerState: CommonSpinnerState;
	isLoading: boolean;
}

export interface CommonSpinnerProps {
	message?: string;
	size?: SpinnerSize;
	theme?: SpinnerTheme;
	variant?: SpinnerVariant;
	showProgress?: boolean;
	progress?: number;
	allowDismiss?: boolean;
	onDismiss?: () => void;
	className?: string;
}
