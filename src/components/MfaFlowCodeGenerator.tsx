import React, { useMemo, useState } from 'react';
import { FiCode } from 'react-icons/fi';
import styled from 'styled-components';
import { CodeGenerationService } from '../services/codeGeneration';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { CodeCategory, CodeType, FlowStep, InteractiveCodeEditor } from './InteractiveCodeEditor';

const CodeGeneratorContainer = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  margin-top: 24px;
`;

const Description = styled.p`
  margin: 0 0 16px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
`;

const Dependencies = styled.div`
  background: #f6f8fa;
  padding: 12px 16px;
  border-top: 1px solid #e1e4e8;
  font-size: 13px;
  color: #586069;
`;

interface MfaFlowCodeGeneratorProps {
	environmentId?: string;
	clientId?: string;
	redirectUri?: string;
	userId?: string;
}

export const MfaFlowCodeGenerator: React.FC<MfaFlowCodeGeneratorProps> = ({
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

	// Handle category/type changes
	const handleCategoryChange = (category: CodeCategory, type: CodeType) => {
		setCurrentCategory(category);
		setCurrentCodeType(type);
	};

	return (
		<CollapsibleHeader
			title={
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<FiCode size={20} />
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

				<InteractiveCodeEditor
					initialCode={initialGenerated.code}
					language="typescript"
					title="MFA Flow Code Generator"
					flowSteps={flowSteps}
					codeByStep={codeByStep}
					onCategoryChange={handleCategoryChange}
					onCodeChange={(code) => {
						// Handle code changes if needed
						console.log('Code updated:', `${code.substring(0, 50)}...`);
					}}
				/>

				{dependencies.length > 0 && (
					<Dependencies
						style={{
							marginTop: '16px',
							padding: '12px 16px',
							background: '#f6f8fa',
							borderRadius: '8px',
						}}
					>
						<strong>Dependencies:</strong> {dependencies.join(', ')}
					</Dependencies>
				)}
			</CodeGeneratorContainer>
		</CollapsibleHeader>
	);
};

export default MfaFlowCodeGenerator;
