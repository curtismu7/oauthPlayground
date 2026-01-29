// src/pages/flows/SAMLServiceProviderFlowV1.tsx
// SAML 2.0 Service Provider Flow with Dynamic ACS URL Support
// Demonstrates PingOne's new "Always accept ACS URL in signed SAML 2.0 AuthnRequest" feature

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiCopy,
	FiGlobe,
	FiInfo,
	FiPackage,
	FiRefreshCw,
	FiSave,
	FiSend,
	FiSettings,
	FiShield,
} from 'react-icons/fi';
import styled from 'styled-components';
import { usePageScroll } from '../../hooks/usePageScroll';
import { useSamlSpFlowController } from '../../hooks/useSamlSpFlowController';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { FlowCompletionService } from '../../services/flowCompletionService';
import { FlowHeader } from '../../services/flowHeaderService';
import { samlService as SAMLService } from '../../services/samlService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

// Styled Components
const Container = styled.div`
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
`;

const ContentWrapper = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const SectionDivider = styled.div`
	height: 1px;
	background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
	margin: 2rem 0;
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'error' }>`
	display: flex;
	gap: 1rem;
	padding: 1.5rem;
	background: ${(props) => {
		switch (props.$variant) {
			case 'warning':
				return '#fef3c7';
			case 'success':
				return '#f0fdf4';
			case 'error':
				return '#fef2f2';
			default:
				return '#eff6ff';
		}
	}};
	border: 1px solid ${(props) => {
		switch (props.$variant) {
			case 'warning':
				return '#fbbf24';
			case 'success':
				return '#bbf7d0';
			case 'error':
				return '#fca5a5';
			default:
				return '#bfdbfe';
		}
	}};
	border-radius: 0.75rem;
	margin: 1.5rem 0;
	font-size: 0.875rem;
	line-height: 1.6;
	color: ${(props) => {
		switch (props.$variant) {
			case 'warning':
				return '#78350f';
			case 'success':
				return '#065f46';
			case 'error':
				return '#991b1b';
			default:
				return '#1e40af';
		}
	}};
`;

const InfoTitle = styled.h3`
	font-size: 1rem;
	font-weight: 700;
	margin: 0 0 0.75rem 0;
	color: inherit;
`;

const InfoText = styled.div`
	margin-bottom: 0.75rem;

	&:last-child {
		margin-bottom: 0;
	}
`;

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	transition: border-color 0.2s ease-in-out;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const TextArea = styled.textarea`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-family: monospace;
	min-height: 120px;
	transition: border-color 0.2s ease-in-out;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const CheckboxGroup = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 1rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	margin: 1rem 0;
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
	width: 1.25rem;
	height: 1.25rem;
	cursor: pointer;
`;

const CheckboxLabel = styled.label`
	font-size: 0.875rem;
	color: #374151;
	cursor: pointer;
	line-height: 1.4;
`;

const Helper = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	margin-top: 0.5rem;
	line-height: 1.4;
`;

const TooltipIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-left: 0.375rem;
	color: #2563eb;
	cursor: help;
	transition: color 0.2s ease;

	&:hover {
		color: #1d4ed8;
	}
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease-in-out;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;

	${(props) =>
		props.$variant === 'primary'
			? `
		background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
		color: white;
		border: none;

		&:hover:not(:disabled) {
			background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
		}
	`
			: props.$variant === 'success'
				? `
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		border: none;

		&:hover:not(:disabled) {
			background: linear-gradient(135deg, #059669 0%, #047857 100%);
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
		}
	`
				: `
		background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
		color: white;
		border: none;

		&:hover:not(:disabled) {
			background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
		}
	`}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const GeneratedContentBox = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 2fr;
	gap: 0.75rem;
	align-items: center;
`;

const ParameterLabel = styled.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
`;

const ParameterValue = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	color: #064e3b;
	word-break: break-all;
	background-color: #f0fdf4; /* Light green for generated content */
	border: 1px solid #16a34a;
	padding: 0.5rem;
	border-radius: 0.25rem;
`;

// Types
interface SAMLAuthnRequest {
	issuer: string;
	nameIdPolicy?: {
		format?: string;
		allowCreate?: boolean;
	};
	requestedAuthnContext?: {
		comparison?: string;
		authnContextClassRefs?: string[];
	};
	assertionConsumerServiceURL?: string;
	assertionConsumerServiceIndex?: number;
	attributeConsumingServiceIndex?: number;
	forceAuthn?: boolean;
	isPassive?: boolean;
	protocolBinding?: string;
	scoping?: any;
	extensions?: any;
}

// Main Component
const completionConfig = {
	flowName: 'SAML Service Provider (Dynamic ACS)',
	flowDescription:
		'You configured a SAML SP application and processed an AuthnRequest with dynamic ACS URL support.',
	completedSteps: [
		{ completed: true, description: 'Configured SAML SP application with dynamic ACS URL setting' },
		{ completed: true, description: 'Processed signed SAML AuthnRequest with embedded ACS URL' },
		{ completed: true, description: 'Validated and accepted dynamic ACS URL from signed request' },
	],
	nextSteps: [
		'Implement SAML Response generation with appropriate NameID and attributes',
		'Configure SAML metadata exchange with Identity Provider',
		'Test end-to-end SAML authentication flow',
	],
};

const SAMLServiceProviderFlowV1: React.FC = () => {
	// Scroll management
	usePageScroll();

	// State management
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
		config: false,
		pingoneSetup: false,
		authnRequest: false,
		validation: false,
		response: false,
		completion: false,
	});

	const controller = useSamlSpFlowController();
	const {
		config: samlConfig,
		updateConfig,
		saveConfig,
		isSaving,
		hasSavedConfig,
		lastSavedAt,
		pingOneAdmin,
		setPingOneAdmin,
		savePingOneAdmin,
		syncDynamicAcsWithPingOne,
		fetchPingOneApplication,
	} = controller;

	const [pingOneAppIdInput, setPingOneAppIdInput] = useState(samlConfig.pingOneApplicationId ?? '');
	const [isSavingAdmin, setIsSavingAdmin] = useState(false);
	const [isFetchingPingOneApp, setIsFetchingPingOneApp] = useState(false);
	const [isSyncingPingOne, setIsSyncingPingOne] = useState(false);

	useEffect(() => {
		setPingOneAppIdInput(samlConfig.pingOneApplicationId ?? '');
	}, [samlConfig.pingOneApplicationId]);

	const pingOneAdminCredentials = {
		environmentId: pingOneAdmin?.environmentId ?? '',
		clientId: pingOneAdmin?.clientId ?? '',
		clientSecret: pingOneAdmin?.clientSecret ?? '',
	};

	const isAdminConfigured = Boolean(
		pingOneAdminCredentials.environmentId &&
			pingOneAdminCredentials.clientId &&
			pingOneAdminCredentials.clientSecret
	);

	// AuthnRequest processing
	const [authnRequestXml, setAuthnRequestXml] = useState('');
	const [parsedAuthnRequest, setParsedAuthnRequest] = useState<SAMLAuthnRequest | null>(null);
	const [validationResult, setValidationResult] = useState<any>(null);
	const [samlResponse, setSamlResponse] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);

	// Toggle section handler
	const toggleSection = useCallback((section: string) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	// Copy to clipboard
	const copyToClipboard = useCallback(async (text: string, label: string) => {
		if (!text) {
			v4ToastManager.showWarning(`No ${label} available to copy.`);
			return;
		}
		try {
			await navigator.clipboard.writeText(text);
			v4ToastManager.showSuccess(`${label} copied to clipboard.`);
		} catch (error) {
			console.error('[SAML SP] Failed to copy to clipboard:', error);
			v4ToastManager.showError(`Unable to copy ${label}.`);
		}
	}, []);

	const handleSaveConfiguration = useCallback(() => {
		saveConfig({ showToast: true });
	}, [saveConfig]);

	const handlePingOneAdminChange = useCallback(
		(field: 'environmentId' | 'clientId' | 'clientSecret', value: string) => {
			setPingOneAdmin({ [field]: value });
		},
		[setPingOneAdmin]
	);

	const handleSavePingOneAdmin = useCallback(async () => {
		if (
			!pingOneAdminCredentials.environmentId ||
			!pingOneAdminCredentials.clientId ||
			!pingOneAdminCredentials.clientSecret
		) {
			v4ToastManager.showWarning(
				'Provide environment ID, client ID, and client secret before saving.'
			);
			return;
		}

		setIsSavingAdmin(true);
		try {
			const success = await savePingOneAdmin({ showToast: false });
			if (success) {
				v4ToastManager.showSuccess('PingOne admin credentials saved locally.');
			} else {
				v4ToastManager.showError('Unable to save PingOne admin credentials.');
			}
		} catch (error) {
			console.error('[SAML SP] Failed to save PingOne admin credentials', error);
			v4ToastManager.showError('Failed to save PingOne admin credentials.');
		} finally {
			setIsSavingAdmin(false);
		}
	}, [pingOneAdminCredentials, savePingOneAdmin]);

	const handleFetchPingOneApplication = useCallback(async () => {
		if (!isAdminConfigured) {
			v4ToastManager.showWarning('Configure PingOne admin credentials first.');
			return;
		}

		if (!pingOneAppIdInput.trim()) {
			v4ToastManager.showWarning('Enter a PingOne application ID first.');
			return;
		}

		setIsFetchingPingOneApp(true);
		try {
			const app = await fetchPingOneApplication(pingOneAppIdInput.trim());
			if (app) {
				v4ToastManager.showSuccess('Loaded PingOne application details.');
				updateConfig((prev) => ({
					...prev,
					pingOneApplicationId: app.id,
					pingOneApplicationName: app.name,
				}));
			}
		} catch (error) {
			console.error('[SAML SP] Failed to fetch PingOne application', error);
			v4ToastManager.showError('Unable to load PingOne application details.');
		} finally {
			setIsFetchingPingOneApp(false);
		}
	}, [fetchPingOneApplication, pingOneAppIdInput, updateConfig, isAdminConfigured]);

	const handleSyncDynamicAcs = useCallback(async () => {
		if (!pingOneAppIdInput.trim()) {
			v4ToastManager.showWarning('Enter a PingOne application ID first.');
			return;
		}

		setIsSyncingPingOne(true);
		try {
			const syncPayload: {
				applicationId: string;
				allowOverride: boolean;
				signingCertificate?: string;
			} = {
				applicationId: pingOneAppIdInput.trim(),
				allowOverride: samlConfig.enableAlwaysAcceptAcsUrlInSignedAuthnRequest,
			};

			if (samlConfig.signingCertificate) {
				syncPayload.signingCertificate = samlConfig.signingCertificate;
			}

			const app = await syncDynamicAcsWithPingOne(syncPayload);
			if (app) {
				v4ToastManager.showSuccess('PingOne application updated successfully.');
				updateConfig((prev) => ({
					...prev,
					pingOneApplicationId: app.id,
					pingOneApplicationName: app.name,
				}));
			} else {
				v4ToastManager.showError('Failed to update PingOne application.');
			}
		} catch (error) {
			console.error('[SAML SP] Failed to sync PingOne dynamic ACS toggle', error);
			v4ToastManager.showError('Unable to update PingOne application.');
		} finally {
			setIsSyncingPingOne(false);
		}
	}, [
		pingOneAppIdInput,
		samlConfig.enableAlwaysAcceptAcsUrlInSignedAuthnRequest,
		syncDynamicAcsWithPingOne,
		updateConfig,
		samlConfig.signingCertificate,
	]);

	// Generate sample AuthnRequest with dynamic ACS URL
	const generateSampleAuthnRequest = useCallback(() => {
		const dynamicAcsUrl = 'https://dynamic-sp.example.com/saml/acs/dynamic';
		const sampleAuthnRequest = SAMLService.generateSampleAuthnRequest({
			issuer: 'https://idp.example.com/metadata',
			acsUrl: dynamicAcsUrl,
			spEntityId: samlConfig.entityId,
			nameIdPolicyFormat: samlConfig.nameIdFormat,
			forceAuthn: false,
			isPassive: false,
		});

		setAuthnRequestXml(sampleAuthnRequest);
		v4ToastManager.showSuccess('Sample AuthnRequest generated with dynamic ACS URL');
	}, [samlConfig.entityId, samlConfig.nameIdFormat]);

	// Process AuthnRequest
	const processAuthnRequest = useCallback(async () => {
		if (!authnRequestXml.trim()) {
			v4ToastManager.showWarning('Please provide an AuthnRequest XML first');
			return;
		}

		setIsProcessing(true);
		try {
			const result = await SAMLService.processAuthnRequest(authnRequestXml, samlConfig);

			setParsedAuthnRequest(result.parsedRequest);
			setValidationResult(result.validation);

			if (result.validation.isValid) {
				v4ToastManager.showSuccess('AuthnRequest processed and validated successfully!');
			} else {
				v4ToastManager.showError('AuthnRequest validation failed');
			}
		} catch (error) {
			console.error('[SAML SP] Error processing AuthnRequest:', error);
			v4ToastManager.showError('Failed to process AuthnRequest');
			setValidationResult({
				isValid: false,
				errors: [error instanceof Error ? error.message : 'Unknown error'],
			});
		} finally {
			setIsProcessing(false);
		}
	}, [authnRequestXml, samlConfig]);

	// Generate SAML Response
	const generateSamlResponse = useCallback(() => {
		if (!parsedAuthnRequest || !validationResult?.isValid) {
			v4ToastManager.showWarning('Please process and validate an AuthnRequest first');
			return;
		}

		try {
			const response = SAMLService.generateSamlResponse({
				authnRequest: parsedAuthnRequest,
				spConfig: samlConfig,
				userAttributes: {
					email: 'user@example.com',
					firstName: 'John',
					lastName: 'Doe',
					groups: ['users', 'admins'],
				},
			});

			setSamlResponse(response);
			v4ToastManager.showSuccess('SAML Response generated successfully!');
		} catch (error) {
			console.error('[SAML SP] Error generating SAML Response:', error);
			v4ToastManager.showError('Failed to generate SAML Response');
		}
	}, [parsedAuthnRequest, validationResult, samlConfig]);

	// Step content renderers
	const renderConfiguration = () => (
		<>
			<CollapsibleHeader
				title="SAML SP Configuration"
				icon={<FiSettings />}
				defaultCollapsed={collapsedSections.config}
				showArrow={true}
			>
				<InfoBox $variant="info">
					<FiInfo size={20} />
					<div>
						<InfoTitle>SAML 2.0 Service Provider Configuration</InfoTitle>
						<InfoText>
							Configure your SAML SP application settings. The new PingOne feature allows accepting
							ACS URLs dynamically from signed AuthnRequests.
						</InfoText>
					</div>
				</InfoBox>

				<FormGroup>
					<Label>Entity ID (SP Entity ID)</Label>
					<Input
						type="url"
						value={samlConfig.entityId}
						onChange={(e) => updateConfig((prev) => ({ ...prev, entityId: e.target.value }))}
						placeholder="https://sp.example.com/metadata"
					/>
					<Helper>Unique identifier for your SAML SP application</Helper>
				</FormGroup>

				<FormGroup>
					<Label>Assertion Consumer Service URLs (Fixed)</Label>
					<TextArea
						value={samlConfig.acsUrls.join('\n')}
						onChange={(e) =>
							updateConfig((prev) => ({
								...prev,
								acsUrls: e.target.value
									.split('\n')
									.map((url) => url.trim())
									.filter(Boolean),
							}))
						}
						placeholder="https://sp.example.com/saml/acs\nhttps://sp.example.com/saml/acs/backup"
					/>
					<Helper>One URL per line. These are your configured ACS URLs.</Helper>
				</FormGroup>

				<FormGroup>
					<Label>Single Sign-On URL</Label>
					<Input
						type="url"
						value={samlConfig.ssoUrl}
						onChange={(e) => updateConfig((prev) => ({ ...prev, ssoUrl: e.target.value }))}
						placeholder="https://sp.example.com/saml/sso"
					/>
					<Helper>URL where users are redirected for SSO initiation</Helper>
				</FormGroup>

				<FormGroup>
					<Label>Name ID Format</Label>
					<Input
						type="text"
						value={samlConfig.nameIdFormat}
						onChange={(e) => updateConfig((prev) => ({ ...prev, nameIdFormat: e.target.value }))}
						placeholder="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
					/>
					<Helper>SAML Name ID format to request from IdP</Helper>
				</FormGroup>

				<CheckboxGroup>
					<Checkbox
						id="enableDynamicAcs"
						checked={samlConfig.enableAlwaysAcceptAcsUrlInSignedAuthnRequest}
						onChange={(e) =>
							updateConfig((prev) => ({
								...prev,
								enableAlwaysAcceptAcsUrlInSignedAuthnRequest: e.target.checked,
							}))
						}
					/>
					<div>
						<CheckboxLabel htmlFor="enableDynamicAcs">
							<strong>Always accept ACS URL in signed SAML 2.0 AuthnRequest</strong>
							<TooltipIcon title="PingOne only honors the embedded ACS URL when this toggle is on and the AuthnRequest signature matches the configured IdP certificate.">
								<FiInfo size={16} />
							</TooltipIcon>
						</CheckboxLabel>
						<Helper style={{ marginTop: '0.25rem' }}>
							When enabled, the SP will accept ACS URLs specified in signed AuthnRequests, even if
							they don't match the configured ACS URLs. This is the new PingOne feature.
						</Helper>
					</div>
				</CheckboxGroup>

				<InfoBox $variant="warning" style={{ marginTop: '1.5rem' }}>
					<FiAlertTriangle size={20} />
					<div>
						<InfoTitle>PingOne configuration checklist</InfoTitle>
						<InfoText>
							Make sure these settings are in place before testing dynamic ACS URLs:
						</InfoText>
						<ol style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', color: '#374151' }}>
							<li>
								Enable <strong>Always accept ACS URL in signed AuthnRequest</strong> in the PingOne
								app.
							</li>
							<li>
								Upload the IdP signing certificate so PingOne can verify AuthnRequest signatures.
							</li>
							<li>Keep at least one static ACS URL configured for fallback and metadata.</li>
						</ol>
					</div>
				</InfoBox>

				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '1rem',
						flexWrap: 'wrap',
						marginTop: '1rem',
					}}
				>
					<Button onClick={handleSaveConfiguration} $variant="primary" disabled={isSaving}>
						{isSaving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
						{isSaving ? 'Saving...' : 'Save Configuration'}
					</Button>
					{hasSavedConfig && lastSavedAt && (
						<Helper style={{ marginTop: 0 }}>
							Last saved {new Date(lastSavedAt).toLocaleString()}
						</Helper>
					)}
				</div>
			</CollapsibleHeader>
		</>
	);

	const renderPingOneSetup = () => (
		<CollapsibleHeader
			title="PingOne Console Setup"
			icon={<FiShield />}
			defaultCollapsed={collapsedSections.pingoneSetup}
			showArrow={true}
		>
			<InfoBox $variant="info">
				<FiInfo size={20} />
				<div>
					<InfoTitle>Sync with PingOne SAML Application</InfoTitle>
					<InfoText>
						Use your PingOne admin credentials to load or update the SAML application that should
						always accept dynamic ACS URLs in signed AuthnRequests.
					</InfoText>
				</div>
			</InfoBox>

			<FormGroup>
				<Label>PingOne Environment ID</Label>
				<Input
					type="text"
					value={pingOneAdminCredentials.environmentId}
					onChange={(event) => handlePingOneAdminChange('environmentId', event.target.value)}
					placeholder="b9817c16-9910-4415-b67e-4ac687da74d9"
				/>
				<Helper>Required to call PingOne Admin APIs.</Helper>
			</FormGroup>

			<FormGroup>
				<Label>PingOne Admin Client ID</Label>
				<Input
					type="text"
					value={pingOneAdminCredentials.clientId}
					onChange={(event) => handlePingOneAdminChange('clientId', event.target.value)}
					placeholder="your-admin-client-id"
				/>
				<Helper>Client ID from your PingOne admin worker application.</Helper>
			</FormGroup>

			<FormGroup>
				<Label>PingOne Admin Client Secret</Label>
				<Input
					type="password"
					value={pingOneAdminCredentials.clientSecret}
					onChange={(event) => handlePingOneAdminChange('clientSecret', event.target.value)}
					placeholder="********"
				/>
				<Helper>The client secret is stored locally for this demo only.</Helper>
			</FormGroup>

			<Button onClick={handleSavePingOneAdmin} $variant="primary" disabled={isSavingAdmin}>
				{isSavingAdmin ? (
					<>
						<FiRefreshCw className="rotate" /> Saving…
					</>
				) : (
					<>
						<FiSave /> Save Admin Credentials
					</>
				)}
			</Button>

			<SectionDivider />

			<InfoBox $variant="warning">
				<FiAlertTriangle size={20} />
				<div>
					<InfoTitle>PingOne Application</InfoTitle>
					<InfoText>
						Enter the SAML application ID you want to manage. Once loaded you can verify or toggle
						the
						<em>Always accept ACS URL</em> capability.
					</InfoText>
					{hasSavedConfig && lastSavedAt && (
						<Helper>Configuration last saved {new Date(lastSavedAt).toLocaleString()}.</Helper>
					)}
				</div>
			</InfoBox>

			<FormGroup>
				<Label>PingOne Application ID</Label>
				<Input
					type="text"
					value={pingOneAppIdInput}
					onChange={(event) => setPingOneAppIdInput(event.target.value)}
					placeholder="e.g. 1a2b3c4d-xxxx-xxxx-xxxx-0123456789ab"
				/>
			</FormGroup>

			<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
				<Button
					onClick={handleFetchPingOneApplication}
					$variant="secondary"
					disabled={!isAdminConfigured || isFetchingPingOneApp}
				>
					{isFetchingPingOneApp ? (
						<>
							<FiRefreshCw className="rotate" /> Loading…
						</>
					) : (
						<>
							<FiGlobe /> Load Application
						</>
					)}
				</Button>
				<Button
					onClick={handleSyncDynamicAcs}
					$variant="primary"
					disabled={!isAdminConfigured || isSyncingPingOne}
				>
					{isSyncingPingOne ? (
						<>
							<FiRefreshCw className="rotate" /> Updating…
						</>
					) : (
						<>
							<FiSend /> Sync Dynamic ACS Toggle
						</>
					)}
				</Button>
			</div>

			{!isAdminConfigured && (
				<Helper style={{ color: '#dc2626', marginTop: '0.75rem' }}>
					Provide all PingOne admin credentials above before attempting to load or sync the
					application.
				</Helper>
			)}

			{pingOneAdmin?.environmentId && pingOneAdmin.clientId && (
				<GeneratedContentBox>
					<strong>PingOne Admin Summary</strong>
					<ParameterGrid style={{ marginTop: '0.75rem' }}>
						<ParameterLabel>Env ID</ParameterLabel>
						<ParameterValue>{pingOneAdmin.environmentId}</ParameterValue>
						<ParameterLabel>Client ID</ParameterLabel>
						<ParameterValue>{pingOneAdmin.clientId}</ParameterValue>
						<ParameterLabel>Dynamic ACS Enabled</ParameterLabel>
						<ParameterValue>
							{samlConfig.enableAlwaysAcceptAcsUrlInSignedAuthnRequest ? 'Yes' : 'No'}
						</ParameterValue>
					</ParameterGrid>
				</GeneratedContentBox>
			)}
		</CollapsibleHeader>
	);

	const renderAuthnRequest = () => (
		<>
			<CollapsibleHeader
				title="SAML AuthnRequest Processing"
				icon={<FiSend />}
				theme="blue"
				defaultCollapsed={collapsedSections.authnRequest}
				showArrow={true}
			>
				<InfoBox $variant="info">
					<FiGlobe size={20} />
					<div>
						<InfoTitle>SAML AuthnRequest with Dynamic ACS URL</InfoTitle>
						<InfoText>
							The AuthnRequest contains an embedded ACS URL. With the new PingOne feature enabled,
							this dynamic ACS URL will be accepted if the AuthnRequest is properly signed.
						</InfoText>
					</div>
				</InfoBox>

				<FormGroup>
					<Label>SAML AuthnRequest XML</Label>
					<TextArea
						value={authnRequestXml}
						onChange={(e) => setAuthnRequestXml(e.target.value)}
						placeholder="Paste your SAML AuthnRequest XML here..."
					/>
					<Helper>XML content of the signed SAML AuthnRequest from your IdP</Helper>
				</FormGroup>

				<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
					<Button onClick={generateSampleAuthnRequest} $variant="secondary">
						<FiRefreshCw /> Generate Sample AuthnRequest
					</Button>
					<Button
						onClick={processAuthnRequest}
						$variant="primary"
						disabled={!authnRequestXml.trim() || isProcessing}
					>
						{isProcessing ? <FiRefreshCw className="animate-spin" /> : <FiSend />}
						{isProcessing ? 'Processing...' : 'Process AuthnRequest'}
					</Button>
				</div>
			</CollapsibleHeader>

			{parsedAuthnRequest && (
				<CollapsibleHeader
					title="✅ Parsed AuthnRequest"
					icon={<FiCheckCircle />}
					theme="green"
					defaultCollapsed={false}
					showArrow={true}
				>
					<GeneratedContentBox>
						<ParameterGrid>
							<ParameterLabel>Issuer (IdP Entity ID)</ParameterLabel>
							<ParameterValue>{parsedAuthnRequest.issuer}</ParameterValue>

							<ParameterLabel>Requested ACS URL</ParameterLabel>
							<ParameterValue>
								{parsedAuthnRequest.assertionConsumerServiceURL || 'Not specified'}
							</ParameterValue>

							<ParameterLabel>Name ID Policy Format</ParameterLabel>
							<ParameterValue>
								{parsedAuthnRequest.nameIdPolicy?.format || 'Not specified'}
							</ParameterValue>

							<ParameterLabel>Force Authn</ParameterLabel>
							<ParameterValue>{parsedAuthnRequest.forceAuthn ? 'Yes' : 'No'}</ParameterValue>

							<ParameterLabel>Is Passive</ParameterLabel>
							<ParameterValue>{parsedAuthnRequest.isPassive ? 'Yes' : 'No'}</ParameterValue>
						</ParameterGrid>
					</GeneratedContentBox>
				</CollapsibleHeader>
			)}
		</>
	);

	const renderValidation = () => (
		<>
			{validationResult && (
				<CollapsibleHeader
					title="ACS URL Validation"
					icon={<FiShield />}
					theme={validationResult.isValid ? 'green' : 'orange'}
					defaultCollapsed={collapsedSections.validation}
					showArrow={true}
				>
					<InfoBox $variant={validationResult.isValid ? 'success' : 'warning'}>
						{validationResult.isValid ? <FiCheckCircle size={20} /> : <FiAlertTriangle size={20} />}
						<div>
							<InfoTitle>
								{validationResult.isValid ? 'ACS URL Accepted' : 'ACS URL Validation Issues'}
							</InfoTitle>
							<InfoText>
								{validationResult.isValid
									? 'The ACS URL from the signed AuthnRequest has been validated and accepted.'
									: 'The ACS URL validation failed. Check the details below.'}
							</InfoText>
						</div>
					</InfoBox>

					<GeneratedContentBox>
						<div style={{ marginBottom: '1rem' }}>
							<strong>Validation Details:</strong>
						</div>

						<ParameterGrid>
							<ParameterLabel>Dynamic ACS Enabled</ParameterLabel>
							<ParameterValue>
								{samlConfig.enableAlwaysAcceptAcsUrlInSignedAuthnRequest ? 'Yes' : 'No'}
							</ParameterValue>

							<ParameterLabel>Requested ACS URL</ParameterLabel>
							<ParameterValue>
								{parsedAuthnRequest?.assertionConsumerServiceURL || 'None'}
							</ParameterValue>

							<ParameterLabel>Configured ACS URLs</ParameterLabel>
							<ParameterValue>{samlConfig.acsUrls.join(', ')}</ParameterValue>

							<ParameterLabel>ACS URL in Config</ParameterLabel>
							<ParameterValue>
								{samlConfig.acsUrls.includes(parsedAuthnRequest?.assertionConsumerServiceURL || '')
									? 'Yes'
									: 'No'}
							</ParameterValue>

							<ParameterLabel>Validation Result</ParameterLabel>
							<ParameterValue>{validationResult.isValid ? 'Accepted' : 'Rejected'}</ParameterValue>
						</ParameterGrid>

						{validationResult.explanation && (
							<div
								style={{
									marginTop: '1rem',
									padding: '1rem',
									background: '#f9fafb',
									borderRadius: '0.25rem',
								}}
							>
								<strong>Explanation:</strong>
								<div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#374151' }}>
									{validationResult.explanation}
								</div>
							</div>
						)}

						{validationResult.errors && validationResult.errors.length > 0 && (
							<div
								style={{
									marginTop: '1rem',
									padding: '1rem',
									background: '#fef2f2',
									border: '1px solid #fca5a5',
									borderRadius: '0.25rem',
								}}
							>
								<strong>Errors:</strong>
								<ul style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#dc2626' }}>
									{validationResult.errors.map((error: string, index: number) => (
										<li key={index}>{error}</li>
									))}
								</ul>
							</div>
						)}
					</GeneratedContentBox>
				</CollapsibleHeader>
			)}
		</>
	);

	const renderResponse = () => (
		<>
			{validationResult?.isValid && (
				<CollapsibleHeader
					title="Generate SAML Response"
					icon={<FiPackage />}
					defaultCollapsed={collapsedSections.response}
					showArrow={true}
				>
					<InfoBox $variant="info">
						<FiPackage size={20} />
						<div>
							<InfoTitle>SAML Response Generation</InfoTitle>
							<InfoText>
								Generate a SAML Response to complete the authentication flow. The response will be
								sent to the validated ACS URL.
							</InfoText>
						</div>
					</InfoBox>

					<div style={{ marginBottom: '1rem' }}>
						<Button onClick={generateSamlResponse} $variant="success">
							<FiPackage /> Generate SAML Response
						</Button>
					</div>

					{samlResponse && (
						<GeneratedContentBox>
							<div style={{ marginBottom: '1rem' }}>
								<strong>SAML Response XML:</strong>
							</div>
							<pre
								style={{
									color: '#111827',
									fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
									fontSize: '0.875rem',
									lineHeight: '1.5',
									margin: 0,
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-word',
									maxHeight: '400px',
									overflowY: 'auto',
								}}
							>
								{samlResponse}
							</pre>
							<div
								style={{
									marginTop: '1rem',
									display: 'flex',
									gap: '0.5rem',
								}}
							>
								<Button
									onClick={() => copyToClipboard(samlResponse, 'SAML Response')}
									$variant="secondary"
									style={{ fontSize: '0.75rem' }}
								>
									<FiCopy /> Copy Response
								</Button>
							</div>
						</GeneratedContentBox>
					)}
				</CollapsibleHeader>
			)}
		</>
	);

	const renderCompletion = () => (
		<FlowCompletionService
			config={{
				...completionConfig,
				onStartNewFlow: () => {
					setCollapsedSections((prev) => ({
						...prev,
						response: true,
						completion: false,
					}));
					setAuthnRequestXml('');
					setParsedAuthnRequest(null);
					setValidationResult(null);
					setSamlResponse('');
				},
			}}
			collapsed={collapsedSections.completion}
			onToggleCollapsed={() => toggleSection('completion')}
		/>
	);

	// Main render
	return (
		<Container>
			<FlowHeader flowId="saml-sp-dynamic-acs" />
			<ContentWrapper>
				{renderConfiguration()}
				<SectionDivider />

				{renderPingOneSetup()}
				<SectionDivider />

				{renderAuthnRequest()}
				<SectionDivider />

				{renderValidation()}
				{validationResult && <SectionDivider />}

				{renderResponse()}

				{samlResponse && (
					<>
						<SectionDivider />
						{renderCompletion()}
					</>
				)}
			</ContentWrapper>
		</Container>
	);
};

export default SAMLServiceProviderFlowV1;
