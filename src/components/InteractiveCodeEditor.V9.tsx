// src/components/InteractiveCodeEditor.V9.tsx
/**
 * V9 PingOne UI Upgrade - Interactive Code Editor
 *
 * V9 Upgrades Applied:
 * - Removed React Icons (Fi*) in favor of MDI CSS icons
 * - Added .end-user-nano namespace wrapper for Ping UI scoping
 * - Applied Ping UI CSS variables and spacing system
 * - Replaced v4ToastManager with CentralizedSuccessMessage system
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions throughout
 * - Applied Ping UI color palette and design tokens
 */

import * as monaco from 'monaco-editor';
import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { showFlowError, showFlowSuccess } from './CentralizedSuccessMessage';
import ConfirmationModal from './ConfirmationModal';

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
		FiCheck: 'mdi-check',
		FiCode: 'mdi-code-tags',
		FiCopy: 'mdi-content-copy',
		FiDownload: 'mdi-download',
		FiMoon: 'mdi-moon-waxing-crescent',
		FiRefreshCw: 'mdi-refresh',
		FiSun: 'mdi-white-balance-sunny',
		FiSettings: 'mdi-cog',
		FiChevronDown: 'mdi-chevron-down',
		FiChevronUp: 'mdi-chevron-up',
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

export type FlowStep =
	| 'authorization'
	| 'workerToken'
	| 'deviceSelection'
	| 'mfaChallenge'
	| 'mfaVerification'
	| 'deviceRegistration';

export type CodeCategory = 'frontend' | 'backend' | 'mobile' | 'iot';

export type CodeType =
	| 'ping-sdk-js'
	| 'ping-sdk-python'
	| 'ping-sdk-java'
	| 'ping-sdk-csharp'
	| 'ping-sdk-go'
	| 'ping-sdk-ruby'
	| 'ping-sdk-perl'
	| 'react'
	| 'angular'
	| 'vanilla'
	| 'react-native'
	| 'flutter'
	| 'swift'
	| 'kotlin';

export type LanguageOption =
	| 'javascript'
	| 'typescript'
	| 'python'
	| 'go'
	| 'ruby'
	| 'perl'
	| 'java'
	| 'csharp'
	| 'react'
	| 'angular'
	| 'vanilla'
	| 'react-native'
	| 'flutter'
	| 'swift'
	| 'kotlin'
	| 'dart';

const FLOW_STEP_LABELS: Record<FlowStep, string> = {
	authorization: 'Authorization',
	workerToken: 'Worker Token',
	deviceSelection: 'Device Selection',
	mfaChallenge: 'MFA Challenge',
	mfaVerification: 'MFA Verification',
	deviceRegistration: 'Device Registration',
};

const CODE_CATEGORY_LABELS: Record<CodeCategory, string> = {
	frontend: 'Frontend',
	backend: 'Backend',
	mobile: 'Mobile',
	iot: 'IoT',
};

const CODE_TYPE_LABELS: Record<CodeType, string> = {
	'ping-sdk-js': 'Ping SDK JS',
	'ping-sdk-python': 'Ping SDK Python',
	'ping-sdk-java': 'Ping SDK Java',
	'ping-sdk-csharp': 'Ping SDK C#',
	'ping-sdk-go': 'Ping SDK Go',
	'ping-sdk-ruby': 'Ping SDK Ruby',
	'ping-sdk-perl': 'Ping SDK Perl',
	react: 'React',
	angular: 'Angular',
	vanilla: 'Vanilla JS',
	'react-native': 'React Native',
	flutter: 'Flutter',
	swift: 'Swift',
	kotlin: 'Kotlin',
};

// Ping UI Styled Components
const EditorContainer = styled.div`
	background: var(--ping-bg-color, #ffffff);
	border: 1px solid var(--ping-border-color, #e5e7eb);
	border-radius: var(--ping-border-radius-lg, 12px);
	overflow: hidden;
	box-shadow: var(--ping-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
	transition: all 0.15s ease-in-out;

	&:hover {
		box-shadow: var(--ping-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
	}
`;

const EditorHeader = styled.div`
	background: var(--ping-bg-color-secondary, #f8fafc);
	padding: var(--ping-spacing-lg, 16px);
	border-bottom: 1px solid var(--ping-border-color, #e5e7eb);
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: var(--ping-spacing-md, 12px);
`;

const EditorTitle = styled.h3`
	margin: 0;
	color: var(--ping-color-text-primary, #1f2937);
	font-size: var(--ping-font-size-lg, 18px);
	font-weight: var(--ping-font-weight-semibold, 600);
`;

const ControlsContainer = styled.div`
	display: flex;
	gap: var(--ping-spacing-sm, 8px);
	align-items: center;
	flex-wrap: wrap;
`;

const ControlButton = styled.button`
	background: var(--ping-bg-color, #ffffff);
	border: 1px solid var(--ping-border-color, #d1d5db);
	color: var(--ping-color-text-primary, #374151);
	padding: var(--ping-spacing-sm, 8px) var(--ping-spacing-md, 12px);
	border-radius: var(--ping-border-radius, 6px);
	display: inline-flex;
	align-items: center;
	gap: var(--ping-spacing-xs, 4px);
	font-size: var(--ping-font-size-sm, 14px);
	font-weight: var(--ping-font-weight-medium, 500);
	cursor: pointer;
	transition: all 0.15s ease-in-out;

	&:hover {
		background: var(--ping-bg-color-hover, #f9fafb);
		border-color: var(--ping-border-color-hover, #9ca3af);
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
`;

const SelectContainer = styled.div`
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-sm, 8px);
`;

const SelectLabel = styled.span`
	font-size: var(--ping-font-size-sm, 14px);
	font-weight: var(--ping-font-weight-medium, 500);
	color: var(--ping-color-text-secondary, #6b7280);
`;

const Select = styled.select`
	padding: var(--ping-spacing-sm, 8px) var(--ping-spacing-md, 12px);
	border: 1px solid var(--ping-border-color, #d1d5db);
	border-radius: var(--ping-border-radius, 6px);
	background: var(--ping-bg-color, #ffffff);
	color: var(--ping-color-text-primary, #374151);
	font-size: var(--ping-font-size-sm, 14px);
	font-weight: var(--ping-font-weight-medium, 500);
	cursor: pointer;
	transition: all 0.15s ease-in-out;

	&:hover {
		border-color: var(--ping-border-color-hover, #9ca3af);
	}

	&:focus {
		outline: none;
		border-color: var(--ping-color-primary, #3b82f6);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const EditorContent = styled.div`
	height: 500px;
	position: relative;
`;

const LoadingOverlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(255, 255, 255, 0.9);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
	backdrop-filter: blur(2px);
`;

const LoadingSpinner = styled.div`
	width: 32px;
	height: 32px;
	border: 3px solid var(--ping-border-color, #e5e7eb);
	border-top: 3px solid var(--ping-color-primary, #3b82f6);
	border-radius: 50%;
	animation: spin 1s linear infinite;

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
`;

const LoadingText = styled.div`
	margin-left: var(--ping-spacing-md, 12px);
	color: var(--ping-color-text-primary, #374151);
	font-weight: var(--ping-font-weight-medium, 500);
`;

interface InteractiveCodeEditorProps {
	initialCode: string;
	language: LanguageOption;
	title: string;
	flowSteps: FlowStep[];
	codeByStep: Record<FlowStep, string>;
	onCategoryChange?: (category: CodeCategory, type: CodeType) => void;
	onCodeChange?: (code: string) => void;
}

export const InteractiveCodeEditorV9: React.FC<InteractiveCodeEditorProps> = ({
	initialCode,
	language,
	title,
	flowSteps,
	codeByStep,
	onCategoryChange,
	onCodeChange,
}) => {
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [code, setCode] = useState(initialCode);
	const [theme, setTheme] = useState<'light' | 'vs-dark'>('light');
	const [copied, setCopied] = useState(false);
	const [showResetModal, setShowResetModal] = useState(false);
	const [activeStep, setActiveStep] = useState<FlowStep>('authorization');
	const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(language);
	const [codeUpdated, setCodeUpdated] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<CodeCategory>('frontend');
	const [selectedType, setSelectedType] = useState<CodeType>('ping-sdk-js');

	// Initialize Monaco Editor
	React.useEffect(() => {
		if (containerRef.current && !editorRef.current) {
			// Configure Monaco
			monaco.editor.defineTheme('ping-ui-light', {
				base: 'vs',
				inherit: true,
				rules: [
					{ token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
					{ token: 'keyword', foreground: '3b82f6', fontStyle: 'bold' },
					{ token: 'string', foreground: '10b981' },
					{ token: 'number', foreground: 'f59e0b' },
				],
				colors: {
					'editor.background': '#ffffff',
					'editor.foreground': '#1f2937',
					'editor.lineHighlightBackground': '#f3f4f6',
					'editorCursor.foreground': '#3b82f6',
					'editor.selectionBackground': '#dbeafe',
				},
			});

			editorRef.current = monaco.editor.create(containerRef.current, {
				value: code,
				language: selectedLanguage,
				theme: theme === 'light' ? 'ping-ui-light' : 'vs-dark',
				automaticLayout: true,
				minimap: { enabled: false },
				scrollbar: {
					vertical: 'visible',
					horizontal: 'visible',
				},
				fontSize: 14,
				fontFamily: 'Menlo, Monaco, Consolas, monospace',
				lineHeight: 1.6,
				padding: { top: 16, bottom: 16 },
			});

			// Handle code changes
			editorRef.current.onDidChangeModelContent(() => {
				const newCode = editorRef.current?.getValue() || '';
				setCode(newCode);
				onCodeChange?.(newCode);
			});
		}

		return () => {
			if (editorRef.current) {
				editorRef.current.dispose();
				editorRef.current = null;
			}
		};
	}, []);

	// Update editor when code changes externally
	React.useEffect(() => {
		if (editorRef.current && code !== editorRef.current.getValue()) {
			editorRef.current.setValue(code);
		}
	}, [code]);

	// Update language
	React.useEffect(() => {
		if (editorRef.current) {
			monaco.editor.setModelLanguage(editorRef.current.getModel()!, selectedLanguage);
		}
	}, [selectedLanguage]);

	// Update theme
	React.useEffect(() => {
		if (editorRef.current) {
			editorRef.current.updateOptions({ theme: theme === 'light' ? 'ping-ui-light' : 'vs-dark' });
		}
	}, [theme]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			showFlowSuccess('Code copied to clipboard!');
		} catch (err) {
			console.error('Failed to copy:', err);
			showFlowError('Failed to copy code to clipboard');
		}
	};

	const getFileExtension = (lang: LanguageOption): string => {
		const extensionMap: Record<LanguageOption, string> = {
			javascript: 'js',
			typescript: 'ts',
			python: 'py',
			go: 'go',
			ruby: 'rb',
			perl: 'pl',
			java: 'java',
			csharp: 'cs',
			react: 'tsx',
			angular: 'ts',
			vanilla: 'js',
			'react-native': 'tsx',
			flutter: 'dart',
			swift: 'swift',
			kotlin: 'kt',
			dart: 'dart',
		};
		return extensionMap[lang] || 'txt';
	};

	const handleDownload = () => {
		try {
			const blob = new Blob([code], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			const extension = getFileExtension(selectedLanguage);
			const filename = `mfa-${FLOW_STEP_LABELS[activeStep].toLowerCase().replace(/\s+/g, '-')}.${extension}`;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			showFlowSuccess(`Downloaded ${filename}`);
		} catch (err) {
			console.error('Failed to download:', err);
			showFlowError('Failed to download file');
		}
	};

	const confirmReset = () => {
		setCode(initialCode);
		showFlowSuccess('Code reset to original');
		console.log(
			`[${new Date().toISOString()}] [🧩 UI-NOTIFICATIONS] Code reset to original in InteractiveCodeEditorV9`
		);
	};

	const handleFormat = () => {
		if (editorRef.current) {
			editorRef.current.getAction('editor.action.formatDocument')?.run();
			showFlowSuccess('Code formatted');
		}
	};

	const toggleTheme = () => {
		const newTheme = theme === 'light' ? 'vs-dark' : 'light';
		setTheme(newTheme);
		showFlowSuccess(`Switched to ${newTheme === 'light' ? 'Light' : 'Dark'} theme`);
	};

	const handleStepChange = (step: FlowStep) => {
		setActiveStep(step);
		if (codeByStep?.[step]) {
			setCode(codeByStep[step]);
		}
		showFlowSuccess(`Switched to ${FLOW_STEP_LABELS[step]}`);
	};

	const handleLanguageChange = (lang: LanguageOption) => {
		setSelectedLanguage(lang);
		showFlowSuccess(`Switched to ${lang}`);
	};

	const handleCategoryChange = (category: CodeCategory) => {
		setSelectedCategory(category);
		setCodeUpdated(true);
		// Simulate code generation
		setTimeout(() => {
			setCodeUpdated(false);
			showFlowSuccess(`Generated ${CODE_CATEGORY_LABELS[category]} code`);
		}, 500);
	};

	const handleTypeChange = (type: CodeType) => {
		setSelectedType(type);
		setCodeUpdated(true);
		// Simulate code generation
		setTimeout(() => {
			setCodeUpdated(false);
			showFlowSuccess(`Generated ${CODE_TYPE_LABELS[type]} code`);
		}, 500);
	};

	return (
		<PingUIWrapper className="end-user-nano">
			<EditorContainer>
				<EditorHeader>
					<EditorTitle>{title}</EditorTitle>
					<ControlsContainer>
						<SelectContainer>
							<SelectLabel>Step:</SelectLabel>
							<Select
								value={activeStep}
								onChange={(e) => handleStepChange(e.target.value as FlowStep)}
							>
								{flowSteps.map((step) => (
									<option key={step} value={step}>
										{FLOW_STEP_LABELS[step]}
									</option>
								))}
							</Select>
						</SelectContainer>

						<SelectContainer>
							<SelectLabel>Language:</SelectLabel>
							<Select
								value={selectedLanguage}
								onChange={(e) => handleLanguageChange(e.target.value as LanguageOption)}
							>
								<option value="javascript">JavaScript</option>
								<option value="typescript">TypeScript</option>
								<option value="python">Python</option>
								<option value="java">Java</option>
								<option value="csharp">C#</option>
								<option value="go">Go</option>
								<option value="ruby">Ruby</option>
								<option value="react">React</option>
								<option value="angular">Angular</option>
								<option value="vanilla">Vanilla JS</option>
							</Select>
						</SelectContainer>

						<ControlButton onClick={handleCopy} disabled={copied}>
							<MDIIcon
								icon={copied ? 'FiCheck' : 'FiCopy'}
								ariaLabel={copied ? 'Copied' : 'Copy'}
							/>
							{copied ? 'Copied!' : 'Copy'}
						</ControlButton>

						<ControlButton onClick={handleDownload}>
							<MDIIcon icon="FiDownload" ariaLabel="Download" />
							Download
						</ControlButton>

						<ControlButton onClick={() => setShowResetModal(true)}>
							<MDIIcon icon="FiRefreshCw" ariaLabel="Reset" />
							Reset
						</ControlButton>

						<ControlButton onClick={handleFormat}>
							<MDIIcon icon="FiSettings" ariaLabel="Format" />
							Format
						</ControlButton>

						<ControlButton onClick={toggleTheme}>
							<MDIIcon icon={theme === 'light' ? 'FiMoon' : 'FiSun'} ariaLabel="Toggle theme" />
							{theme === 'light' ? 'Dark' : 'Light'}
						</ControlButton>
					</ControlsContainer>
				</EditorHeader>

				<EditorContent ref={containerRef}>
					{codeUpdated && (
						<LoadingOverlay>
							<LoadingSpinner />
							<LoadingText>Generating code...</LoadingText>
						</LoadingOverlay>
					)}
				</EditorContent>

				{showResetModal && (
					<ConfirmationModal
						title="Reset Code"
						message="Are you sure you want to reset the code to the original version? All changes will be lost."
						onConfirm={confirmReset}
						onCancel={() => setShowResetModal(false)}
					/>
				)}
			</EditorContainer>
		</PingUIWrapper>
	);
};

export default InteractiveCodeEditorV9;
