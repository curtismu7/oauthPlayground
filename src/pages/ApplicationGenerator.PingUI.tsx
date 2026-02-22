/**
 * @file ApplicationGenerator.PingUI.tsx
 * @module pages
 * @description Application Generator page with PingOne UI styling
 * @version 1.0.0
 * @since 2026-02-22
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ConfigCheckerButtons } from '../components/ConfigCheckerButtons';
import { ExportImportPanel } from '../components/ExportImportPanel';
import { PresetSelector } from '../components/PresetSelector';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { FlowHeader } from '../services/flowHeaderService';
import {
	type AppCreationResult,
	type OIDCNativeAppConfig,
	type OIDCWebAppConfig,
	pingOneAppCreationService,
	type ServiceAppConfig,
	type SinglePageAppConfig,
	type WorkerAppConfig,
} from '../services/pingOneAppCreationService';
import {
	type BuilderAppType,
	type FormDataState,
	presetManagerService,
} from '../services/presetManagerService';
import { UnifiedTokenDisplayService } from '../services/unifiedTokenDisplayService';
import V7StepperService, { type StepMetadata } from '../services/v7StepperService';
import { clearAllTokens } from '../utils/tokenCleaner';
import { v4ToastManager } from '../utils/v4ToastMessages';

// MDI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 20, ariaLabel, className = '', style }) => {
	const iconMap: Record<string, string> = {
		arrowLeft: 'mdi-chevron-left',
		chevronLeft: 'mdi-chevron-left',
		chevronRight: 'mdi-chevron-right',
		cloud: 'mdi-cloud',
		code: 'mdi-code-tags',
		globe: 'mdi-earth',
		info: 'mdi-information',
		server: 'mdi-server',
		settings: 'mdi-cog',
		shield: 'mdi-shield',
		smartphone: 'mdi-cellphone',
		rocket: 'mdi-rocket',
		build: 'mdi-hammer-wrench',
		package: 'mdi-package',
		web: 'mdi-web',
		mobile: 'mdi-cellphone',
		desktop: 'mdi-desktop-classic',
		api: 'mdi-api',
		database: 'mdi-database',
		key: 'mdi-key',
		lock: 'mdi-lock',
		refresh: 'mdi-refresh',
		save: 'mdi-content-save',
		download: 'mdi-download',
		upload: 'mdi-upload',
		copy: 'mdi-content-copy',
		share: 'mdi-share',
		help: 'mdi-help-circle',
		warning: 'mdi-alert',
		error: 'mdi-alert-circle',
		success: 'mdi-check-circle',
		close: 'mdi-close',
		menu: 'mdi-menu',
		home: 'mdi-home',
		back: 'mdi-arrow-left',
		next: 'mdi-arrow-right',
		previous: 'mdi-chevron-left',
		play: 'mdi-play',
		pause: 'mdi-pause',
		stop: 'mdi-stop',
		edit: 'mdi-pencil',
		delete: 'mdi-delete',
		add: 'mdi-plus',
		remove: 'mdi-minus',
		expand: 'mdi-chevron-down',
		collapse: 'mdi-chevron-up',
		search: 'mdi-magnify',
		filter: 'mdi-filter',
		sort: 'mdi-sort',
		print: 'mdi-print',
		fullscreen: 'mdi-fullscreen',
		minimize: 'mdi-window-minimize',
		maximize: 'mdi-window-maximize',
	};

	const iconClass = iconMap[icon] || icon;
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<span
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			title={ariaLabel}
			aria-hidden={!ariaLabel}
		/>
	);
};

// Main Component
const ApplicationGeneratorPingUI: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();

	// State management
	const [currentStep, setCurrentStep] = useState(0);
	const [formData, setFormData] = useState<FormDataState>({
		appType: 'spa',
		appName: '',
		description: '',
		domain: '',
		redirectUris: [''],
		scopes: ['openid', 'profile', 'email'],
		environmentId: '',
		clientId: '',
		clientSecret: '',
	});

	const [isGenerating, setIsGenerating] = useState(false);
	const [generationResult, setGenerationResult] = useState<AppCreationResult | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});

	// App type definitions
	const appTypes = [
		{
			id: 'spa',
			name: 'Single Page Application',
			description: 'Modern web application with client-side routing',
			icon: 'web',
			config: 'spa',
		},
		{
			id: 'native',
			name: 'Native Mobile App',
			description: 'iOS or Android mobile application',
			icon: 'smartphone',
			config: 'native',
		},
		{
			id: 'service',
			name: 'Service/Backend',
			description: 'Server-side application or API service',
			icon: 'server',
			config: 'service',
		},
		{
			id: 'worker',
			name: 'Web Worker',
			description: 'Background processing application',
			icon: 'code',
			config: 'worker',
		},
	];

	// Step definitions
	const steps: StepMetadata[] = [
		{
			id: 'app-type',
			title: 'Select Application Type',
			description: 'Choose the type of application you want to create',
			icon: 'settings',
		},
		{
			id: 'basic-config',
			title: 'Basic Configuration',
			description: 'Configure basic application settings',
			icon: 'info',
		},
		{
			id: 'oauth-config',
			title: 'OAuth Configuration',
			description: 'Set up OAuth 2.0/OIDC settings',
			icon: 'shield',
		},
		{
			id: 'generate',
			title: 'Generate Application',
			description: 'Create your PingOne application',
			icon: 'rocket',
		},
	];

	// Handle form field changes
	const handleFieldChange = useCallback((field: keyof FormDataState, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors(prev => {
				const newErrors = { ...prev };
				delete newErrors[field];
				return newErrors;
			});
		}
	}, []);

	// Validate current step
	const validateStep = useCallback((stepIndex: number): boolean => {
		const step = steps[stepIndex];
		switch (step.id) {
			case 'app-type':
				return !!formData.appType;
			case 'basic-config':
				return !!(formData.appName || formData.domain);
			case 'oauth-config':
				return !!(formData.environmentId || formData.clientId);
			case 'generate':
				return true;
			default:
				return true;
		}
	}, [formData, steps]);

	// Navigate to next step
	const handleNext = useCallback(() => {
		if (!validateStep(currentStep)) {
			// Show validation errors
			const step = steps[currentStep];
			v4ToastManager.error(`Please complete the ${step.title} step`);
			return;
		}

		if (currentStep < steps.length - 1) {
			setCurrentStep(prev => prev + 1);
		}
	}, [currentStep, validateStep, steps]);

	// Navigate to previous step
	const handlePrevious = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep(prev => prev - 1);
		}
	}, [currentStep]);

	// Generate application
	const handleGenerate = useCallback(async () => {
		setIsGenerating(true);
		setErrors({});

		try {
			const result = await pingOneAppCreationService.createApplication(formData);
			setGenerationResult(result);
			setCurrentStep(steps.length - 1);
			v4ToastManager.success('Application created successfully!');
		} catch (error) {
			console.error('Failed to create application:', error);
			setErrors({ general: 'Failed to create application. Please try again.' });
			v4ToastManager.error('Failed to create application');
		} finally {
			setIsGenerating(false);
		}
	}, [formData]);

	// Reset form
	const handleReset = useCallback(() => {
		setFormData({
			appType: 'spa',
			appName: '',
			description: '',
			domain: '',
			redirectUris: [''],
			scopes: ['openid', 'profile', 'email'],
			environmentId: '',
			clientId: '',
			clientSecret: '',
		});
		setErrors({});
		setGenerationResult(null);
		setCurrentStep(0);
	}, []);

	// Export configuration
	const handleExport = useCallback(() => {
		try {
			const exportData = {
				...formData,
				timestamp: new Date().toISOString(),
				version: '1.0.0',
			};
			
			const blob = new Blob([JSON.stringify(exportData, null, 2)], {
				type: 'application/json',
			});
			
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${formData.appName || 'app'}-config.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			
			v4ToastManager.success('Configuration exported successfully');
		} catch (error) {
			console.error('Failed to export configuration:', error);
			v4ToastManager.error('Failed to export configuration');
		}
	}, [formData]);

	// Import configuration
	const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const importedData = JSON.parse(e.target?.result as string);
				setFormData(prev => ({
					...prev,
					...importedData,
				}));
				v4ToastManager.success('Configuration imported successfully');
			} catch (error) {
				console.error('Failed to import configuration:', error);
				v4ToastManager.error('Failed to import configuration');
			}
		};
		reader.readAsText(file);
	}, []);

	return (
		<div className="end-user-nano">
			<style>
				{`
					.app-generator-pingui {
						max-width: 1200px;
						margin: 0 auto;
						padding: var(--ping-spacing-lg, 1.5rem);
						font-family: var(--ping-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
					}

					.app-generator-pingui .header {
						background: var(--ping-surface-primary, #ffffff);
						border: 1px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-lg, 0.75rem);
						padding: var(--ping-spacing-xl, 2rem);
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
						box-shadow: var(--ping-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
					}

					.app-generator-pingui .header-content {
						display: flex;
						align-items: center;
						justify-content: space-between;
					}

					.app-generator-pingui .header-title h1 {
						font-size: var(--ping-font-size-2xl, 2rem);
						font-weight: var(--ping-font-weight-bold, 700);
						color: var(--ping-text-primary, #1a1a1a);
						margin: 0;
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-sm, 0.5rem);
					}

					.app-generator-pingui .header-title .icon {
						color: var(--ping-color-primary, #3b82f6);
					}

					.app-generator-pingui .header-actions {
						display: flex;
						gap: var(--ping-spacing-sm, 0.5rem);
					}

					.app-generator-pingui .btn {
						background: var(--ping-color-primary, #3b82f6);
						color: var(--ping-color-white, #ffffff);
						border: none;
						border-radius: var(--ping-radius-md, 0.5rem);
						padding: var(--ping-spacing-sm, 0.75rem) var(--ping-spacing-md, 1rem);
						font-size: var(--ping-font-size-sm, 0.875rem);
						font-weight: var(--ping-font-weight-medium, 500);
						cursor: pointer;
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-xs, 0.25rem);
					}

					.app-generator-pingui .btn:hover:not(:disabled) {
						background: var(--ping-color-primary-dark, #2563eb);
						transform: translateY(-1px);
					}

					.app-generator-pingui .btn:disabled {
						opacity: 0.6;
						cursor: not-allowed;
					}

					.app-generator-pingui .btn-secondary {
						background: var(--ping-surface-secondary, #f8fafc);
						color: var(--ping-text-primary, #1a1a1a);
						border: 1px solid var(--ping-border-light, #e5e7eb);
					}

					.app-generator-pingui .btn-secondary:hover:not(:disabled) {
						background: var(--ping-surface-tertiary, #f1f5f9);
					}

					.app-generator-pingui .stepper {
						display: flex;
						justify-content: space-between;
						margin-bottom: var(--ping-spacing-xl, 2rem);
											position: relative;
					}

					.app-generator-pingui .stepper::after {
						content: '';
						position: absolute;
						top: 50%;
						left: 0;
						right: 0;
						height: 2px;
						background: var(--ping-border-light, #e5e7eb);
						transform: translateY(-50%);
						z-index: 0;
					}

					.app-generator-pingui .step {
						background: var(--ping-surface-primary, #ffffff);
						border: 2px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-lg, 0.75rem);
						padding: var(--ping-spacing-md, 1rem);
						flex: 1;
						text-align: center;
						position: relative;
						z-index: 1;
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
					}

					.app-generator-pingui .step.active {
						border-color: var(--ping-color-primary, #3b82f6);
						background: var(--ping-color-primary-light, #dbeafe);
					}

					.app-generator-pingui .step.completed {
						border-color: var(--ping-color-success, #10b981);
						background: var(--ping-color-success-light, #d1fae5);
					}

					.app-generator-pingui .step-icon {
						font-size: var(--ping-font-size-lg, 1.125rem);
						color: var(--ping-text-secondary, #666);
						margin-bottom: var(--ping-spacing-sm, 0.5rem);
					}

					.app-generator-pingui .step.active .step-icon,
					.app-generator-pingui .step.completed .step-icon {
						color: var(--ping-color-primary, #3b82f6);
					}

					.app-generator-pingui .step.completed .step-icon {
						color: var(--ping-color-success, #10b981);
					}

					.app-generator-pingui .step-title {
						font-size: var(--ping-font-size-sm, 0.875rem);
						font-weight: var(--ping-font-weight-semibold, 600);
						color: var(--ping-text-primary, #1a1a1a);
						margin-bottom: var(--ping-spacing-xs, 0.25rem);
					}

					.app-generator-pingui .step-description {
						font-size: var(--ping-font-size-xs, 0.75rem);
						color: var(--ping-text-secondary, #666);
					}

					.app-generator-pingui .content-area {
						background: var(--ping-surface-primary, #ffffff);
						border: 1px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-lg, 0.75rem);
						padding: var(--ping-spacing-xl, 2rem);
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
						box-shadow: var(--ping-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
					}

					.app-generator-pingui .form-group {
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
					}

					.app-generator-pingui .form-group label {
						display: block;
						font-size: var(--ping-font-size-sm, 0.875rem);
						font-weight: var(--ping-font-weight-medium, 500);
						color: var(--ping-text-primary, #1a1a1a);
						margin-bottom: var(--ping-spacing-xs, 0.25rem);
					}

					.app-generator-pingui .form-group input,
					.app-generator-pingui .form-group select,
					.app-generator-pingui .form-group textarea {
						width: 100%;
						padding: var(--ping-spacing-sm, 0.75rem) var(--ping-spacing-md, 1rem);
						border: 1px solid var(--ping-border-primary, #d1d5db);
						border-radius: var(--ping-radius-md, 0.5rem);
						font-size: var(--ping-font-size-base, 1rem);
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
					}

					.app-generator-pingui .form-group input:focus,
					.app-generator-pingui .form-group select:focus,
					.app-generator-pingui .form-group textarea:focus {
						outline: none;
						border-color: var(--ping-color-primary, #3b82f6);
						box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
					}

					.app-generator-pingui .form-group input.error,
					.app-generator-pingui .form-group select.error,
					.app-generator-pingui .form-group textarea.error {
						border-color: var(--ping-color-error, #ef4444);
					}

					.app-generator-pingui .error-message {
						color: var(--ping-color-error, #ef4444);
						font-size: var(--ping-font-size-sm, 0.875rem);
						margin-top: var(--ping-spacing-xs, 0.25rem);
					}

					.app-generator-pingui .app-type-selector {
						display: grid;
						grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
						gap: var(--ping-spacing-lg, 1.5rem);
					}

					.app-generator-pingui .app-type-card {
						background: var(--ping-surface-secondary, #f8fafc);
						border: 2px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-lg, 0.75rem);
						padding: var(--ping-spacing-lg, 1.5rem);
						cursor: pointer;
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
					}

					.app-generator-pingui .app-type-card:hover {
						border-color: var(--ping-color-primary, #3b82f6);
						background: var(--ping-color-primary-light, #dbeafe);
						transform: translateY(-2px);
					}

					.app-generator-pingui .app-type-card.selected {
						border-color: var(--ping-color-primary, #3b82f6);
						background: var(--ping-color-primary-light, #dbeafe);
					}

					.app-generator-pingui .app-type-icon {
						font-size: var(--ping-font-size-3xl, 2.5rem);
						color: var(--ping-color-primary, #3b82f6);
						margin-bottom: var(--ping-spacing-md, 1rem);
					}

					.app-generator-pingui .app-type-title {
						font-size: var(--ping-font-size-lg, 1.125rem);
						font-weight: var(--ping-font-weight-semibold, 600);
						color: var(--ping-text-primary, #1a1a1a);
						margin-bottom: var(--ping-spacing-sm, 0.5rem);
					}

					.app-generator-pingui .app-type-description {
						font-size: var(--ping-font-size-sm, 0.875rem);
						color: var(--ping-text-secondary, #666);
						line-height: 1.5;
					}

					.app-generator-pingui .navigation {
						display: flex;
						justify-content: space-between;
						align-items: center;
						margin-top: var(--ping-spacing-xl, 2rem);
						padding-top: var(--ping-spacing-lg, 1.5rem);
						border-top: 1px solid var(--ping-border-light, #e5e7eb);
					}

					.app-generator-pingui .result-display {
						background: var(--ping-surface-primary, #ffffff);
						border: 1px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-lg, 0.75rem);
						padding: var(--ping-spacing-xl, 2rem);
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
						box-shadow: var(--ping-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
					}

					.app-generator-pingui .result-header {
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-sm, 0.5rem);
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
					}

					.app-generator-pingui .result-title {
						font-size: var(--ping-font-size-xl, 1.25rem);
						font-weight: var(--ping-font-weight-semibold, 600);
						color: var(--ping-text-primary, #1a1a1a);
					}

					.app-generator-pingui .result-icon {
						color: var(--ping-color-success, #10b981);
					}

					.app-generator-pingui .result-content {
						background: var(--ping-surface-secondary, #f8fafc);
						border: 1px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-md, 0.5rem);
						padding: var(--ping-spacing-md, 1rem);
						font-family: var(--ping-font-mono, 'Courier New', monospace);
						font-size: var(--ping-font-size-sm, 0.875rem);
					}

					.app-generator-pingui .result-item {
						display: flex;
						justify-content: space-between;
						padding: var(--ping-spacing-xs, 0.25rem) 0;
						border-bottom: 1px solid var(--ping-border-light, #e5e7eb);
					}

					.app-generator-pingui .result-item:last-child {
						border-bottom: none;
					}

					.app-generator-pingui .result-label {
						color: var(--ping-text-secondary, #666);
					}

					.app-generator-pingui .result-value {
						color: var(--ping-text-primary, #1a1a1a);
						font-weight: var(--ping-font-weight-medium, 500);
					}

					@media (max-width: 768px) {
						.app-generator-pingui {
							padding: var(--ping-spacing-md, 1rem);
						}

						.app-generator-pingui .header-content {
							flex-direction: column;
							text-align: center;
							gap: var(--ping-spacing-md, 1rem);
						}

						.app-generator-pingui .stepper {
							flex-direction: column;
							gap: var(--ping-spacing-md, 1rem);
						}

						.app-generator-pingui .stepper::after {
							display: none;
						}

						.app-generator-pingui .step {
							margin-bottom: var(--ping-spacing-md, 1rem);
						}

						.app-generator-pingui .app-type-selector {
							grid-template-columns: 1fr;
						}

						.app-generator-pingui .navigation {
							flex-direction: column;
							gap: var(--ping-spacing-md, 1rem);
						}
					}
				`}
			</style>

			<div className="app-generator-pingui">
				{/* Header */}
				<div className="header">
					<div className="header-content">
						<div className="header-title">
							<MDIIcon icon="rocket" size={24} className="icon" />
							Application Generator
						</div>
						<div className="header-actions">
							<button
								type="button"
								className="btn btn-secondary"
								onClick={handleExport}
								disabled={!formData.appName}
							>
								<MDIIcon icon="download" size={14} />
								Export
							</button>
							<button
								type="button"
								className="btn btn-secondary"
								onClick={() => document.getElementById('import-file')?.click()}
							>
								<MDIIcon icon="upload" size={14} />
								Import
							</button>
							<input
								id="import-file"
								type="file"
								accept=".json"
								onChange={handleImport}
								style={{ display: 'none' }}
							/>
							<button
								type="button"
								className="btn"
								onClick={handleReset}
							>
								<MDIIcon icon="refresh" size={14} />
								Reset
							</button>
						</div>
					</div>
				</div>

				{/* Stepper */}
				<div className="stepper">
					{steps.map((step, index) => (
						<div
							key={step.id}
							className={`step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
						>
							<div className="step-icon">
								<MDIIcon icon={step.icon} />
							</div>
							<div className="step-title">{step.title}</div>
							<div className="step-description">{step.description}</div>
						</div>
					))}
				</div>

				{/* Content Area */}
				<div className="content-area">
					{currentStep === 0 && (
						/* App Type Selection */
						<div className="app-type-selector">
							{appTypes.map((appType) => (
								<div
									key={appType.id}
									className={`app-type-card ${formData.appType === appType.id ? 'selected' : ''}`}
									onClick={() => handleFieldChange('appType', appType.id)}
								>
									<div className="app-type-icon">
										<MDIIcon icon={appType.icon} />
									</div>
									<div className="app-type-title">{appType.name}</div>
									<div className="app-type-description">{appType.description}</div>
								</div>
							))}
						</div>
					)}

					{currentStep === 1 && (
						/* Basic Configuration */
						<>
							<div className="form-group">
								<label htmlFor="appName">Application Name</label>
								<input
									id="appName"
									type="text"
									value={formData.appName}
									onChange={(e) => handleFieldChange('appName', e.target.value)}
									placeholder="Enter application name"
									className={errors.appName ? 'error' : ''}
								/>
								{errors.appName && (
									<div className="error-message">{errors.appName}</div>
								)}
							</div>
							<div className="form-group">
								<label htmlFor="description">Description</label>
								<textarea
									id="description"
									value={formData.description}
									onChange={(e) => handleFieldChange('description', e.target.value)}
									placeholder="Enter application description"
									rows={3}
								/>
							</div>
							<div className="form-group">
								<label htmlFor="domain">Domain</label>
								<input
									id="domain"
									type="url"
									value={formData.domain}
									onChange={(e) => handleFieldChange('domain', e.target.value)}
									placeholder="https://your-domain.com"
									className={errors.domain ? 'error' : ''}
								/>
								{errors.domain && (
									<div className="error-message">{errors.domain}</div>
								)}
							</div>
						</>
					)}

					{currentStep === 2 && (
						/* OAuth Configuration */
						<>
							<div className="form-group">
								<label htmlFor="environmentId">Environment ID</label>
								<input
									id="environmentId"
									type="text"
									value={formData.environmentId}
									onChange={(e) => handleFieldChange('environmentId', e.target.value)}
									placeholder="Enter PingOne Environment ID"
									className={errors.environmentId ? 'error' : ''}
								/>
								{errors.environmentId && (
									<div className="error-message">{errors.environmentId}</div>
								)}
							</div>
							<div className="form-group">
								<label htmlFor="clientId">Client ID</label>
								<input
									id="clientId"
									type="text"
									value={formData.clientId}
									onChange={(e) => handleFieldChange('clientId', e.target.value)}
									placeholder="Enter Client ID"
									className={errors.clientId ? 'error' : ''}
								/>
								{errors.clientId && (
									<div className="error-message">{errors.clientId}</div>
								)}
							</div>
							<div className="form-group">
								<label htmlFor="clientSecret">Client Secret</label>
								<input
									id="clientSecret"
									type="password"
									value={formData.clientSecret}
									onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
									placeholder="Enter Client Secret"
								/>
							</div>
						</>
					)}

					{currentStep === 3 && (
						/* Generate Application */
						<div style={{ textAlign: 'center', padding: '3rem' }}>
							<MDIIcon icon="rocket" size={64} style={{ color: 'var(--ping-color-primary, #3b82f6)' }} />
							<h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--ping-text-primary, #1a1a1a)' }}>
								Ready to Generate
							</h2>
							<p style={{ color: 'var(--ping-text-secondary, #666)', marginBottom: '2rem' }}>
								Review your configuration and click generate to create your PingOne application.
							</p>
							<button
								type="button"
								className="btn"
								onClick={handleGenerate}
								disabled={isGenerating}
							>
								{isGenerating ? (
									<>
										<MDIIcon icon="refresh" size={14} style={{ animation: 'spin 1s linear infinite' }} />
										Generating...
									</>
								) : (
									<>
										<MDIIcon icon="rocket" size={14} />
										Generate Application
									</>
								)}
							</button>
						</div>
					)}

					{currentStep === 4 && generationResult && (
						/* Results Display */
						<div className="result-display">
							<div className="result-header">
								<MDIIcon icon="success" size={24} className="result-icon" />
								<div className="result-title">Application Created Successfully!</div>
							</div>
							<div className="result-content">
								<div className="result-item">
									<span className="result-label">Application ID:</span>
									<span className="result-value">{generationResult.applicationId}</span>
								</div>
								<div className="result-item">
									<span className="result-label">Client ID:</span>
									<span className="result-value">{generationResult.clientId}</span>
								</div>
								<div className="result-item">
									<span className="result-label">Environment ID:</span>
									<span className="result-value">{generationResult.environmentId}</span>
								</div>
								{generationResult.redirectUris && (
									<div className="result-item">
										<span className="result-label">Redirect URIs:</span>
										<span className="result-value">{generationResult.redirectUris.join(', ')}</span>
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Navigation */}
				<div className="navigation">
					<button
						type="button"
						className="btn btn-secondary"
						onClick={handlePrevious}
						disabled={currentStep === 0}
					>
						<MDIIcon icon="chevronLeft" size={14} />
						Previous
					</button>
					<button
						type="button"
						className="btn"
						onClick={currentStep === steps.length - 1 ? handleGenerate : handleNext}
						disabled={!validateStep(currentStep) || (currentStep === steps.length - 1 && isGenerating)}
					>
						{currentStep === steps.length - 1 ? (
							<>
								<MDIIcon icon="rocket" size={14} />
								Generate
							</>
						) : (
							<>
								Next
								<MDIIcon icon="chevronRight" size={14} />
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ApplicationGeneratorPingUI;
