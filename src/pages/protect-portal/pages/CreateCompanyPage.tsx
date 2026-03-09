import { V9_COLORS } from '../../../services/v9/V9ColorStandards';
/**
 * @file CreateCompanyPage.tsx
 * @module protect-portal/pages
 * @description Company Editor utility page for creating new company themes
 * @version 9.3.6
 * @since 2026-02-15
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { CompanyConfigService } from '../services/CompanyConfigService';
import type { CompanyConfigDraft, CompanyEditorState, Industry } from '../types/CompanyConfig';
import { DEFAULT_COMPANY_COLORS } from '../types/CompanyConfig';

const PageContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
	background: V9_COLORS.BG.GRAY_LIGHT;
	min-height: 100vh;
`;

const Header = styled.div`
	text-align: center;
	margin-bottom: 2rem;
`;

const Title = styled.h1`
	font-size: 2.5rem;
	font-weight: 700;
	color: #1e293b;
	margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
	font-size: 1.1rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
`;

const FormContainer = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 2rem;
	margin-bottom: 2rem;
`;

const FormSection = styled.div`
	background: white;
	padding: 1.5rem;
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1e293b;
	margin-bottom: 1rem;
	padding-bottom: 0.5rem;
	border-bottom: 2px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	font-weight: 500;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin-bottom: 0.5rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 6px;
	font-size: 1rem;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: V9_COLORS.PRIMARY.BLUE;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&.error {
		border-color: V9_COLORS.PRIMARY.RED;
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 6px;
	font-size: 1rem;
	background: white;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: V9_COLORS.PRIMARY.BLUE;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const ColorPickerGroup = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
`;

const ColorInputWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ColorInput = styled.input`
	width: 60px;
	height: 40px;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 6px;
	cursor: pointer;
	padding: 2px;
`;

const ColorLabel = styled.span`
	font-size: 0.875rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
`;

const FileUploadWrapper = styled.div`
	position: relative;
	border: 2px dashed V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 8px;
	padding: 2rem;
	text-align: center;
	transition: border-color 0.2s;
	cursor: pointer;

	&:hover {
		border-color: V9_COLORS.PRIMARY.BLUE;
	}

	&.has-file {
		border-color: V9_COLORS.PRIMARY.GREEN;
		border-style: solid;
	}
`;

const FileInput = styled.input`
	position: absolute;
	opacity: 0;
	width: 100%;
	height: 100%;
	cursor: pointer;
`;

const PreviewContainer = styled.div`
	background: white;
	padding: 1.5rem;
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const PreviewHeader = styled.div`
	background: var(--company-headers, V9_COLORS.TEXT.GRAY_DARK);
	color: white;
	padding: 1rem;
	border-radius: 8px 8px 0 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const PreviewContent = styled.div`
	padding: 1.5rem;
	background: var(--company-background, V9_COLORS.TEXT.WHITE);
	color: var(--company-text, V9_COLORS.TEXT.GRAY_DARK);
	min-height: 200px;
`;

const PreviewButton = styled.button`
	background: var(--company-button, V9_COLORS.PRIMARY.BLUE);
	color: white;
	border: none;
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		opacity: 0.9;
	}
`;

const PreviewFooter = styled.div`
	background: V9_COLORS.BG.GRAY_LIGHT;
	padding: 1rem;
	border-radius: 0 0 8px 8px;
`;

const ImagePreview = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
`;

const PreviewImage = styled.img`
	max-width: 100%;
	max-height: 120px;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	object-fit: contain;
`;

const PreviewLogo = styled.img`
	max-width: 80px;
	max-height: 80px;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	object-fit: contain;
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 1rem;
	justify-content: center;
	margin-top: 2rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	${({ variant = 'primary' }) => {
		switch (variant) {
			case 'secondary':
				return `
					background: V9_COLORS.TEXT.GRAY_MEDIUM;
					color: white;
					&:hover { background: #4b5563; }
				`;
			case 'success':
				return `
					background: V9_COLORS.PRIMARY.GREEN;
					color: white;
					&:hover { background: V9_COLORS.PRIMARY.GREEN_DARK; }
				`;
			default:
				return `
					background: V9_COLORS.PRIMARY.BLUE;
					color: white;
					&:hover { background: V9_COLORS.PRIMARY.BLUE_DARK; }
				`;
		}
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ErrorMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: V9_COLORS.PRIMARY.RED;
	font-size: 0.875rem;
	margin-top: 0.25rem;
`;

const StatusAlert = styled.div<{ type: 'success' | 'error' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 1rem;
	border-radius: 8px;
	margin-bottom: 1rem;

	${({ type }) => {
		switch (type) {
			case 'success':
				return `
					background: #f0fdf4;
					border: 1px solid V9_COLORS.BG.SUCCESS_BORDER;
					color: V9_COLORS.PRIMARY.GREEN;
				`;
			case 'error':
				return `
					background: V9_COLORS.BG.ERROR;
					border: 1px solid V9_COLORS.BG.ERROR_BORDER;
					color: V9_COLORS.PRIMARY.RED_DARK;
				`;
		}
	}}
`;

export const CreateCompanyPage: React.FC = () => {
	const companyService = CompanyConfigService.getInstance();
	const navigate = useNavigate();

	const [state, setState] = useState<CompanyEditorState>({
		config: {
			name: '',
			industry: '',
			colors: DEFAULT_COMPANY_COLORS,
			assets: {
				logoUrl: '',
				footerUrl: '',
			},
		},
		validation: {
			isValid: false,
			errors: {},
		},
		isSaving: false,
		isCreating: false,
		saveStatus: 'idle',
		createStatus: 'idle',
	});

	// Update validation when config changes
	useEffect(() => {
		const validation = companyService.validateConfig(state.config);
		setState((prev) => ({ ...prev, validation }));
	}, [state.config, companyService.validateConfig]); // Remove companyService.validateConfig from dependencies

	// Apply theme variables to preview
	useEffect(() => {
		const root = document.documentElement;
		root.style.setProperty('--company-button', state.config.colors.button);
		root.style.setProperty('--company-headers', state.config.colors.headers);
		root.style.setProperty('--company-text', state.config.colors.text);
		root.style.setProperty('--company-background', state.config.colors.background);
	}, [state.config.colors]);

	const handleInputChange = useCallback((field: keyof CompanyConfigDraft, value: string) => {
		setState((prev) => {
			const newState = {
				...prev,
				config: {
					...prev.config,
					[field]: value,
				},
			};
			return newState;
		});

		// Show subtle feedback for important fields
		if (field === 'name' && value.length > 0) {
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Company name updated',
				duration: 4000,
			});
		}
	}, []);

	const handleColorChange = useCallback(
		(colorField: keyof CompanyConfigDraft['colors'], value: string) => {
			setState((prev) => ({
				...prev,
				config: {
					...prev.config,
					colors: {
						...prev.config.colors,
						[colorField]: value,
					},
				},
			}));

			// Show feedback for color changes
			const colorName = colorField.charAt(0).toUpperCase() + colorField.slice(1);
			modernMessaging.showFooterMessage({
				type: 'info',
				message: `${colorName} color updated`,
				duration: 4000,
			});
		},
		[]
	);

	const handleAssetChange = useCallback(
		(assetField: keyof CompanyConfigDraft['assets'], value: string) => {
			setState((prev) => ({
				...prev,
				config: {
					...prev.config,
					assets: {
						...prev.config.assets,
						[assetField]: value,
					},
				},
			}));
		},
		[]
	);

	const handleFileUpload = useCallback(
		(assetField: keyof CompanyConfigDraft['assets'], file: File) => {
			// Validate file size (5MB limit)
			if (file.size > 5 * 1024 * 1024) {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: 'File size must be less than 5MB',
					dismissible: true,
				});
				return;
			}

			// Validate file type
			const allowedTypes = [
				'image/jpeg',
				'image/jpg',
				'image/png',
				'image/gif',
				'image/webp',
				'image/svg+xml',
			];
			if (!allowedTypes.includes(file.type)) {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: 'Only JPG, PNG, GIF, WebP, and SVG files are allowed',
					dismissible: true,
				});
				return;
			}

			// Create blob URL and update state
			const url = URL.createObjectURL(file);
			handleAssetChange(assetField, url);

			// Show success message
			const assetName = assetField === 'logoUrl' ? 'Logo' : 'Footer image';
			modernMessaging.showFooterMessage({
				type: 'status',
				message: `${assetName} uploaded successfully`,
				duration: 4000,
			});
		},
		[handleAssetChange]
	);

	const handleFileUploadClick = useCallback(
		(_e: React.MouseEvent, assetField: keyof CompanyConfigDraft['assets']) => {
			// Create a temporary file input and trigger click
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = 'image/*';
			input.onchange = (event) => {
				const file = (event.target as HTMLInputElement).files?.[0];
				if (file) {
					handleFileUpload(assetField, file);
				}
			};
			input.click();
		},
		[handleFileUpload]
	);

	const handleSave = useCallback(async () => {
		if (!state.validation.isValid) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Please fill in all required fields',
				dismissible: true,
			});
			return;
		}

		setState((prev) => ({ ...prev, isSaving: true, saveStatus: 'idle' }));

		try {
			await companyService.saveDraft(state.config);
			setState((prev) => ({ ...prev, saveStatus: 'success' }));
			modernMessaging.showFooterMessage({
				type: 'status',
				message: 'Company configuration saved successfully!',
				duration: 4000,
			});
		} catch (error) {
			setState((prev) => ({
				...prev,
				saveStatus: 'error',
				lastError: error instanceof Error ? error.message : 'Unknown error',
			}));
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to save configuration. Please try again.',
				dismissible: true,
			});
		} finally {
			setState((prev) => ({ ...prev, isSaving: false }));
		}
	}, [state.config, state.validation.isValid, companyService]);

	const handleCreate = useCallback(async () => {
		if (!state.validation.isValid) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Please fill in all required fields',
				dismissible: true,
			});
			return;
		}

		setState((prev) => ({ ...prev, isCreating: true, createStatus: 'idle' }));

		try {
			const newCompany = await companyService.createCompany(state.config);
			setState((prev) => ({ ...prev, createStatus: 'success' }));

			// Navigate to the Protect Portal with the new company
			const companyTheme = newCompany.name.toLowerCase().replace(/\s+/g, '-');
			console.log('Company created:', newCompany);
			modernMessaging.showFooterMessage({
				type: 'status',
				message: `Perfect! The delta theme has been successfully updated with all the required properties from the BrandTheme interface. Company "${state.config.name}" created successfully! Redirecting to portal...`,
				duration: 4000,
			});

			// Dispatch custom event to notify other components
			window.dispatchEvent(
				new CustomEvent('companyCreated', {
					detail: { company: newCompany, theme: companyTheme },
				})
			);

			// Navigate to protect portal with the new company theme
			setTimeout(() => {
				navigate(`/protect-portal?company=${companyTheme}`);
			}, 1500);
		} catch (error) {
			setState((prev) => ({
				...prev,
				createStatus: 'error',
				lastError: error instanceof Error ? error.message : 'Unknown error',
			}));
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to create company. Please try again.',
				dismissible: true,
			});
		} finally {
			setState((prev) => ({ ...prev, isCreating: false }));
		}
	}, [state.config, state.validation.isValid, companyService, navigate]);

	const renderError = (field: string) => {
		const error = state.validation.errors[field as keyof typeof state.validation.errors];
		if (!error) return null;

		if (typeof error === 'string') {
			return (
				<ErrorMessage>
					<span style={{ fontSize: '14px' }}>⚠️</span>
					{error}
				</ErrorMessage>
			);
		}

		return null;
	};

	const renderColorError = (colorField: string) => {
		const colorErrors = state.validation.errors.colors;
		if (!colorErrors || typeof colorErrors !== 'object') return null;

		const error = (colorErrors as Record<string, string>)[colorField];
		if (!error) return null;

		return (
			<ErrorMessage>
				<span style={{ fontSize: '14px' }}>⚠️</span>
				{error}
			</ErrorMessage>
		);
	};

	return (
		<PageContainer>
			<Header>
				<Title>Create Company for Protect App</Title>
				<Subtitle>Design and configure a new company theme for the Protect Portal</Subtitle>
			</Header>

			{state.saveStatus === 'success' && (
				<StatusAlert type="success">
					<span style={{ fontSize: '20px' }}>✅</span>
					Company configuration saved successfully!
				</StatusAlert>
			)}

			{state.saveStatus === 'error' && (
				<StatusAlert type="error">
					<span style={{ fontSize: '20px' }}>❌</span>
					Failed to save: {state.lastError}
				</StatusAlert>
			)}

			{state.createStatus === 'success' && (
				<StatusAlert type="success">
					<span style={{ fontSize: '20px' }}>✅</span>
					Company created successfully!
				</StatusAlert>
			)}

			{state.createStatus === 'error' && (
				<StatusAlert type="error">
					<span style={{ fontSize: '20px' }}>❌</span>
					Failed to create company: {state.lastError}
				</StatusAlert>
			)}

			<FormContainer>
				{/* Left Column - Form */}
				<div>
					{/* Company Info */}
					<FormSection>
						<SectionTitle>Company Information</SectionTitle>

						<FormGroup>
							<Label htmlFor="companyName">Company Name *</Label>
							<Input
								id="companyName"
								type="text"
								value={state.config.name}
								onChange={(e) => handleInputChange('name', e.target.value)}
								placeholder="Enter company name"
								className={state.validation.errors.name ? 'error' : ''}
							/>
							{renderError('name')}
						</FormGroup>

						<FormGroup>
							<Label htmlFor="industry">Industry *</Label>
							<Select
								id="industry"
								value={state.config.industry}
								onChange={(e) => handleInputChange('industry', e.target.value)}
								className={state.validation.errors.industry ? 'error' : ''}
							>
								<option value="">Select industry</option>
								{(
									[
										'aviation',
										'banking',
										'tech',
										'healthcare',
										'retail',
										'manufacturing',
										'consulting',
										'education',
										'government',
										'other',
									] as Industry[]
								).map((industry) => (
									<option key={industry} value={industry}>
										{industry.charAt(0).toUpperCase() + industry.slice(1)}
									</option>
								))}
							</Select>
							{renderError('industry')}
						</FormGroup>
					</FormSection>

					{/* Branding */}
					<FormSection>
						<SectionTitle>Branding</SectionTitle>

						<FormGroup>
							<Label>Company Logo *</Label>
							<FileUploadWrapper
								className={state.config.assets.logoUrl ? 'has-file' : ''}
								onClick={(e) => handleFileUploadClick(e, 'logoUrl')}
							>
								<FileInput
									type="file"
									accept="image/*"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) handleFileUpload('logoUrl', file);
									}}
								/>
								{state.config.assets.logoUrl ? (
									<ImagePreview>
										<PreviewLogo src={state.config.assets.logoUrl} alt="Company Logo" />
										<div>
											<span style={{ fontSize: '24px' }}>🖼️</span>
											<p>Logo uploaded</p>
										</div>
									</ImagePreview>
								) : (
									<div>
										<span style={{ fontSize: '24px' }}>📤</span>
										<p>Click to upload logo</p>
										<small>JPG, PNG, GIF, WebP, SVG (Max 5MB)</small>
									</div>
								)}
							</FileUploadWrapper>
							{renderError('logoUrl')}
						</FormGroup>

						<FormGroup>
							<Label>Footer Image (Optional)</Label>
							<FileUploadWrapper
								className={state.config.assets.footerUrl ? 'has-file' : ''}
								onClick={(e) => handleFileUploadClick(e, 'footerUrl')}
							>
								<FileInput
									type="file"
									accept="image/*"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) handleFileUpload('footerUrl', file);
									}}
								/>
								{state.config.assets.footerUrl ? (
									<ImagePreview>
										<PreviewImage src={state.config.assets.footerUrl} alt="Footer Image" />
										<div>
											<span style={{ fontSize: '24px' }}>🖼️</span>
											<p>Footer image uploaded</p>
										</div>
									</ImagePreview>
								) : (
									<div>
										<span style={{ fontSize: '24px' }}>📤</span>
										<p>Click to upload footer image</p>
										<small>JPG, PNG, GIF, WebP, SVG (Max 5MB)</small>
									</div>
								)}
							</FileUploadWrapper>
							{renderError('footerUrl')}
						</FormGroup>
					</FormSection>

					{/* Theme Colors */}
					<FormSection>
						<SectionTitle>Theme Colors</SectionTitle>

						<ColorPickerGroup>
							<div>
								<Label htmlFor="buttonColor">Button Color</Label>
								<ColorInputWrapper>
									<ColorInput
										id="buttonColor"
										type="color"
										value={state.config.colors.button}
										onChange={(e) => handleColorChange('button', e.target.value)}
									/>
									<ColorLabel>{state.config.colors.button}</ColorLabel>
								</ColorInputWrapper>
								{renderColorError('button')}
							</div>

							<div>
								<Label htmlFor="headerColor">Header Color</Label>
								<ColorInputWrapper>
									<ColorInput
										id="headerColor"
										type="color"
										value={state.config.colors.headers}
										onChange={(e) => handleColorChange('headers', e.target.value)}
									/>
									<ColorLabel>{state.config.colors.headers}</ColorLabel>
								</ColorInputWrapper>
								{renderColorError('headers')}
							</div>

							<div>
								<Label htmlFor="textColor">Text Color</Label>
								<ColorInputWrapper>
									<ColorInput
										id="textColor"
										type="color"
										value={state.config.colors.text}
										onChange={(e) => handleColorChange('text', e.target.value)}
									/>
									<ColorLabel>{state.config.colors.text}</ColorLabel>
								</ColorInputWrapper>
								{renderColorError('text')}
							</div>

							<div>
								<Label htmlFor="backgroundColor">Background Color</Label>
								<ColorInputWrapper>
									<ColorInput
										id="backgroundColor"
										type="color"
										value={state.config.colors.background}
										onChange={(e) => handleColorChange('background', e.target.value)}
									/>
									<ColorLabel>{state.config.colors.background}</ColorLabel>
								</ColorInputWrapper>
								{renderColorError('background')}
							</div>
						</ColorPickerGroup>
					</FormSection>
				</div>

				{/* Right Column - Preview */}
				<div>
					<PreviewContainer>
						<SectionTitle>
							<span style={{ fontSize: '16px' }}>👁️</span> Live Preview
						</SectionTitle>

						<PreviewHeader>
							<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
								{state.config.assets.logoUrl && (
									<PreviewLogo
										src={state.config.assets.logoUrl}
										alt="Company Logo"
										style={{ maxHeight: '40px' }}
									/>
								)}
								<div>
									<strong>{state.config.name || 'Company Name'}</strong>
								</div>
							</div>
							<div>
								<small>
									{state.config.industry
										? `Industry: ${state.config.industry}`
										: 'Industry not set'}
								</small>
							</div>
						</PreviewHeader>

						<PreviewContent>
							<p>This is how your company theme will appear in the Protect Portal.</p>
							<br />
							<PreviewButton>Sample Button</PreviewButton>
							<br />
							<br />
							<p>Text color and background are applied throughout the interface.</p>
						</PreviewContent>

						{state.config.assets.footerUrl && (
							<PreviewFooter>
								<img
									src={state.config.assets.footerUrl}
									alt="Footer"
									style={{
										maxHeight: '60px',
										objectFit: 'contain',
										width: '100%',
									}}
								/>
							</PreviewFooter>
						)}
					</PreviewContainer>
				</div>
			</FormContainer>

			<ActionButtons>
				<Button
					variant="secondary"
					onClick={handleSave}
					disabled={!state.validation.isValid || state.isSaving}
				>
					<span style={{ fontSize: '16px' }}>💾</span>
					{state.isSaving ? 'Saving...' : 'Save Draft'}
				</Button>

				<Button
					variant="success"
					onClick={handleCreate}
					disabled={!state.validation.isValid || state.isCreating}
				>
					<span style={{ fontSize: '16px' }}>➕</span>
					{state.isCreating ? 'Creating...' : 'Create Company'}
				</Button>
			</ActionButtons>
		</PageContainer>
	);
};
