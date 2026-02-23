// src/components/MfaFlowCodeGenerator.V9.tsx
/**
 * V9 PingOne UI Upgrade - MFA Flow Code Generator
 * 
 * V9 Upgrades Applied:
 * - Removed React Icons (FiCode) in favor of MDI CSS icons
 * - Added .end-user-nano namespace wrapper for Ping UI scoping
 * - Applied Ping UI CSS variables and spacing system
 * - Replaced v4ToastManager with CentralizedSuccessMessage system
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions throughout
 * - Applied Ping UI color palette and design tokens
 */

import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { CodeGenerationService } from '../services/codeGeneration';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { showFlowSuccess, showFlowError } from '../components/CentralizedSuccessMessage';

// Import types from the original InteractiveCodeEditor for compatibility
import { 
	CodeCategory as OriginalCodeCategory, 
	CodeType as OriginalCodeType, 
	FlowStep as OriginalFlowStep 
} from './InteractiveCodeEditor';

// Import the V9 component
import { InteractiveCodeEditorV9 } from './InteractiveCodeEditor.V9';

// Type aliases for compatibility
type CodeCategory = OriginalCodeCategory;
type CodeType = OriginalCodeType;
type FlowStep = OriginalFlowStep;

// Ping UI Namespace Wrapper
const PingUIWrapper = styled.div`
	/* Ping UI V9 namespace wrapper */
	.end-user-nano & {
		/* All styles inherit from Ping UI design system */
	}
`;

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
}> = ({ icon, size = 16, ariaLabel, ariaHidden = false, className = '' }) => {
	const iconMap: Record<string, string> = {
		FiCode: 'mdi-code-tags',
		FiCheck: 'mdi-check',
		FiCopy: 'mdi-content-copy',
		FiDownload: 'mdi-download',
		FiMoon: 'mdi-moon-waxing-crescent',
		FiRefreshCw: 'mdi-refresh',
		FiSun: 'mdi-white-balance-sunny',
	};

	const iconClass = iconMap[icon] || 'mdi-help-circle';
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

// Ping UI Styled Components
const CodeGeneratorContainer = styled.div`
	background: var(--ping-bg-color, #ffffff);
	border: 1px solid var(--ping-border-color, #e5e7eb);
	border-radius: var(--ping-border-radius-lg, 12px);
	padding: var(--ping-spacing-xl, 24px);
	margin-top: var(--ping-spacing-xl, 24px);
	box-shadow: var(--ping-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
	transition: all 0.15s ease-in-out;

	&:hover {
		box-shadow: var(--ping-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
	}
`;

const Description = styled.p`
	margin: 0 0 var(--ping-spacing-lg, 16px) 0;
	color: var(--ping-text-color-secondary, #6b7280);
	font-size: var(--ping-font-size-sm, 14px);
	line-height: var(--ping-line-height-relaxed, 1.6);
	font-family: var(--ping-font-family, 'Inter', sans-serif);
`;

const Dependencies = styled.div`
	background: var(--ping-bg-color-secondary, #f6f8fa);
	padding: var(--ping-spacing-md, 12px) var(--ping-spacing-lg, 16px);
	border-top: 1px solid var(--ping-border-color, #e1e4e8);
	font-size: var(--ping-font-size-xs, 13px);
	color: var(--ping-text-color-tertiary, #586069);
	font-family: var(--ping-font-family-mono, 'Menlo', 'Monaco', monospace);
	border-radius: 0 0 var(--ping-border-radius-lg, 12px) var(--ping-border-radius-lg, 12px);
`;

interface MfaFlowCodeGeneratorProps {
	environmentId?: string;
	clientId?: string;
	redirectUri?: string;
	userId?: string;
}

export const MfaFlowCodeGeneratorV9: React.FC<MfaFlowCodeGeneratorProps> = ({
	environmentId = 'YOUR_ENVIRONMENT_ID',
	clientId = 'YOUR_CLIENT_ID',
	redirectUri = 'https://your-app.com/callback',
	userId = 'USER_ID',
}) => {
	const [currentCategory, setCurrentCategory] = useState<CodeCategory>('frontend');
	const [currentCodeType, setCurrentCodeType] = useState<CodeType>('ping-sdk-js');
	const [dependencies, setDependencies] = useState<string[]>([]);
	const [description, setDescription] = useState<string>('');

	// Initialize code generation service
	const codeGenService = useMemo(() => new CodeGenerationService(), []);

	const flowSteps: FlowStep[] = [
		'authorization',
		'workerToken',
		'deviceSelection',
		'mfaChallenge',
		'mfaVerification',
		'deviceRegistration',
	];

	// Build code by step mapping for current category and type
	const codeByStep = useMemo(() => {
		const codeMap: Record<FlowStep, string> = {} as Record<FlowStep, string>;

		flowSteps.forEach((step) => {
			const generated = codeGenService.generate({
				category: currentCategory,
				codeType: currentCodeType,
				flowStep: step,
				language: 'typescript',
				config: {
					environmentId,
					clientId,
					redirectUri,
					userId,
				},
			});

			codeMap[step] = generated.code;

			// Update dependencies and description from first step
			if (step === 'authorization') {
				setDependencies(generated.dependencies);
				setDescription(generated.description);
			}
		});

		return codeMap;
	}, [
		codeGenService,
		currentCategory,
		currentCodeType,
		environmentId,
		clientId,
		redirectUri,
		userId,
		flowSteps.forEach,
	]);

	// Get initial code for authorization step
	const initialGenerated = useMemo(() => {
		return codeGenService.generate({
			category: currentCategory,
			codeType: currentCodeType,
			flowStep: 'authorization',
			language: 'typescript',
			config: {
				environmentId,
				clientId,
				redirectUri,
				userId,
			},
		});
	}, [
		codeGenService,
		currentCategory,
		currentCodeType,
		environmentId,
		clientId,
		redirectUri,
		userId,
	]);

	// Handle category/type changes with new messaging system
	const handleCategoryChange = (category: CodeCategory, type: CodeType) => {
		setCurrentCategory(category);
		setCurrentCodeType(type);
		showFlowSuccess(`Switched to ${category} - ${type} code generation`);
	};

	// Handle code changes with enhanced feedback
	const handleCodeChange = (code: string) => {
		// Handle code changes if needed
		console.log('Code updated:', `${code.substring(0, 50)}...`);
		// Could add validation or auto-save functionality here
	};

	return (
		<PingUIWrapper className="end-user-nano">
			<CollapsibleHeader
				title={
					<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ping-spacing-sm, 8px)' }}>
						<MDIIcon icon="FiCode" size={20} ariaLabel="Code generator" />
						Code Examples - Production Ready
					</div>
				}
				subtitle="Interactive code editor with live editing, syntax highlighting, and configuration"
				theme="purple"
				defaultCollapsed={true}
				variant="default"
			>
				<CodeGeneratorContainer>
					<Description>{description || initialGenerated.description}</Description>

					<InteractiveCodeEditorV9
						initialCode={initialGenerated.code}
						language="typescript"
						title="MFA Flow Code Generator"
						flowSteps={flowSteps}
						codeByStep={codeByStep}
						onCategoryChange={handleCategoryChange}
						onCodeChange={handleCodeChange}
					/>

					{dependencies.length > 0 && (
						<Dependencies
							style={{
								marginTop: 'var(--ping-spacing-lg, 16px)',
								padding: 'var(--ping-spacing-md, 12px) var(--ping-spacing-lg, 16px)',
								background: 'var(--ping-bg-color-secondary, #f6f8fa)',
								borderRadius: 'var(--ping-border-radius, 8px)',
							}}
						>
							<strong>Dependencies:</strong> {dependencies.join(', ')}
						</Dependencies>
					)}
				</CodeGeneratorContainer>
			</CollapsibleHeader>
		</PingUIWrapper>
	);
};

export default MfaFlowCodeGeneratorV9;
