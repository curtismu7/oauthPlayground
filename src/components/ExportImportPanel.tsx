// src/components/ExportImportPanel.tsx
// Export/Import UI components for the Application Generator


import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import {
	exportImportService,
	exportUtils,
	type ImportValidationResult,
} from '../services/exportImportService';
import type { BuilderAppType, FormDataState } from '../services/presetManagerService';
import { FileDropHandler, validateFile } from '../utils/fileHandling';
import { createModuleLogger } from '../utils/consoleMigrationHelper';

const Container = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(244, 247, 255, 0.92) 100%);
  border-radius: 1.25rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 28px 75px -40px rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.35);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const Title = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin: 0;
`;

const Description = styled.p`
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  margin: 0.5rem 0 1.5rem 0;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ActionSection = styled.div`
  padding: 1.5rem;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.75rem;
  background: white;
`;

const ActionTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActionDescription = styled.p`
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  font-size: 0.875rem;
  margin: 0 0 1.5rem 0;
  line-height: 1.4;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  justify-content: center;

  ${({ variant, theme }) => {
		switch (variant) {
			case 'primary':
				return `
          background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
          color: white;
          &:hover:not(:disabled) {
            background: linear-gradient(135deg, ${theme.colors.primaryDark} 0%, ${theme.colors.primary} 100%);
            transform: translateY(-1px);
            box-shadow: 0 15px 35px -20px rgba(79, 70, 229, 0.6);
          }
        `;
			case 'success':
				return `
          background: linear-gradient(135deg, V9_COLORS.PRIMARY.GREEN 0%, #15803d 100%);
          color: white;
          &:hover:not(:disabled) {
            background: linear-gradient(135deg, V9_COLORS.PRIMARY.GREEN_DARK 0%, V9_COLORS.PRIMARY.GREEN 100%);
            transform: translateY(-1px);
          }
        `;
			case 'danger':
				return `
          background: linear-gradient(135deg, V9_COLORS.PRIMARY.RED 0%, V9_COLORS.PRIMARY.RED_DARK 100%);
          color: white;
          &:hover:not(:disabled) {
            background: linear-gradient(135deg, V9_COLORS.PRIMARY.RED_DARK 0%, V9_COLORS.PRIMARY.RED_DARK 100%);
            transform: translateY(-1px);
          }
        `;
			default:
				return `
          background: white;
          color: ${theme.colors.gray700};
          border-color: V9_COLORS.TEXT.GRAY_LIGHTER;
          &:hover:not(:disabled) {
            background: #f9fafb;
            border-color: ${theme.colors.primary};
          }
        `;
		}
	}}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
`;

const DropZone = styled.div.withConfig({
	shouldForwardProp: (prop) => !['isDragOver', 'hasError'].includes(prop),
})<{ isDragOver: boolean; hasError: boolean }>`
  border: 2px dashed ${({ isDragOver, hasError }) =>
		hasError
			? 'V9_COLORS.PRIMARY.RED'
			: isDragOver
				? 'V9_COLORS.PRIMARY.BLUE'
				: 'V9_COLORS.TEXT.GRAY_LIGHTER'};
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  background: ${({ isDragOver, hasError }) =>
		hasError ? 'V9_COLORS.BG.ERROR' : isDragOver ? 'V9_COLORS.BG.GRAY_LIGHT' : '#f9fafb'};
  transition: all 0.2s;
  cursor: pointer;
  margin-bottom: 1rem;

  &:hover {
    border-color: ${({ hasError }) => (hasError ? 'V9_COLORS.PRIMARY.RED' : 'V9_COLORS.PRIMARY.BLUE')};
    background: ${({ hasError }) => (hasError ? 'V9_COLORS.BG.ERROR' : 'V9_COLORS.BG.GRAY_LIGHT')};
  }

  &.drag-over {
    border-color: V9_COLORS.PRIMARY.BLUE;
    background: V9_COLORS.BG.GRAY_LIGHT;
    transform: scale(1.02);
  }
`;

const DropZoneIcon = styled.div.withConfig({
	shouldForwardProp: (prop) => prop !== 'hasError',
})<{ hasError: boolean }>`
  font-size: 2rem;
  color: ${({ hasError }) => (hasError ? 'V9_COLORS.PRIMARY.RED' : 'V9_COLORS.TEXT.GRAY_MEDIUM')};
  margin-bottom: 1rem;
`;

const DropZoneText = styled.div`
  color: V9_COLORS.TEXT.GRAY_DARK;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const DropZoneSubtext = styled.div`
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  font-size: 0.875rem;
`;

const ValidationResult = styled.div<{ type: 'success' | 'error' | 'warning' }>`
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
  
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
			case 'warning':
				return `
          background: V9_COLORS.BG.WARNING;
          border: 1px solid #fed7aa;
          color: V9_COLORS.PRIMARY.YELLOW_DARK;
        `;
		}
	}}
`;

const ValidationTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ValidationList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  
  li {
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
  }
`;

const FileInfo = styled.div`
  background: #f3f4f6;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
  font-size: 0.875rem;
`;

const FileInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

interface ExportImportPanelProps {
	formData: FormDataState;
	appType: BuilderAppType | null;
	onImport: (config: FormDataState, metadata: Record<string, unknown>) => void;
	disabled?: boolean;
}

export const ExportImportPanel: React.FC<ExportImportPanelProps> = ({
	formData,
	appType,
	onImport,
	disabled = false,
}) => {
	const [isDragOver, _setIsDragOver] = useState(false);
	const [importResult, setImportResult] = useState<ImportValidationResult | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [dropError, setDropError] = useState<string | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const dropZoneRef = useRef<HTMLDivElement>(null);
	const dropHandlerRef = useRef<FileDropHandler | null>(null);

	const processImportFile = async (file: File) => {
		setIsProcessing(true);
		setImportResult(null);

		try {
			// Validate file first
			const fileValidation = validateFile(file, {
				accept: ['.json'],
				maxSize: 1024 * 1024,
			});

			if (!fileValidation.isValid) {
				setDropError(fileValidation.error || 'File validation failed');
				return;
			}

			// Import and validate configuration
			const result = await exportImportService.importConfiguration(file);
			setImportResult(result);

			if (result.isValid && result.configuration) {
				// Auto-apply if valid
				onImport(result.configuration, result.metadata);
				modernMessaging.showFooterMessage({
					type: 'status',
					message: 'Configuration imported and applied successfully!',
					duration: 4000,
				});
			} else {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: 'Configuration import failed. Please check the validation errors.',
					dismissible: true,
				});
			}
		} catch (error) {
			log.error('ExportImportPanel', '[ExportImport] Import failed:', undefined, error as Error);
			setDropError(error instanceof Error ? error.message : 'Import failed');
		} finally {
			setIsProcessing(false);
		}
	};

	const handleFilesDropped = useCallback(
		async (files: File[]) => {
			if (files.length === 0) return;

			const file = files[0];
			setDropError(null);
			await processImportFile(file);
		},
		[processImportFile]
	);

	const handleFileSelect = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const files = event.target.files;
			if (files && files.length > 0) {
				setDropError(null);
				await processImportFile(files[0]);
			}
		},
		[processImportFile]
	);

	const handleExport = useCallback(() => {
		if (!appType) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Please select an application type first',
				dismissible: true,
			});
			return;
		}

		try {
			exportUtils.quickExport(formData, appType, formData.name || 'app-config');
			modernMessaging.showFooterMessage({
				type: 'status',
				message: 'Configuration exported successfully!',
				duration: 4000,
			});
		} catch (error) {
			log.error('ExportImportPanel', '[ExportImport] Export failed:', undefined, error as Error);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to export configuration',
				dismissible: true,
			});
		}
	}, [formData, appType]);

	// Initialize drop handler
	React.useEffect(() => {
		if (dropZoneRef.current && !disabled) {
			dropHandlerRef.current = new FileDropHandler(
				dropZoneRef.current,
				{
					accept: ['.json'],
					maxSize: 1024 * 1024, // 1MB
					multiple: false,
				},
				{
					onFiles: handleFilesDropped,
					onError: (error) => setDropError(error),
				}
			);

			return () => {
				dropHandlerRef.current?.destroy();
			};
		}
	}, [disabled, handleFilesDropped]);

	const handleDropZoneClick = () => {
		if (!disabled) {
			fileInputRef.current?.click();
		}
	};

	const canExport = !disabled && appType && (formData.name?.trim() || formData.description?.trim());

	return (
		<Container>
			<Header>
				<span>❓</span>
				<Title>Export & Import Configuration</Title>
			</Header>

			<Description>
				Export your current application configuration to share with others, or import a previously
				saved configuration.
			</Description>

			<ActionGrid>
				{/* Export Section */}
				<ActionSection>
					<ActionTitle>
						<span>📥</span>
						Export Configuration
					</ActionTitle>
					<ActionDescription>
						Download your current application configuration as a JSON file. This includes all
						settings, scopes, and advanced parameters.
					</ActionDescription>

					<Button variant="primary" onClick={handleExport} disabled={!canExport}>
						<span>📥</span>
						Export as JSON
					</Button>

					{!canExport && (
						<div
							style={{
								marginTop: '0.75rem',
								fontSize: '0.875rem',
								color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
							}}
						>
							{!appType && 'Select an application type to enable export'}
							{appType &&
								!formData.name?.trim() &&
								!formData.description?.trim() &&
								'Add a name or description to enable export'}
						</div>
					)}
				</ActionSection>

				{/* Import Section */}
				<ActionSection>
					<ActionTitle>
						<span>📤</span>
						Import Configuration
					</ActionTitle>
					<ActionDescription>
						Upload a previously exported configuration file to populate the form with saved
						settings.
					</ActionDescription>

					<DropZone
						ref={dropZoneRef}
						isDragOver={isDragOver}
						hasError={!!dropError}
						onClick={handleDropZoneClick}
					>
						<DropZoneIcon hasError={!!dropError}>
							{isProcessing ? <div className="spinner" /> : dropError ? <span>❌</span> : <span>📤</span>}
						</DropZoneIcon>

						<DropZoneText>
							{isProcessing
								? 'Processing file...'
								: dropError
									? 'Upload failed'
									: 'Drop JSON file here or click to browse'}
						</DropZoneText>

						<DropZoneSubtext>{dropError || 'Supports .json files up to 1MB'}</DropZoneSubtext>
					</DropZone>

					<HiddenInput
						ref={fileInputRef}
						type="file"
						accept=".json"
						onChange={handleFileSelect}
						disabled={disabled}
					/>

					{/* Validation Results */}
					{importResult && (
						<>
							{importResult.isValid ? (
								<ValidationResult type="success">
									<ValidationTitle>
										<span>✅</span>
										Configuration Valid
									</ValidationTitle>
									<div>Configuration imported successfully and applied to the form.</div>

									{importResult.metadata && (
										<FileInfo>
											<FileInfoRow>
												<strong>Name:</strong>
												<span>{importResult.metadata.name}</span>
											</FileInfoRow>
											<FileInfoRow>
												<strong>Description:</strong>
												<span>{importResult.metadata.description}</span>
											</FileInfoRow>
											<FileInfoRow>
												<strong>Source:</strong>
												<span>{importResult.metadata.source}</span>
											</FileInfoRow>
										</FileInfo>
									)}
								</ValidationResult>
							) : (
								<ValidationResult type="error">
									<ValidationTitle>
										<span>❌</span>
										Configuration Invalid
									</ValidationTitle>
									{importResult.errors.length > 0 && (
										<ValidationList>
											{importResult.errors.map((error, index) => (
												<li key={index}>{error}</li>
											))}
										</ValidationList>
									)}
								</ValidationResult>
							)}

							{importResult.warnings && importResult.warnings.length > 0 && (
								<ValidationResult type="warning">
									<ValidationTitle>
										<span>⚠️</span>
										Warnings
									</ValidationTitle>
									<ValidationList>
										{importResult.warnings.map((warning, index) => (
											<li key={index}>{warning}</li>
										))}
									</ValidationList>
								</ValidationResult>
							)}
						</>
					)}
				</ActionSection>
			</ActionGrid>
		</Container>
	);
};
