import Editor from '@monaco-editor/react';
import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import ConfirmationModal from './ConfirmationModal';

export type FlowStep =
	| 'authorization'
	| 'workerToken'
	| 'deviceSelection'
	| 'mfaChallenge'
	| 'mfaVerification'
	| 'deviceRegistration';

export type CodeCategory = 'frontend' | 'backend' | 'mobile';

export type CodeType =
	// Frontend options
	| 'ping-sdk-js'
	| 'rest-api-fetch'
	| 'rest-api-axios'
	| 'react'
	| 'angular'
	| 'vue'
	| 'next-js'
	| 'vanilla-js'
	// Backend options
	| 'ping-sdk-node'
	| 'rest-api-node'
	| 'python-requests'
	| 'python-sdk'
	| 'java-sdk'
	| 'go-http'
	| 'ruby-http'
	| 'csharp-http'
	// Mobile options
	| 'ping-sdk-ios'
	| 'ping-sdk-android'
	| 'react-native'
	| 'flutter'
	| 'swift-native'
	| 'kotlin-native';

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
	| 'kotlin';

const EditorContainer = styled.div`
  background: V9_COLORS.TEXT.WHITE;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const ConfigPanel = styled.div`
  background: #f8f9fa;
  border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  padding: 16px 20px;
`;

const ConfigGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;

const ConfigField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ConfigLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ConfigInput = styled.input`
  padding: 8px 12px;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 6px;
  font-size: 14px;
  font-family: 'SF Mono', Monaco, monospace;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Toolbar = styled.div`
  background: V9_COLORS.TEXT.WHITE;
  border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ToolbarLeft = styled.div`
  display: flex;
  gap: 8px;
`;

const ToolbarRight = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ToolbarButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: ${(props) => (props.$variant === 'primary' ? '#667eea' : '#ffffff')};
  color: ${(props) => (props.$variant === 'primary' ? '#ffffff' : '#1f2937')};
  border: 1px solid ${(props) => (props.$variant === 'primary' ? '#667eea' : '#e5e7eb')};
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${(props) => (props.$variant === 'primary' ? '#5568d3' : '#f9fafb')};
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ThemeToggle = styled.button<{ $isDark: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: ${(props) => (props.$isDark ? '#1e293b' : '#fef3c7')};
  color: ${(props) => (props.$isDark ? '#fbbf24' : '#d97706')};
  border: 1px solid ${(props) => (props.$isDark ? '#334155' : '#fbbf24')};
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const EditorWrapper = styled.div`
  border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const StatusBar = styled.div`
  background: #f8f9fa;
  padding: 8px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
`;

const StatusLeft = styled.div`
  display: flex;
  gap: 16px;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
`;

const StatusBadge = styled.span<{ $type: 'success' | 'warning' | 'info' }>`
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: ${(props) =>
		props.$type === 'success' ? '#ecfdf5' : props.$type === 'warning' ? '#fef3c7' : '#dbeafe'};
  color: ${(props) =>
		props.$type === 'success' ? '#059669' : props.$type === 'warning' ? '#d97706' : '#2563eb'};
`;

const TabsContainer = styled.div`
  background: V9_COLORS.TEXT.WHITE;
  border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  padding: 0 20px;
  display: flex;
  gap: 4px;
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: V9_COLORS.TEXT.GRAY_LIGHTER;
    border-radius: 2px;
  }
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 20px;
  background: ${(props) => (props.$active ? '#667eea' : 'transparent')};
  color: ${(props) => (props.$active ? '#ffffff' : '#6b7280')};
  border: none;
  border-bottom: 3px solid ${(props) => (props.$active ? '#667eea' : 'transparent')};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  position: relative;
  
  &:hover {
    background: ${(props) => (props.$active ? '#667eea' : '#f3f4f6')};
    color: ${(props) => (props.$active ? '#ffffff' : '#1f2937')};
  }
  
  &:active {
    transform: translateY(1px);
  }
`;

const LanguageSelector = styled.select`
  padding: 8px 12px;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  background: V9_COLORS.TEXT.WHITE;
  cursor: pointer;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &:hover {
    border-color: V9_COLORS.TEXT.GRAY_LIGHT;
  }
`;

const LanguageOptGroup = styled.optgroup`
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
`;

const CategoryPanel = styled.div`
  background: V9_COLORS.TEXT.WHITE;
  border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const CategoryLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CategorySelector = styled.select`
  padding: 8px 12px;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  background: V9_COLORS.TEXT.WHITE;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 180px;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &:hover {
    border-color: V9_COLORS.TEXT.GRAY_LIGHT;
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background: V9_COLORS.TEXT.GRAY_LIGHTER;
  margin: 0 4px;
`;

const UpdateIndicator = styled.div<{ $visible: boolean }>`
  display: ${(props) => (props.$visible ? 'flex' : 'none')};
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  animation: ${(props) => (props.$visible ? 'slideIn 0.3s ease-out' : 'none')};
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  svg {
    animation: ${(props) => (props.$visible ? 'spin 0.6s ease-in-out' : 'none')};
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const SpinnerOverlay = styled.div<{ $visible: boolean }>`
  display: ${(props) => (props.$visible ? 'flex' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  align-items: center;
  justify-content: center;
  animation: ${(props) => (props.$visible ? 'fadeIn 0.2s ease-out' : 'none')};
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const SpinnerModal = styled.div`
  background: white;
  border-radius: 16px;
  padding: 40px 60px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  animation: scaleIn 0.3s ease-out;
  
  @keyframes scaleIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const Spinner = styled.div`
  width: 60px;
  height: 60px;
  border: 5px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: rotate 0.8s linear infinite;
  
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const SpinnerText = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  text-align: center;
`;

const SpinnerSubtext = styled.div`
  font-size: 14px;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  text-align: center;
`;

interface InteractiveCodeEditorProps {
	initialCode: string;
	language?: LanguageOption;
	title?: string;
	onCodeChange?: (code: string) => void;
	flowSteps?: FlowStep[];
	codeByStep?: Record<FlowStep, string>;
	onCategoryChange?: (category: CodeCategory, type: CodeType) => void;
}

const FLOW_STEP_LABELS: Record<FlowStep, string> = {
	authorization: '1. Authorization',
	workerToken: '2. Worker Token',
	deviceSelection: '3. Device Selection',
	mfaChallenge: '4. MFA Challenge',
	mfaVerification: '5. MFA Verification',
	deviceRegistration: '6. Device Registration',
};

const CODE_CATEGORY_LABELS: Record<CodeCategory, string> = {
	frontend: 'Frontend',
	backend: 'Backend',
	mobile: 'Mobile',
};

const CODE_TYPE_LABELS: Record<CodeType, string> = {
	// Frontend
	'ping-sdk-js': 'Ping SDK (JavaScript)',
	'rest-api-fetch': 'REST API (Fetch)',
	'rest-api-axios': 'REST API (Axios)',
	react: 'React',
	angular: 'Angular',
	vue: 'Vue.js',
	'next-js': 'Next.js',
	'vanilla-js': 'Vanilla JavaScript',
	// Backend
	'ping-sdk-node': 'Ping SDK (Node.js)',
	'rest-api-node': 'REST API (Node.js)',
	'python-requests': 'Python (Requests)',
	'python-sdk': 'Ping SDK (Python)',
	'java-sdk': 'Ping SDK (Java)',
	'go-http': 'Go (HTTP)',
	'ruby-http': 'Ruby (HTTP)',
	'csharp-http': 'C# (HTTP)',
	// Mobile
	'ping-sdk-ios': 'Ping SDK (iOS)',
	'ping-sdk-android': 'Ping SDK (Android)',
	'react-native': 'React Native',
	flutter: 'Flutter',
	'swift-native': 'Swift (Native)',
	'kotlin-native': 'Kotlin (Native)',
};

const CODE_TYPES_BY_CATEGORY: Record<CodeCategory, CodeType[]> = {
	frontend: [
		'ping-sdk-js',
		'rest-api-fetch',
		'rest-api-axios',
		'react',
		'angular',
		'vue',
		'next-js',
		'vanilla-js',
	],
	backend: [
		'ping-sdk-node',
		'rest-api-node',
		'python-requests',
		'python-sdk',
		'java-sdk',
		'go-http',
		'ruby-http',
		'csharp-http',
	],
	mobile: [
		'ping-sdk-ios',
		'ping-sdk-android',
		'react-native',
		'flutter',
		'swift-native',
		'kotlin-native',
	],
};

const getMonacoLanguage = (lang: LanguageOption): string => {
	const languageMap: Record<LanguageOption, string> = {
		javascript: 'javascript',
		typescript: 'typescript',
		python: 'python',
		go: 'go',
		ruby: 'ruby',
		perl: 'perl',
		java: 'java',
		csharp: 'csharp',
		react: 'typescript',
		angular: 'typescript',
		vanilla: 'javascript',
		'react-native': 'typescript',
		flutter: 'dart',
		swift: 'swift',
		kotlin: 'kotlin',
	};
	return languageMap[lang] || 'typescript';
};

export const InteractiveCodeEditor: React.FC<InteractiveCodeEditorProps> = ({
	initialCode,
	language = 'typescript',
	title = 'Code Editor',
	onCodeChange,
	flowSteps = [
		'authorization',
		'workerToken',
		'deviceSelection',
		'mfaChallenge',
		'mfaVerification',
		'deviceRegistration',
	],
	codeByStep,
	onCategoryChange,
}) => {
	const [activeStep, setActiveStep] = useState<FlowStep>(flowSteps[0]);
	const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(language);
	const [selectedCategory, setSelectedCategory] = useState<CodeCategory>('frontend');
	const [selectedCodeType, setSelectedCodeType] = useState<CodeType>('ping-sdk-js');
	const [code, setCode] = useState(initialCode);
	const [theme, setTheme] = useState<'light' | 'vs-dark'>('light');
	const [copied, setCopied] = useState(false);
	const [codeUpdated, setCodeUpdated] = useState(false);
	const [showResetModal, setShowResetModal] = useState(false);
	const [config, setConfig] = useState({
		environmentId: 'YOUR_ENVIRONMENT_ID',
		clientId: 'YOUR_CLIENT_ID',
		redirectUri: 'https://your-app.com/callback',
		userId: 'USER_ID',
	});
	const editorRef = useRef<any>(null);

	const handleEditorDidMount = (editor: any) => {
		editorRef.current = editor;
	};

	const handleCodeChange = (value: string | undefined) => {
		if (value !== undefined) {
			setCode(value);
			onCodeChange?.(value);
		}
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			modernMessaging.showFooterMessage({
				type: 'status',
				message: 'Code copied to clipboard!',
				duration: 4000,
			});
		} catch (err) {
			log.error('InteractiveCodeEditor', 'Failed to copy:', undefined, err as Error);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to copy code to clipboard',
				dismissible: true,
			});
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
			modernMessaging.showFooterMessage({
				type: 'status',
				message: `Downloaded ${filename}`,
				duration: 4000,
			});
		} catch (err) {
			log.error('InteractiveCodeEditor', 'Failed to download:', undefined, err as Error);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to download file',
				dismissible: true,
			});
		}
	};

	const handleReset = () => {
		setShowResetModal(true);
	};

	const confirmReset = () => {
		setCode(initialCode);
		modernMessaging.showFooterMessage({
			type: 'status',
			message: 'Code reset to original',
			duration: 4000,
		});
		console.log(
			`[${new Date().toISOString()}] [🧩 UI-NOTIFICATIONS] Code reset to original in InteractiveCodeEditor`
		);
		setShowResetModal(false);
	};

	const handleFormat = () => {
		if (editorRef.current) {
			editorRef.current.getAction('editor.action.formatDocument').run();
			modernMessaging.showFooterMessage({
				type: 'status',
				message: 'Code formatted',
				duration: 4000,
			});
		}
	};

	const toggleTheme = () => {
		const newTheme = theme === 'light' ? 'vs-dark' : 'light';
		setTheme(newTheme);
		modernMessaging.showFooterMessage({
			type: 'status',
			message: `Switched to ${newTheme === 'light' ? 'Light' : 'Dark'} theme`,
			duration: 4000,
		});
	};

	const handleConfigChange = (field: keyof typeof config, value: string) => {
		setConfig((prev) => ({ ...prev, [field]: value }));

		// Update code with new config values
		let updatedCode = code;
		Object.entries({ ...config, [field]: value }).forEach(([key, val]) => {
			const placeholder =
				key === 'environmentId'
					? 'YOUR_ENVIRONMENT_ID'
					: key === 'clientId'
						? 'YOUR_CLIENT_ID'
						: key === 'redirectUri'
							? 'https://your-app.com/callback'
							: 'USER_ID';
			updatedCode = updatedCode.replace(new RegExp(placeholder, 'g'), val);
		});
		setCode(updatedCode);
	};

	const handleStepChange = (step: FlowStep) => {
		setActiveStep(step);
		if (codeByStep?.[step]) {
			setCode(codeByStep[step]);
		}
		modernMessaging.showFooterMessage({
			type: 'status',
			message: `Switched to ${FLOW_STEP_LABELS[step]}`,
			duration: 4000,
		});
	};

	const handleLanguageChange = (lang: LanguageOption) => {
		setSelectedLanguage(lang);
		modernMessaging.showFooterMessage({
			type: 'status',
			message: `Switched to ${lang}`,
			duration: 4000,
		});
	};

	const handleCategoryChange = (category: CodeCategory) => {
		// Show spinner modal
		setCodeUpdated(true);

		// Simulate code generation delay for better UX
		setTimeout(() => {
			setSelectedCategory(category);
			// Reset to first code type in new category
			const firstType = CODE_TYPES_BY_CATEGORY[category][0];
			setSelectedCodeType(firstType);
			onCategoryChange?.(category, firstType);

			// Hide spinner after generation
			setTimeout(() => {
				setCodeUpdated(false);
				modernMessaging.showFooterMessage({
					type: 'status',
					message: `Generated ${CODE_CATEGORY_LABELS[category]} code`,
					duration: 4000,
				});
			}, 300);
		}, 500);
	};

	const handleCodeTypeChange = (type: CodeType) => {
		// Show spinner modal
		setCodeUpdated(true);

		// Simulate code generation delay for better UX
		setTimeout(() => {
			setSelectedCodeType(type);
			onCategoryChange?.(selectedCategory, type);

			// Hide spinner after generation
			setTimeout(() => {
				setCodeUpdated(false);
				modernMessaging.showFooterMessage({
					type: 'status',
					message: `Generated ${CODE_TYPE_LABELS[type]} code`,
					duration: 4000,
				});
			}, 300);
		}, 500);
	};

	return (
		<>
			<EditorContainer>
				<TabsContainer>
					{flowSteps.map((step) => (
						<Tab key={step} $active={activeStep === step} onClick={() => handleStepChange(step)}>
							{FLOW_STEP_LABELS[step]}
						</Tab>
					))}
				</TabsContainer>

				<CategoryPanel>
					<CategoryLabel>Category:</CategoryLabel>
					<CategorySelector
						value={selectedCategory}
						onChange={(e) => handleCategoryChange(e.target.value as CodeCategory)}
					>
						{Object.entries(CODE_CATEGORY_LABELS).map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</CategorySelector>

					<Divider />

					<CategoryLabel>Code Type:</CategoryLabel>
					<CategorySelector
						value={selectedCodeType}
						onChange={(e) => handleCodeTypeChange(e.target.value as CodeType)}
					>
						{CODE_TYPES_BY_CATEGORY[selectedCategory].map((type) => (
							<option key={type} value={type}>
								{CODE_TYPE_LABELS[type]}
							</option>
						))}
					</CategorySelector>

					<Divider />

					<UpdateIndicator $visible={codeUpdated}>
						<span style={{ fontSize: '14px' }}>🔄</span>
						Code Updated
					</UpdateIndicator>

					<Divider />

					<CategoryLabel>Language:</CategoryLabel>
					<LanguageSelector
						value={selectedLanguage}
						onChange={(e) => handleLanguageChange(e.target.value as LanguageOption)}
					>
						<LanguageOptGroup label="Web">
							<option value="javascript">JavaScript</option>
							<option value="typescript">TypeScript</option>
							<option value="react">React</option>
							<option value="angular">Angular</option>
							<option value="vanilla">Vanilla JS</option>
						</LanguageOptGroup>
						<LanguageOptGroup label="Mobile">
							<option value="react-native">React Native</option>
							<option value="flutter">Flutter/Dart</option>
							<option value="swift">Swift (iOS)</option>
							<option value="kotlin">Kotlin (Android)</option>
						</LanguageOptGroup>
						<LanguageOptGroup label="Backend">
							<option value="python">Python</option>
							<option value="go">Go</option>
							<option value="ruby">Ruby</option>
							<option value="java">Java</option>
							<option value="csharp">C#</option>
							<option value="perl">Perl</option>
						</LanguageOptGroup>
					</LanguageSelector>
				</CategoryPanel>

				<ConfigPanel>
					<ConfigGrid>
						<ConfigField>
							<ConfigLabel>Environment ID</ConfigLabel>
							<ConfigInput
								type="text"
								value={config.environmentId}
								onChange={(e) => handleConfigChange('environmentId', e.target.value)}
								placeholder="Enter your environment ID"
							/>
						</ConfigField>
						<ConfigField>
							<ConfigLabel>Client ID</ConfigLabel>
							<ConfigInput
								type="text"
								value={config.clientId}
								onChange={(e) => handleConfigChange('clientId', e.target.value)}
								placeholder="Enter your client ID"
							/>
						</ConfigField>
						<ConfigField>
							<ConfigLabel>Redirect URI</ConfigLabel>
							<ConfigInput
								type="text"
								value={config.redirectUri}
								onChange={(e) => handleConfigChange('redirectUri', e.target.value)}
								placeholder="Enter your redirect URI"
							/>
						</ConfigField>
						<ConfigField>
							<ConfigLabel>User ID</ConfigLabel>
							<ConfigInput
								type="text"
								value={config.userId}
								onChange={(e) => handleConfigChange('userId', e.target.value)}
								placeholder="Enter user ID"
							/>
						</ConfigField>
					</ConfigGrid>
				</ConfigPanel>

				<Toolbar>
					<ToolbarLeft>
						<ToolbarButton $variant="primary" onClick={handleCopy}>
							{copied ? (
								<span style={{ fontSize: '14px' }}>✅</span>
							) : (
								<span style={{ fontSize: '14px' }}>📋</span>
							)}
							{copied ? 'Copied!' : 'Copy Code'}
						</ToolbarButton>
						<ToolbarButton onClick={handleDownload}>
							<span style={{ fontSize: '14px' }}>📥</span>
							Download
						</ToolbarButton>
						<ToolbarButton onClick={handleFormat}>
							<span style={{ fontSize: '14px' }}>❓</span>
							Format
						</ToolbarButton>
						<ToolbarButton onClick={handleReset}>
							<span style={{ fontSize: '14px' }}>🔄</span>
							Reset
						</ToolbarButton>
					</ToolbarLeft>
					<ToolbarRight>
						<ThemeToggle $isDark={theme === 'vs-dark'} onClick={toggleTheme}>
							{theme === 'vs-dark' ? (
								<span style={{ fontSize: '14px' }}>☀️</span>
							) : (
								<span style={{ fontSize: '14px' }}>🌙</span>
							)}
							{theme === 'vs-dark' ? 'Light' : 'Dark'}
						</ThemeToggle>
					</ToolbarRight>
				</Toolbar>

				<EditorWrapper>
					<Editor
						height="500px"
						language={getMonacoLanguage(selectedLanguage)}
						value={code}
						theme={theme}
						onChange={handleCodeChange}
						onMount={handleEditorDidMount}
						options={{
							minimap: { enabled: true },
							fontSize: 14,
							lineNumbers: 'on',
							roundedSelection: true,
							scrollBeyondLastLine: false,
							automaticLayout: true,
							tabSize: 2,
							wordWrap: 'on',
							formatOnPaste: true,
							formatOnType: true,
						}}
					/>
				</EditorWrapper>

				<StatusBar>
					<StatusLeft>
						<StatusItem>
							<StatusBadge $type="success">{CODE_CATEGORY_LABELS[selectedCategory]}</StatusBadge>
						</StatusItem>
						<StatusItem>
							<StatusBadge $type="warning">{CODE_TYPE_LABELS[selectedCodeType]}</StatusBadge>
						</StatusItem>
						<StatusItem>
							<StatusBadge $type="info">{FLOW_STEP_LABELS[activeStep]}</StatusBadge>
						</StatusItem>
						<StatusItem>Lines: {code.split('\n').length}</StatusItem>
						<StatusItem>Characters: {code.length}</StatusItem>
					</StatusLeft>
					<StatusItem>
						<StatusBadge $type="info">Ready</StatusBadge>
					</StatusItem>
				</StatusBar>
			</EditorContainer>

			{/* Spinner Modal Overlay */}
			<SpinnerOverlay $visible={codeUpdated}>
				<SpinnerModal>
					<Spinner />
					<SpinnerText>Generating Code...</SpinnerText>
					<SpinnerSubtext>
						Creating production-ready code for {CODE_TYPE_LABELS[selectedCodeType]}
					</SpinnerSubtext>
				</SpinnerModal>
			</SpinnerOverlay>

			{/* Reset Confirmation Modal */}
			<ConfirmationModal
				isOpen={showResetModal}
				onClose={() => setShowResetModal(false)}
				onConfirm={confirmReset}
				title="Reset Code"
				message="Reset code to original? Your changes will be lost."
				confirmText="Reset"
				cancelText="Cancel"
				variant="danger"
			/>
		</>
	);
};

export default InteractiveCodeEditor;
