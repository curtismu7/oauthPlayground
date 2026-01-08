// src/components/ExportImportPanel.tsx
// Export/Import UI components for the Application Generator

import React, { useCallback, useRef, useState } from 'react';
import { FiAlertTriangle, FiCheck, FiDownload, FiFile, FiUpload, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import {
	exportImportService,
	exportUtils,
	type ImportValidationResult,
} from '../services/exportImportService';
import type { BuilderAppType, FormDataState } from '../services/presetManagerService';
import { FileDropHandler, validateFile } from '../utils/fileHandling';
import { v4ToastManager } from '../utils/v4ToastMessages';

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
  color: #374151;
  margin: 0;
`;

const Description = styled.p`
  color: #6b7280;
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
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background: white;
`;

const ActionTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActionDescription = styled.p`
  color: #6b7280;
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
          background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
          color: white;
          &:hover:not(:disabled) {
            background: linear-gradient(135deg, #16a34a 0%, #166534 100%);
            transform: translateY(-1px);
          }
        `;
			case 'danger':
				return `
          background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
          color: white;
          &:hover:not(:disabled) {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            transform: translateY(-1px);
          }
        `;
			default:
				return `
          background: white;
          color: ${theme.colors.gray700};
          border-color: #d1d5db;
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
		hasError ? '#ef4444' : isDragOver ? '#3b82f6' : '#d1d5db'};
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  background: ${({ isDragOver, hasError }) =>
		hasError ? '#fef2f2' : isDragOver ? '#eff6ff' : '#f9fafb'};
  transition: all 0.2s;
  cursor: pointer;
  margin-bottom: 1rem;

  &:hover {
    border-color: ${({ hasError }) => (hasError ? '#ef4444' : '#3b82f6')};
    background: ${({ hasError }) => (hasError ? '#fef2f2' : '#eff6ff')};
  }

  &.drag-over {
    border-color: #3b82f6;
    background: #eff6ff;
    transform: scale(1.02);
  }
`;

const DropZoneIcon = styled.div.withConfig({
	shouldForwardProp: (prop) => prop !== 'hasError',
})<{ hasError: boolean }>`
  font-size: 2rem;
  color: ${({ hasError }) => (hasError ? '#ef4444' : '#6b7280')};
  margin-bottom: 1rem;
`;

const DropZoneText = styled.div`
  color: #374151;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const DropZoneSubtext = styled.div`
  color: #6b7280;
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
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
			case 'error':
				return `
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        `;
			case 'warning':
				return `
          background: #fffbeb;
          border: 1px solid #fed7aa;
          color: #92400e;
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
  border: 1px solid #d1d5db;
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
	onImport: (config: FormDataState, metadata: any) => void;
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
				v4ToastManager.showSuccess('Configuration imported and applied successfully!');
			} else {
				v4ToastManager.showError(
					'Configuration import failed. Please check the validation errors.'
				);
			}
		} catch (error) {
			console.error('[ExportImport] Import failed:', error);
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
			v4ToastManager.showError('Please select an application type first');
			return;
		}

		try {
			exportUtils.quickExport(formData, appType, formData.name || 'app-config');
			v4ToastManager.showSuccess('Configuration exported successfully!');
		} catch (error) {
			console.error('[ExportImport] Export failed:', error);
			v4ToastManager.showError('Failed to export configuration');
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
				<FiFile />
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
						<FiDownload />
						Export Configuration
					</ActionTitle>
					<ActionDescription>
						Download your current application configuration as a JSON file. This includes all
						settings, scopes, and advanced parameters.
					</ActionDescription>

					<Button variant="primary" onClick={handleExport} disabled={!canExport}>
						<FiDownload />
						Export as JSON
					</Button>

					{!canExport && (
						<div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
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
						<FiUpload />
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
							{isProcessing ? <div className="spinner" /> : dropError ? <FiX /> : <FiUpload />}
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
										<FiCheck />
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
										<FiX />
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
										<FiAlertTriangle />
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
