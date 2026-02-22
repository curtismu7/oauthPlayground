/**
 * @file MFADocumentationModalV8.PingUI.tsx
 * @module v8/components
 * @description Ping UI migration of Modal for selecting and downloading MFA documentation
 * @version 8.0.0-PingUI
 *
 * Ping UI migration following pingui2.md standards:
 * - Added .end-user-nano namespace wrapper
 * - Replaced React Icons with MDI CSS icons
 * - Applied Ping UI CSS variables and transitions
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions
 *
 * Allows users to select specific use cases (registration, authentication, or device-specific)
 * and download documentation as PDF or Markdown.
 */

import React, { useState } from 'react';
import type { DeviceType } from '../flows/shared/MFATypes';
import {
	downloadAsMarkdown,
	downloadAsPDF,
	generateMarkdown,
	getApiCalls,
} from './MFADocumentationPageV8';

// MDI Icon Mapping for React Icons → MDI CSS
const getMDIIconClass = (fiIcon: string): string => {
	const iconMap: Record<string, string> = {
		FiBook: 'mdi-book',
		FiDownload: 'mdi-download',
		FiFileText: 'mdi-file-text',
		FiX: 'mdi-close',
	};
	return iconMap[fiIcon] || 'mdi-help-circle';
};

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
}> = ({ icon, size = 16, ariaLabel, ariaHidden = false, className = '' }) => {
	const iconClass = getMDIIconClass(icon);
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<i
			className={combinedClassName}
			style={{ fontSize: `${size}px` }}
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
		></i>
	);
};

interface UseCase {
	id: string;
	deviceType: DeviceType;
	flowType: 'registration' | 'authentication';
	title: string;
	description: string;
}

interface MFADocumentationModalV8PingUIProps {
	isOpen: boolean;
	onClose: () => void;
}

const DEVICE_TYPES: DeviceType[] = ['SMS', 'EMAIL', 'TOTP', 'FIDO2', 'WHATSAPP', 'VOICE', 'MOBILE'];

const USE_CASES: UseCase[] = [
	// Registration use cases
	...DEVICE_TYPES.map((deviceType) => {
		const educationalLabel = deviceType === 'TOTP' ? 'OATH TOTP (RFC 6238)' : deviceType;
		return {
			id: `register-${deviceType.toLowerCase()}`,
			deviceType,
			flowType: 'registration' as const,
			title: `${educationalLabel} Device Registration`,
			description: `Complete flow for registering a new ${educationalLabel} device, including device creation, activation, and QR code setup (if applicable).`,
		};
	}),
	// Authentication use cases
	...DEVICE_TYPES.map((deviceType) => {
		const educationalLabel = deviceType === 'TOTP' ? 'OATH TOTP (RFC 6238)' : deviceType;
		return {
			id: `auth-${deviceType.toLowerCase()}`,
			deviceType,
			flowType: 'authentication' as const,
			title: `${educationalLabel} Device Authentication`,
			description: `Complete flow for authenticating with an existing ${educationalLabel} device, including device selection, OTP validation, and authentication completion.`,
		};
	}),
];

export const MFADocumentationModalV8PingUI: React.FC<MFADocumentationModalV8PingUIProps> = ({
	isOpen,
	onClose,
}) => {
	const [selectedCategory, setSelectedCategory] = useState<
		'all' | 'registration' | 'authentication' | 'specific'
	>('all');
	const [selectedUseCases, setSelectedUseCases] = useState<Set<string>>(new Set());
	const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'md'>('md');

	if (!isOpen) return null;

	const handleCategoryChange = (category: typeof selectedCategory) => {
		setSelectedCategory(category);
		if (category === 'all') {
			setSelectedUseCases(new Set(USE_CASES.map((uc) => uc.id)));
		} else if (category === 'registration') {
			setSelectedUseCases(
				new Set(USE_CASES.filter((uc) => uc.flowType === 'registration').map((uc) => uc.id))
			);
		} else if (category === 'authentication') {
			setSelectedUseCases(
				new Set(USE_CASES.filter((uc) => uc.flowType === 'authentication').map((uc) => uc.id))
			);
		} else {
			setSelectedUseCases(new Set());
		}
	};

	const handleUseCaseToggle = (useCaseId: string) => {
		const newSelection = new Set(selectedUseCases);
		if (newSelection.has(useCaseId)) {
			newSelection.delete(useCaseId);
		} else {
			newSelection.add(useCaseId);
		}
		setSelectedUseCases(newSelection);
		setSelectedCategory('specific');
	};

	const handleDownload = async () => {
		if (selectedUseCases.size === 0) {
			console.warn('Please select at least one use case to download.');
			return;
		}

		const selectedCases = USE_CASES.filter((uc) => selectedUseCases.has(uc.id));

		try {
			if (downloadFormat === 'md') {
				await downloadMarkdown(selectedCases);
			} else {
				await downloadPDF(selectedCases);
			}
		} catch (error) {
			console.error('Failed to download documentation:', error);
			console.warn('Failed to download documentation. Please try again.');
		}
	};

	const downloadMarkdown = async (useCases: UseCase[]) => {
		let markdown = '# MFA Device Documentation\n\n';
		markdown += `**Generated:** ${new Date().toLocaleString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			timeZoneName: 'short',
		})}\n\n`;
		markdown += `## Overview\n\n`;
		markdown += `This document contains comprehensive API documentation for ${useCases.length} selected MFA use case${useCases.length !== 1 ? 's' : ''}.\n\n`;

		// Generate documentation for each use case
		for (const useCase of useCases) {
			const apiCalls = getApiCalls(useCase.deviceType, useCase.flowType);
			const useCaseMarkdown = generateMarkdown(
				useCase.deviceType,
				useCase.flowType,
				apiCalls,
				useCase.flowType === 'registration' ? 'admin' : undefined,
				useCase.flowType === 'registration' ? 'ACTIVATION_REQUIRED' : undefined
			);
			markdown += `\n\n---\n\n`;
			markdown += useCaseMarkdown;
		}

		// Download the markdown file
		const filename = `mfa-documentation-${new Date().toISOString().split('T')[0]}.md`;
		downloadAsMarkdown(markdown, filename);
	};

	const downloadPDF = async (useCases: UseCase[]) => {
		// Generate markdown for all use cases
		let combinedMarkdown = '# MFA Device Documentation\n\n';
		combinedMarkdown += `**Generated:** ${new Date().toLocaleString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			timeZoneName: 'short',
		})}\n\n`;
		combinedMarkdown += `## Overview\n\n`;
		combinedMarkdown += `This document contains comprehensive API documentation for ${useCases.length} selected MFA use case${useCases.length !== 1 ? 's' : ''}.\n\n`;

		// Generate documentation for each use case
		for (const useCase of useCases) {
			const apiCalls = getApiCalls(useCase.deviceType, useCase.flowType);
			const useCaseMarkdown = generateMarkdown(
				useCase.deviceType,
				useCase.flowType,
				apiCalls,
				useCase.flowType === 'registration' ? 'admin' : undefined,
				useCase.flowType === 'registration' ? 'ACTIVATION_REQUIRED' : undefined
			);
			combinedMarkdown += `\n\n---\n\n`;
			combinedMarkdown += useCaseMarkdown;
		}

		// Use the PDF download function from MFADocumentationPageV8
		const title = `Ping Identity - MFA Device Documentation (${useCases.length} use case${useCases.length !== 1 ? 's' : ''})`;
		downloadAsPDF(combinedMarkdown, title);
	};

	// PING UI MIGRATION: Added .end-user-nano wrapper as required by pingui2.md
	return (
		<div className="end-user-nano">
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="mfa-doc-modal-title"
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0, 0, 0, 0.5)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 10000,
				}}
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						onClose();
					}
				}}
			>
				<div
					role="button"
					tabIndex={0}
					style={{
						background: 'var(--ping-secondary-color, #f8f9fa)',
						borderRadius: 'var(--ping-border-radius-lg, 0.5rem)',
						padding: 'var(--ping-spacing-xl, 2rem)',
						maxWidth: '800px',
						maxHeight: '90vh',
						overflow: 'auto',
						boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
						width: '90%',
					}}
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: 'var(--ping-spacing-xl, 2rem)',
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 'var(--ping-spacing-sm, 0.5rem)',
							}}
						>
							{/* PING UI MIGRATION: Replaced FiBook with MDI icon */}
							<MDIIcon icon="FiBook" size={24} ariaLabel="Documentation" />
							<h2
								style={{
									margin: 0,
									fontSize: '24px',
									fontWeight: '700',
									color: 'var(--ping-text-color, #1a1a1a)',
								}}
							>
								Download MFA Documentation
							</h2>
						</div>
						<button
							type="button"
							onClick={onClose}
							style={{
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								padding: 'var(--ping-spacing-sm, 0.5rem)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
							}}
							aria-label="Close modal"
						>
							{/* PING UI MIGRATION: Replaced FiX with MDI icon */}
							<MDIIcon icon="FiX" size={24} ariaLabel="Close" />
						</button>
					</div>

					{/* Category Selection */}
					<div style={{ marginBottom: 'var(--ping-spacing-xl, 2rem)' }}>
						<label
							style={{
								display: 'block',
								fontSize: '14px',
								fontWeight: '600',
								color: 'var(--ping-text-color, #1a1a1a)',
								marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
							}}
							htmlFor="selectcategory"
						>
							Select Category
						</label>
						<div
							style={{ display: 'flex', gap: 'var(--ping-spacing-sm, 0.5rem)', flexWrap: 'wrap' }}
						>
							{[
								{ value: 'all', label: 'All Use Cases' },
								{ value: 'registration', label: 'Registration Only' },
								{ value: 'authentication', label: 'Authentication Only' },
								{ value: 'specific', label: 'Select Specific Use Cases' },
							].map((option) => (
								<button
									key={option.value}
									type="button"
									onClick={() => handleCategoryChange(option.value as typeof selectedCategory)}
									style={{
										padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem)',
										border: `2px solid ${selectedCategory === option.value ? 'var(--ping-primary-color, #0066cc)' : 'var(--ping-border-color, #dee2e6)'}`,
										borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
										background:
											selectedCategory === option.value
												? 'var(--ping-hover-color, #f1f3f4)'
												: 'var(--ping-secondary-color, #f8f9fa)',
										color:
											selectedCategory === option.value
												? 'var(--ping-primary-color, #0066cc)'
												: 'var(--ping-text-color, #1a1a1a)',
										fontSize: '14px',
										fontWeight: selectedCategory === option.value ? '600' : '500',
										cursor: 'pointer',
										transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
									}}
								>
									{option.label}
								</button>
							))}
						</div>
					</div>

					{/* Use Case Selection */}
					{selectedCategory === 'specific' && (
						<div style={{ marginBottom: 'var(--ping-spacing-xl, 2rem)' }}>
							<label
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: '600',
									color: 'var(--ping-text-color, #1a1a1a)',
									marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
								}}
								htmlFor="selectusecasesselectedusecasessizeselected"
							>
								Select Use Cases ({selectedUseCases.size} selected)
							</label>
							<div
								style={{
									maxHeight: '300px',
									overflowY: 'auto',
									border: `1px solid var(--ping-border-color, #dee2e6)`,
									borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
									padding: 'var(--ping-spacing-sm, 0.5rem)',
								}}
							>
								{USE_CASES.map((useCase) => (
									<label
										key={useCase.id}
										style={{
											display: 'flex',
											alignItems: 'flex-start',
											gap: 'var(--ping-spacing-sm, 0.5rem)',
											padding: 'var(--ping-spacing-sm, 0.5rem)',
											borderRadius: 'var(--ping-border-radius-sm, 0.25rem)',
											cursor: 'pointer',
											background: selectedUseCases.has(useCase.id)
												? 'var(--ping-hover-color, #f1f3f4)'
												: 'transparent',
											transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
										}}
									>
										<input
											type="checkbox"
											checked={selectedUseCases.has(useCase.id)}
											onChange={() => handleUseCaseToggle(useCase.id)}
											style={{
												marginTop: 'var(--ping-spacing-xs, 0.25rem)',
												cursor: 'pointer',
												width: '18px',
												height: '18px',
											}}
										/>
										<div style={{ flex: 1 }}>
											<div
												style={{
													fontSize: '15px',
													fontWeight: '600',
													color: 'var(--ping-text-color, #1a1a1a)',
													marginBottom: 'var(--ping-spacing-xs, 0.25rem)',
												}}
											>
												{useCase.title}
											</div>
											<div
												style={{
													fontSize: '13px',
													color: 'var(--ping-text-color, #1a1a1a)',
													lineHeight: '1.5',
												}}
											>
												{useCase.description}
											</div>
											<div
												style={{
													fontSize: '12px',
													color: 'var(--ping-text-color, #1a1a1a)',
													marginTop: 'var(--ping-spacing-xs, 0.25rem)',
												}}
											>
												{useCase.deviceType} •{' '}
												{useCase.flowType === 'registration' ? 'Registration' : 'Authentication'}
											</div>
										</div>
									</label>
								))}
							</div>
						</div>
					)}

					{/* Download Format Selection */}
					<div style={{ marginBottom: 'var(--ping-spacing-xl, 2rem)' }}>
						<label
							style={{
								display: 'block',
								fontSize: '14px',
								fontWeight: '600',
								color: 'var(--ping-text-color, #1a1a1a)',
								marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
							}}
							htmlFor="downloadformat"
						>
							Download Format
						</label>
						<div style={{ display: 'flex', gap: 'var(--ping-spacing-sm, 0.5rem)' }}>
							{[
								{ value: 'md', label: 'Markdown (.md)', icon: 'FiFileText' },
								{ value: 'pdf', label: 'PDF (.pdf)', icon: 'FiDownload' },
							].map((option) => (
								<button
									key={option.value}
									type="button"
									onClick={() => setDownloadFormat(option.value as 'pdf' | 'md')}
									style={{
										flex: 1,
										padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem)',
										border: `2px solid ${downloadFormat === option.value ? 'var(--ping-primary-color, #0066cc)' : 'var(--ping-border-color, #dee2e6)'}`,
										borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
										background:
											downloadFormat === option.value
												? 'var(--ping-hover-color, #f1f3f4)'
												: 'var(--ping-secondary-color, #f8f9fa)',
										color:
											downloadFormat === option.value
												? 'var(--ping-primary-color, #0066cc)'
												: 'var(--ping-text-color, #1a1a1a)',
										fontSize: '14px',
										fontWeight: downloadFormat === option.value ? '600' : '500',
										cursor: 'pointer',
										transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: 'var(--ping-spacing-xs, 0.25rem)',
									}}
								>
									{/* PING UI MIGRATION: Replaced React Icons with MDI icons */}
									<MDIIcon icon={option.icon} size={18} ariaLabel={`${option.label} format`} />
									{option.label}
								</button>
							))}
						</div>
					</div>

					{/* Action Buttons */}
					<div
						style={{
							display: 'flex',
							gap: 'var(--ping-spacing-sm, 0.5rem)',
							justifyContent: 'flex-end',
						}}
					>
						<button
							type="button"
							onClick={onClose}
							style={{
								padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-lg, 1.5rem)',
								border: `1px solid var(--ping-border-color, #dee2e6)`,
								borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
								background: 'var(--ping-secondary-color, #f8f9fa)',
								color: 'var(--ping-text-color, #1a1a1a)',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
								transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
							}}
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleDownload}
							disabled={selectedUseCases.size === 0}
							style={{
								padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-lg, 1.5rem)',
								border: 'none',
								borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
								background:
									selectedUseCases.size === 0
										? 'var(--ping-border-color, #dee2e6)'
										: 'var(--ping-primary-color, #0066cc)',
								color: 'white',
								fontSize: '14px',
								fontWeight: '600',
								cursor: selectedUseCases.size === 0 ? 'not-allowed' : 'pointer',
								transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
								display: 'flex',
								alignItems: 'center',
								gap: 'var(--ping-spacing-xs, 0.25rem)',
							}}
						>
							{/* PING UI MIGRATION: Replaced FiDownload with MDI icon */}
							<MDIIcon icon="FiDownload" size={18} ariaLabel="Download" />
							Download ({selectedUseCases.size} use case{selectedUseCases.size !== 1 ? 's' : ''})
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MFADocumentationModalV8PingUI;
