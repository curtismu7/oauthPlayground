/**
 * @file MFADocumentationModalV8.tsx
 * @module v8/components
 * @description Modal for selecting and downloading MFA documentation
 * @version 8.0.0
 *
 * Allows users to select specific use cases (registration, authentication, or device-specific)
 * and download documentation as PDF or Markdown.
 */

import React, { useState } from 'react';
import { FiBook, FiDownload, FiFileText, FiX } from 'react-icons/fi';
import type { DeviceType } from '../flows/shared/MFATypes';
import {
	downloadAsMarkdown,
	downloadAsPDF,
	generateMarkdown,
	getApiCalls,
} from './MFADocumentationPageV8';

interface UseCase {
	id: string;
	deviceType: DeviceType;
	flowType: 'registration' | 'authentication';
	title: string;
	description: string;
}

interface MFADocumentationModalV8Props {
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

export const MFADocumentationModalV8: React.FC<MFADocumentationModalV8Props> = ({
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
			console.error('Failed to download documentation. Please try again.');
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

	return (
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
				role="dialog"
				aria-modal="true"
				aria-labelledby="mfa-documentation-title"
				style={{
					background: 'white',
					borderRadius: '12px',
					padding: '24px',
					maxWidth: '800px',
					maxHeight: '90vh',
					overflow: 'auto',
					boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
					width: '90%',
				}}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => {
					// Prevent keyboard events from bubbling to backdrop
					e.stopPropagation();
				}}
			>
				{/* Header */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '24px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<FiBook size={24} color="#fbbf24" />
						<h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
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
							padding: '8px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<FiX size={24} color="#6b7280" />
					</button>
				</div>

				{/* Category Selection */}
				<div style={{ marginBottom: '24px' }}>
					<label
						style={{
							display: 'block',
							fontSize: '14px',
							fontWeight: '600',
							color: '#374151',
							marginBottom: '12px',
						}}
						htmlFor="selectcategory"
					>
						Select Category
					</label>
					<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
									padding: '10px 16px',
									border: `2px solid ${selectedCategory === option.value ? '#3b82f6' : '#d1d5db'}`,
									borderRadius: '8px',
									background: selectedCategory === option.value ? '#eff6ff' : 'white',
									color: selectedCategory === option.value ? '#3b82f6' : '#374151',
									fontSize: '14px',
									fontWeight: selectedCategory === option.value ? '600' : '500',
									cursor: 'pointer',
									transition: 'all 0.2s ease',
								}}
							>
								{option.label}
							</button>
						))}
					</div>
				</div>

				{/* Use Case Selection */}
				{selectedCategory === 'specific' && (
					<div style={{ marginBottom: '24px' }}>
						<label
							style={{
								display: 'block',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
								marginBottom: '12px',
							}}
							htmlFor="selectusecasesselectedusecasessizeselected"
						>
							Select Use Cases ({selectedUseCases.size} selected)
						</label>
						<div
							style={{
								maxHeight: '300px',
								overflowY: 'auto',
								border: '1px solid #e5e7eb',
								borderRadius: '8px',
								padding: '12px',
							}}
						>
							{USE_CASES.map((useCase) => (
								<label
									key={useCase.id}
									style={{
										display: 'flex',
										alignItems: 'flex-start',
										gap: '12px',
										padding: '12px',
										borderRadius: '6px',
										cursor: 'pointer',
										background: selectedUseCases.has(useCase.id) ? '#f0f9ff' : 'transparent',
										transition: 'background 0.2s ease',
									}}
								>
									<input
										type="checkbox"
										checked={selectedUseCases.has(useCase.id)}
										onChange={() => handleUseCaseToggle(useCase.id)}
										style={{
											marginTop: '4px',
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
												color: '#1f2937',
												marginBottom: '4px',
											}}
										>
											{useCase.title}
										</div>
										<div
											style={{
												fontSize: '13px',
												color: '#6b7280',
												lineHeight: '1.5',
											}}
										>
											{useCase.description}
										</div>
										<div
											style={{
												fontSize: '12px',
												color: '#9ca3af',
												marginTop: '4px',
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
				<div style={{ marginBottom: '24px' }}>
					<label
						style={{
							display: 'block',
							fontSize: '14px',
							fontWeight: '600',
							color: '#374151',
							marginBottom: '12px',
						}}
						htmlFor="downloadformat"
					>
						Download Format
					</label>
					<div style={{ display: 'flex', gap: '12px' }}>
						{[
							{ value: 'md', label: 'Markdown (.md)', icon: FiFileText },
							{ value: 'pdf', label: 'PDF (.pdf)', icon: FiDownload },
						].map((option) => {
							const Icon = option.icon;
							return (
								<button
									key={option.value}
									type="button"
									onClick={() => setDownloadFormat(option.value as 'pdf' | 'md')}
									style={{
										flex: 1,
										padding: '12px 16px',
										border: `2px solid ${downloadFormat === option.value ? '#3b82f6' : '#d1d5db'}`,
										borderRadius: '8px',
										background: downloadFormat === option.value ? '#eff6ff' : 'white',
										color: downloadFormat === option.value ? '#3b82f6' : '#374151',
										fontSize: '14px',
										fontWeight: downloadFormat === option.value ? '600' : '500',
										cursor: 'pointer',
										transition: 'all 0.2s ease',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '8px',
									}}
								>
									<Icon size={18} />
									{option.label}
								</button>
							);
						})}
					</div>
				</div>

				{/* Action Buttons */}
				<div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
					<button
						type="button"
						onClick={onClose}
						style={{
							padding: '12px 24px',
							border: '1px solid #d1d5db',
							borderRadius: '8px',
							background: 'white',
							color: '#374151',
							fontSize: '14px',
							fontWeight: '600',
							cursor: 'pointer',
						}}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleDownload}
						disabled={selectedUseCases.size === 0}
						style={{
							padding: '12px 24px',
							border: 'none',
							borderRadius: '8px',
							background: selectedUseCases.size === 0 ? '#9ca3af' : '#3b82f6',
							color: 'white',
							fontSize: '14px',
							fontWeight: '600',
							cursor: selectedUseCases.size === 0 ? 'not-allowed' : 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<FiDownload size={18} />
						Download ({selectedUseCases.size} use case{selectedUseCases.size !== 1 ? 's' : ''})
					</button>
				</div>
			</div>
		</div>
	);
};
