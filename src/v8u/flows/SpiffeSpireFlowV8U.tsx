/**
 * @file SpiffeSpireFlowV8U.tsx
 * @module v8u/flows
 * @description SPIFFE/SPIRE Mock Flow - Demonstrates workload identity to PingOne SSO token exchange
 * @version 8.0.0
 * @since 2024-11-17
 *
 * This mock flow demonstrates:
 * - SPIFFE workload identity (SVID) generation
 * - SVID validation and verification
 * - Token exchange with PingOne
 * - OAuth/OIDC token issuance for workloads
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	FiBook,
	FiCheckCircle,
	FiCopy,
	FiExternalLink,
	FiInfo,
	FiKey,
	FiServer,
	FiShield,
} from 'react-icons/fi';
import styled from 'styled-components';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import { EnhancedApiCallDisplay } from '@/components/EnhancedApiCallDisplay';
import type { EnhancedApiCallData } from '@/services/enhancedApiCallDisplayService';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { TokenDisplayServiceV8 } from '@/v8/services/tokenDisplayServiceV8';

const MODULE_TAG = '[🔐 SPIFFE-SPIRE-FLOW-V8U]';

// Styled Components
const PageContainer = styled.div`
	max-width: 1400px;
	margin: 0 auto;
	padding: 2rem;
	background: #f9fafb; // Light grey background
	min-height: 100vh;
`;

const Header = styled.div`
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	padding: 2rem;
	border-radius: 0.75rem;
	margin-bottom: 2rem;
	text-align: center;

	h1 {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}

	p {
		font-size: 1rem;
		opacity: 0.95;
		max-width: 800px;
		margin: 0 auto;
	}
`;

const FlowContainer = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 2rem;
	margin-bottom: 2rem;
	animation: fadeIn 0.5s ease-in-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
	}
`;

const PhaseTransitionBackdrop = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 999;
	animation: fadeIn 0.3s ease-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

const PhaseTransition = styled.div`
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	padding: 2rem 3rem;
	border-radius: 1rem;
	font-size: 1.5rem;
	font-weight: 700;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	z-index: 1000;
	animation: phaseSlideIn 0.5s ease-out;
	display: flex;
	align-items: center;
	gap: 1rem;

	@keyframes phaseSlideIn {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.8);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}

	svg {
		font-size: 2rem;
		animation: spin 1s linear infinite;
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

const Card = styled.div`
	background: #ffffff; // White background for cards
	border-radius: 0.75rem;
	padding: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const CardHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 2px solid #e5e7eb; // Border grey

	h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937; // Dark text on light background
		margin: 0;
	}

	svg {
		font-size: 1.75rem;
		color: #667eea;
	}
`;

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	font-weight: 500;
	color: #374151; // Secondary dark text
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
`;

const HelperText = styled.div`
	font-size: 0.75rem;
	color: #6b7280; // Muted text
	margin-top: 0.25rem;
	font-weight: 600;
	
	strong {
		color: #1f2937; // Dark text for emphasis
	}
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db; // Grey border
	border-radius: 0.5rem;
	font-size: 0.875rem;
	color: #1f2937; // Dark text
	background: #ffffff; // White input
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	&:disabled {
		background: #f3f4f6; // Slightly darker grey for disabled
		color: #6b7280; // Muted text
		cursor: not-allowed;
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	color: #1f2937; // Dark text
	background: #ffffff; // White background
	cursor: pointer;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 500;
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	border: none;

	${(props) =>
		props.$variant === 'primary'
			? `
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
		}
	`
			: `
		background: #f3f4f6; // Light grey
		color: #374151; // Dark text
		&:hover {
			background: #e5e7eb;
		}
	`}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none !important;
	}
`;

const StepIndicator = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 2rem;
	padding: 1rem;
	background: #ffffff; // White background
	border-radius: 0.75rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Step = styled.div<{ $active: boolean; $completed: boolean }>`
	flex: 1;
	padding: 1rem;
	border-radius: 0.5rem;
	text-align: center;
	font-weight: 600;
	font-size: 0.875rem;
	transition: all 0.3s ease-in-out;
	position: relative;
	cursor: default;
	
	${(props) => {
		if (props.$completed) {
			return `
				background: #d1fae5; // Light green
				color: #065f46; // Dark green text
				border: 3px solid #22c55e;
				box-shadow: 0 4px 6px rgba(34, 197, 94, 0.2);
				transform: scale(1.02);
				
				&::before {
					content: '✓';
					position: absolute;
					top: -8px;
					right: -8px;
					width: 24px;
					height: 24px;
					background: #22c55e;
					color: white;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 0.75rem;
					font-weight: bold;
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
				}
			`;
		} else if (props.$active) {
			return `
				background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); // Light blue gradient
				color: #1e40af; // Dark blue text
				border: 3px solid #3b82f6;
				box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
				transform: scale(1.05);
				animation: pulse 2s ease-in-out infinite;
				
				@keyframes pulse {
					0%, 100% {
						box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
					}
					50% {
						box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5);
					}
				}
				
				&::after {
					content: '▶';
					position: absolute;
					top: -8px;
					right: -8px;
					width: 24px;
					height: 24px;
					background: #3b82f6;
					color: white;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 0.625rem;
					font-weight: bold;
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
					animation: bounce 1s ease-in-out infinite;
				}
				
				@keyframes bounce {
					0%, 100% {
						transform: translateY(0);
					}
					50% {
						transform: translateY(-4px);
					}
				}
			`;
		} else {
			return `
				background: #f3f4f6; // Light grey
				color: #9ca3af; // Lighter muted text
				border: 2px solid #e5e7eb;
				opacity: 0.7;
			`;
		}
	}}
`;

const CodeBlock = styled.pre`
	background: #1f2937; // Dark background
	color: #f9fafb; // Light text
	padding: 1rem;
	border-radius: 0.5rem;
	overflow-x: auto;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.75rem;
	line-height: 1.5;
	margin: 1rem 0;
	max-height: 400px;
	overflow-y: auto;
`;

const Alert = styled.div<{ $type: 'info' | 'success' | 'warning' | 'error' }>`
	padding: 1rem;
	border-radius: 0.5rem;
	margin: 1rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	font-size: 0.875rem;

	${(props) => {
		switch (props.$type) {
			case 'success':
				return `
					background: #d1fae5; // Light green
					color: #065f46; // Dark green text
					border-left: 4px solid #22c55e;
				`;
			case 'warning':
				return `
					background: #fef3c7; // Light yellow
					color: #92400e; // Dark brown text
					border-left: 4px solid #f59e0b;
				`;
			case 'error':
				return `
					background: #fee2e2; // Light red
					color: #991b1b; // Dark red text
					border-left: 4px solid #ef4444;
				`;
			default:
				return `
					background: #dbeafe; // Light blue
					color: #1e40af; // Dark blue text
					border-left: 4px solid #3b82f6;
				`;
		}
	}}

	svg {
		flex-shrink: 0;
		font-size: 1.25rem;
	}
`;

const TokenDisplay = styled.div`
	background: #f3f4f6; // Light grey
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
	position: relative;
`;

const CopyButton = styled.button`
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	padding: 0.5rem;
	background: #ffffff; // White background
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	cursor: pointer;
	color: #374151; // Dark text
	transition: all 0.2s;

	&:hover {
		background: #f3f4f6;
		color: #1f2937;
	}
`;

const TokenText = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.75rem;
	color: #1f2937; // Dark text on light background
	word-break: break-all;
	line-height: 1.5;
	padding-right: 3rem;
`;

const Link = styled.a`
	color: #3b82f6;
	text-decoration: none;
	font-weight: 500;
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	transition: color 0.2s;

	&:hover {
		color: #2563eb;
		text-decoration: underline;
	}
`;

const EducationPanel = styled.div`
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); // Light yellow gradient
	border: 2px solid #f59e0b;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 2rem;
`;

const EducationHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1rem;
	color: #92400e; // Dark brown text on light yellow

	h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	svg {
		font-size: 1.5rem;
	}
`;

const EducationContent = styled.div`
	color: #92400e; // Dark brown text on light yellow
	line-height: 1.6;
	font-size: 0.875rem;

	p {
		margin: 0.75rem 0;
	}

	strong {
		font-weight: 600;
		color: #78350f; // Darker brown for emphasis
	}

	ul {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	li {
		margin: 0.25rem 0;
	}
`;

const ToggleButton = styled.button`
	background: transparent;
	border: none;
	color: #92400e; // Dark brown text
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	padding: 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: color 0.2s;

	&:hover {
		color: #78350f;
		text-decoration: underline;
	}
`;

const ConceptBox = styled.div`
	background: #ffffff; // White background
	border: 2px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 0.75rem 0;
`;

const ConceptTitle = styled.div`
	font-weight: 600;
	color: #1f2937; // Dark text
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ConceptText = styled.div`
	color: #4b5563; // Secondary dark text
	font-size: 0.875rem;
	line-height: 1.6;
`;

const ApiCallSection = styled.div`
	margin-top: 3rem;
	padding-top: 2rem;
	border-top: 3px solid #e5e7eb;
	animation: slideUp 0.5s ease-out;

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
`;

// Types
interface WorkloadConfig {
	trustDomain: string;
	workloadPath: string;
	workloadType: 'kubernetes' | 'vm' | 'container';
	namespace?: string;
	serviceAccount?: string;
}

interface SVID {
	spiffeId: string;
	x509Certificate: string;
	privateKey: string;
	expiresAt: string;
	trustBundle: string;
}

interface PingOneToken {
	accessToken: string;
	tokenType: string;
	expiresIn: number;
	scope: string;
	idToken?: string;
}

// SPIFFE/SPIRE lab types
type SpiffeTrustDomain = string;

type WorkloadSelector = {
	type: string; // e.g. "k8s"
	value: string; // e.g. "sa:orders-sa"
};

type Workload = {
	id: string;
	name: string;
	namespace?: string;
	selectors: WorkloadSelector[];
};

type SpireRegistrationEntry = {
	spiffeId: string;
	parentId: string;
	selectors: WorkloadSelector[];
	ttlSeconds: number;
};

// Helper builders for SPIFFE IDs and registration entries
const buildSpiffeId = (trustDomain: SpiffeTrustDomain, workload: Workload): string => {
	const ns = workload.namespace || 'default';
	// Opinionated SPIFFE ID layout similar to common SPIRE-on-Kubernetes patterns:
	// spiffe://trust-domain/ns/<namespace>/sa/<workload-name>
	return `spiffe://${trustDomain}/ns/${ns}/sa/${workload.name}`;
};

const buildRegistrationEntry = (
	trustDomain: SpiffeTrustDomain,
	workload: Workload,
	ttlSeconds: number = 3600,
): SpireRegistrationEntry => ({
	spiffeId: buildSpiffeId(trustDomain, workload),
	parentId: `spiffe://${trustDomain}/spire/server`,
	selectors: workload.selectors,
	ttlSeconds,
});

// Mock data generators
const generateSVID = (config: WorkloadConfig): SVID => {
	const spiffeId = `spiffe://${config.trustDomain}/${config.workloadPath}`;
	const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

	return {
		spiffeId,
		x509Certificate: `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKSzMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMjQxMTE3MDAwMDAwWhcNMjQxMTE3MDEwMDAwWjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEA2Z3qX0SPIFFE_ID_${config.workloadPath.replace(/\//g, '_')}_MOCK
-----END CERTIFICATE-----`,
		privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDZnepfRI9SPIFFE
_PRIVATE_KEY_${config.workloadPath.replace(/\//g, '_')}_MOCK
-----END PRIVATE KEY-----`,
		expiresAt,
		trustBundle: `-----BEGIN CERTIFICATE-----
MIIC5zCCAc+gAwIBAgIBATANBgkqhkiG9w0BAQsFADATMREwDwYDVQQDDAhTUElS
RSBDQTAEFAKE_TRUST_BUNDLE_FOR_${config.trustDomain}
-----END CERTIFICATE-----`,
	};
};

const generatePingOneToken = (svid: SVID, environmentId: string): PingOneToken => {
	const accessToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InNwaWZmZS1waW5nb25lLWludGVncmF0aW9uIn0.${btoa(
		JSON.stringify({
			sub: svid.spiffeId,
			iss: `https://auth.pingone.com/${environmentId}/as`,
			aud: `https://api.pingone.com/${environmentId}`,
			exp: Math.floor(Date.now() / 1000) + 3600,
			iat: Math.floor(Date.now() / 1000),
			scope: 'openid profile email',
			spiffe_id: svid.spiffeId,
			workload_identity: true,
		})
	)}.MOCK_SIGNATURE_${environmentId}`;

	const idToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InNwaWZmZS1waW5nb25lLWludGVncmF0aW9uIn0.${btoa(
		JSON.stringify({
			sub: svid.spiffeId,
			iss: `https://auth.pingone.com/${environmentId}/as`,
			aud: 'spiffe-workload-client',
			exp: Math.floor(Date.now() / 1000) + 3600,
			iat: Math.floor(Date.now() / 1000),
			name: `Workload: ${svid.spiffeId}`,
			spiffe_id: svid.spiffeId,
			workload_type: 'service',
		})
	)}.MOCK_ID_TOKEN_SIGNATURE`;

	return {
		accessToken,
		tokenType: 'Bearer',
		expiresIn: 3600,
		scope: 'openid profile email',
		idToken,
	};
};

export const SpiffeSpireFlowV8U: React.FC = () => {
	console.log(`${MODULE_TAG} Initializing SPIFFE/SPIRE mock flow`);
	const navigate = useNavigate();

	// State
	const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
	const [workloadConfig, setWorkloadConfig] = useState<WorkloadConfig>({
		trustDomain: 'example.org',
		workloadPath: 'frontend/api',
		workloadType: 'kubernetes',
		namespace: 'default',
		serviceAccount: 'frontend-sa',
	});
	const [environmentId, setEnvironmentId] = useState('');
	const [svid, setSvid] = useState<SVID | null>(null);
	const [pingOneToken, setPingOneToken] = useState<PingOneToken | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [showEducation, setShowEducation] = useState(true);
	const [showTrustDomainInfo, setShowTrustDomainInfo] = useState(false);
	const [showSpiffeIdInfo, setShowSpiffeIdInfo] = useState(false);
	const [showRegistrationInfo, setShowRegistrationInfo] = useState(false);
	const [showPhaseTransition, setShowPhaseTransition] = useState(false);
	const [transitionMessage, setTransitionMessage] = useState('');

	// Load environment ID from global storage on mount
	useEffect(() => {
		// Clear shared API call history when this lab loads, similar to MFA flow
		apiCallTrackerService.clearApiCalls();

		const storedEnvId = EnvironmentIdServiceV8.getEnvironmentId();
		if (storedEnvId) {
			setEnvironmentId(storedEnvId);
			console.log(`${MODULE_TAG} Loaded environment ID from storage`);
		}
	}, []);

	// Listen for environment ID updates
	useEffect(() => {
		const handleEnvIdUpdate = () => {
			const storedEnvId = EnvironmentIdServiceV8.getEnvironmentId();
			if (storedEnvId && storedEnvId !== environmentId) {
				setEnvironmentId(storedEnvId);
				console.log(`${MODULE_TAG} Environment ID updated from storage`);
			}
		};
		window.addEventListener('environmentIdUpdated', handleEnvIdUpdate);
		return () => window.removeEventListener('environmentIdUpdated', handleEnvIdUpdate);
	}, [environmentId]);

	// Step 1: Generate SVID
	const handleGenerateSVID = () => {
		console.log(`${MODULE_TAG} Generating SVID`, { workloadConfig });
		setIsLoading(true);
		setTransitionMessage('🔐 Attesting Workload & Issuing SVID...');
		setShowPhaseTransition(true);

		// Create mock API call for workload attestation
		const attestationApiCall: EnhancedApiCallData = {
			method: 'POST',
			url: `https://spire-server.${workloadConfig.trustDomain}:8081/spire.api.server.agent.v1.Agent/AttestAgent`,
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				attestation_data: {
					type: workloadConfig.workloadType,
					data:
						workloadConfig.workloadType === 'kubernetes'
							? {
									namespace: workloadConfig.namespace,
									service_account: workloadConfig.serviceAccount,
									pod_name: `${workloadConfig.workloadPath.split('/').pop()}-pod-abc123`,
								}
							: {
									workload_path: workloadConfig.workloadPath,
								},
				},
			},
			description: 'SPIRE Agent attests the workload identity',
			educationalNotes: [
				'SPIRE Agent verifies the workload using platform-specific attestation',
				'For Kubernetes: validates pod UID, namespace, and service account',
				'For VMs: validates instance metadata from cloud provider',
				'Attestation proves the workload is what it claims to be',
			],
			timestamp: new Date(),
		};

		// Simulate SPIRE agent interaction
		setTimeout(() => {
			// Add response to API call
			attestationApiCall.response = {
				status: 200,
				statusText: 'OK',
				data: {
					svid: {
						spiffe_id: `spiffe://${workloadConfig.trustDomain}/${workloadConfig.workloadPath}`,
						x509_svid: '[X.509 Certificate Data]',
						x509_svid_key: '[Private Key Data]',
						x509_bundle: '[Trust Bundle Data]',
					},
					expires_at: new Date(Date.now() + 3600000).toISOString(),
				},
			};
			attestationApiCall.duration = 1200;

			// Track attestation via shared API call tracker for bottom-docked viewer
			apiCallTrackerService.trackApiCall({
				method: attestationApiCall.method as 'POST',
				url: attestationApiCall.url,
				headers: attestationApiCall.headers || { 'Content-Type': 'application/json' },
				body: attestationApiCall.body ?? null,
				step: 'spiffe-spire-attest-agent',
			});

			const generatedSVID = generateSVID(workloadConfig);
			setSvid(generatedSVID);
			setShowPhaseTransition(false);
			setTimeout(() => {
				setCurrentStep(2);
				setIsLoading(false);
				// Move to dedicated SVID page
				navigate('/v8u/spiffe-spire/svid');
			}, 300);
			console.log(`${MODULE_TAG} SVID generated`, { spiffeId: generatedSVID.spiffeId });
		}, 1500);
	};

	// Step 2: Validate SVID
	const handleValidateSVID = () => {
		console.log(`${MODULE_TAG} Validating SVID`);
		setIsLoading(true);
		setTransitionMessage('✓ Validating SVID with Trust Bundle...');
		setShowPhaseTransition(true);

		// Create mock API call for SVID validation
		const validationApiCall: EnhancedApiCallData = {
			method: 'POST',
			url: `https://token-exchange.${workloadConfig.trustDomain}/api/v1/validate-svid`,
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				svid: svid?.x509Certificate,
				trust_bundle: svid?.trustBundle,
				spiffe_id: svid?.spiffeId,
			},
			description: 'Token Exchange Service validates the SVID',
			educationalNotes: [
				'Validates the SVID certificate signature against the trust bundle',
				'Checks that the certificate has not expired',
				'Verifies the SPIFFE ID matches the certificate subject',
				'Ensures the certificate chain is valid',
			],
			timestamp: new Date(),
		};

		// Simulate SVID validation
		setTimeout(() => {
			validationApiCall.response = {
				status: 200,
				statusText: 'OK',
				data: {
					valid: true,
					spiffe_id: svid?.spiffeId,
					expires_at: svid?.expiresAt,
					trust_domain: workloadConfig.trustDomain,
					validation_checks: {
						signature_valid: true,
						not_expired: true,
						spiffe_id_matches: true,
						chain_valid: true,
					},
				},
			};
			validationApiCall.duration = 800;

			// Track validation via shared API call tracker for bottom-docked viewer
			apiCallTrackerService.trackApiCall({
				method: validationApiCall.method as 'POST',
				url: validationApiCall.url,
				headers: validationApiCall.headers || { 'Content-Type': 'application/json' },
				body: validationApiCall.body ?? null,
				step: 'spiffe-spire-validate-svid',
			});
			setShowPhaseTransition(false);
			setTimeout(() => {
				setCurrentStep(3);
				setIsLoading(false);
				// Move to dedicated validation page
				navigate('/v8u/spiffe-spire/validate');
			}, 300);
			console.log(`${MODULE_TAG} SVID validated successfully`);
		}, 1000);
	};

	// Step 3: Exchange for PingOne Token
	const handleTokenExchange = () => {
		if (!svid || !environmentId) {
			console.error(`${MODULE_TAG} Missing required data for token exchange`);
			return;
		}

		console.log(`${MODULE_TAG} Exchanging SVID for PingOne token`, { environmentId });
		setIsLoading(true);
		setTransitionMessage('🔄 Exchanging SVID for PingOne Token...');
		setShowPhaseTransition(true);

		// Create mock API call for token exchange (for detailed SPIFFE/SPIRE view)
		const tokenExchangeApiCall: EnhancedApiCallData = {
			method: 'POST',
			url: `https://auth.pingone.com/${environmentId}/as/token`,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: {
				grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
				subject_token: svid.x509Certificate,
				subject_token_type: 'urn:ietf:params:oauth:token-type:spiffe-svid',
				scope: 'openid profile email',
				requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
			},
			description: 'Exchange SPIFFE SVID for PingOne OAuth tokens',
			educationalNotes: [
				'Uses OAuth 2.0 Token Exchange (RFC 8693) to convert SVID to OAuth token',
				'Token Exchange Service maps SPIFFE ID to PingOne service account',
				'PingOne validates the request and issues access token and ID token',
				'Tokens can now be used to access PingOne-protected APIs and resources',
			],
			timestamp: new Date(),
		};

		// Track PingOne token exchange via shared API call tracker (used by SuperSimpleApiDisplayV8)
		const trackerId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: tokenExchangeApiCall.url,
			headers: tokenExchangeApiCall.headers || { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: tokenExchangeApiCall.body ?? null,
			step: 'spiffe-spire-token-exchange',
		});

		// Simulate token exchange service
		setTimeout(() => {
			const token = generatePingOneToken(svid, environmentId);

			tokenExchangeApiCall.response = {
				status: 200,
				statusText: 'OK',
				data: {
					access_token: token.accessToken,
					id_token: token.idToken,
					token_type: token.tokenType,
					expires_in: token.expiresIn,
					scope: token.scope,
				},
			};
			tokenExchangeApiCall.duration = 1300;

			// Update shared API call tracker with mock response so MFA-style viewer can render it
			apiCallTrackerService.updateApiCallResponse(trackerId, {
				status: 200,
				statusText: 'OK',
				data: {
					access_token: token.accessToken,
					id_token: token.idToken,
					token_type: token.tokenType,
					expires_in: token.expiresIn,
					scope: token.scope,
				},
			}, tokenExchangeApiCall.duration);

			setPingOneToken(token);
			setShowPhaseTransition(false);
			setTimeout(() => {
				setCurrentStep(4);
				setIsLoading(false);
				// Automatically navigate to dedicated token display page with generated tokens
				navigate('/v8u/spiffe-spire/tokens', {
					state: {
						// Match TokenDisplayV8UProps shape expected by SpiffeSpireTokenDisplayV8U
						tokens: {
							accessToken: token.accessToken,
							idToken: token.idToken,
							expiresIn: token.expiresIn,
						},
					},
				});
			}, 300);
			console.log(`${MODULE_TAG} Token exchange successful`);
		}, 1500);
	};

	// Copy to clipboard using TokenDisplayServiceV8
	const handleCopy = async (text: string, field: string) => {
		const success = await TokenDisplayServiceV8.copyToClipboard(text, field);
		if (success) {
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		}
	};

	// Reset flow
	const handleReset = () => {
		console.log(`${MODULE_TAG} Resetting flow`);
		setCurrentStep(1);
		setSvid(null);
		setPingOneToken(null);
		navigate('/v8u/spiffe-spire/attest');
	};

	return (
		<PageContainer>
			{showPhaseTransition && (
				<>
					<PhaseTransitionBackdrop />
					<PhaseTransition>
						<FiServer />
						{transitionMessage}
					</PhaseTransition>
				</>
			)}

			<Header>
				<h1>
					<FiShield />
					SPIFFE/SPIRE Mock Flow
				</h1>
				<p>Demonstrate workload identity (SVID) generation and exchange for PingOne SSO tokens</p>
			</Header>

			<Alert $type="info">
				<FiExternalLink />
				<div>
					<strong>Educational Mock Flow:</strong> This demonstrates SPIFFE/SPIRE workload identity
					integration with PingOne OAuth/OIDC. In production, this would use real SPIRE agents,
					servers, and PingOne APIs.{' '}
					<Link href="/docs/spiffe-spire-pingone" target="_blank">
						Full Integration Guide
					</Link>
					{' | '}
					<Link
						href="https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/"
						target="_blank"
						rel="noopener noreferrer"
					>
						Official SPIFFE Docs
					</Link>
				</div>
			</Alert>

			<EducationPanel>
				<EducationHeader>
					<FiBook />
					<h3>What is SPIFFE/SPIRE?</h3>
				</EducationHeader>

				{showEducation ? (
					<>
						<EducationContent>
							<p>
								<strong>SPIFFE</strong> (Secure Production Identity Framework for Everyone) is a set
								of open-source standards for securely identifying software systems in dynamic and
								heterogeneous environments. <strong>SPIRE</strong> (SPIFFE Runtime Environment) is a
								production-ready implementation that issues and manages identities for workloads.
							</p>

							<ConceptBox>
								<ConceptTitle>
									<FiKey />
									Why SPIFFE/SPIRE?
								</ConceptTitle>
								<ConceptText>
									Modern infrastructure is dynamic - services scale up/down, move between hosts, and
									run in containers. Traditional authentication using static secrets (passwords, API
									keys, tokens) doesn't work well because:
									<ul>
										<li>Secrets must be distributed and rotated manually</li>
										<li>Secrets can be stolen, leaked, or compromised</li>
										<li>Hard to track which service is making requests</li>
									</ul>
									SPIFFE/SPIRE solves this by automatically issuing{' '}
									<strong>cryptographic identities</strong> based on platform attestation (verifying
									what the workload is, not what it knows).
								</ConceptText>
							</ConceptBox>

							<ConceptBox>
								<ConceptTitle>
									<FiShield />
									Core SPIFFE Concepts
								</ConceptTitle>
								<ConceptText>
									<ul>
										<li>
											<strong>SPIFFE ID:</strong> A structured URI that uniquely identifies a
											workload. Format: <code>spiffe://trust-domain/workload-identifier</code>
											<br />
											Example: <code>spiffe://example.org/frontend/api</code>
										</li>
										<li>
											<strong>SVID (SPIFFE Verifiable Identity Document):</strong> A cryptographic
											document that proves a workload's identity. Can be an X.509 certificate or JWT
											token. Contains the SPIFFE ID and is signed by the trust domain's authority.
										</li>
										<li>
											<strong>Trust Domain:</strong> The root of a SPIFFE identity namespace.
											Represents a system's trust boundary (e.g., your organization, environment, or
											cluster). All workloads in a trust domain share the same root of trust.
										</li>
										<li>
											<strong>Workload:</strong> A single piece of software deployed with a
											particular configuration. Examples: web server, database, microservice,
											container, process.
										</li>
										<li>
											<strong>Workload API:</strong> An API exposed by SPIRE Agent that workloads
											call to retrieve their SVIDs. Typically accessed via Unix domain socket for
											security.
										</li>
									</ul>
								</ConceptText>
							</ConceptBox>

							<ConceptBox>
								<ConceptTitle>
									<FiServer />
									SPIRE Architecture
								</ConceptTitle>
								<ConceptText>
									<ul>
										<li>
											<strong>SPIRE Server:</strong> Central component that manages identities,
											validates attestation, and signs SVIDs. Maintains registration entries that
											define which workloads get which SPIFFE IDs.
										</li>
										<li>
											<strong>SPIRE Agent:</strong> Runs on each node/host. Performs workload
											attestation (verifies workload identity using platform-specific mechanisms
											like Kubernetes service accounts, AWS instance metadata, etc.) and provides
											the Workload API for workloads to fetch their SVIDs.
										</li>
										<li>
											<strong>Attestation:</strong> The process of verifying a workload's identity
											using platform-specific properties (e.g., Kubernetes pod UID, AWS instance ID,
											Unix process attributes). This is how SPIRE knows which SPIFFE ID to give.
										</li>
									</ul>
								</ConceptText>
							</ConceptBox>

							<ConceptBox>
								<ConceptTitle>
									<FiServer />
									Integration with PingOne
								</ConceptTitle>
								<ConceptText>
									<p>
										This mock demonstrates a <strong>token exchange pattern</strong> where:
									</p>
									<ol>
										<li>
											<strong>SPIRE Agent</strong> attests your workload and issues an SVID (X.509
											certificate)
										</li>
										<li>
											Your workload presents the SVID to a <strong>Token Exchange Service</strong>
										</li>
										<li>The service validates the SVID against the SPIRE trust bundle</li>
										<li>The service maps the SPIFFE ID to a PingOne service account</li>
										<li>
											<strong>PingOne</strong> issues OAuth/OIDC tokens for accessing protected
											resources
										</li>
									</ol>
									<p style={{ marginTop: '0.75rem' }}>
										This combines <strong>workload identity</strong> (SPIFFE/SPIRE) with{' '}
										<strong>OAuth/OIDC authentication</strong> (PingOne), enabling workloads to
										securely access APIs without storing static credentials.
									</p>
									<p style={{ marginTop: '0.5rem', fontSize: '0.8125rem' }}>
										📚{' '}
										<Link
											href="https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/"
											target="_blank"
											rel="noopener noreferrer"
										>
											Learn more: Official SPIFFE Concepts
										</Link>
									</p>
								</ConceptText>
							</ConceptBox>
						</EducationContent>
						<ToggleButton onClick={() => setShowEducation(false)}>Hide Education ▲</ToggleButton>
					</>
				) : (
					<ToggleButton onClick={() => setShowEducation(true)}>Show Education ▼</ToggleButton>
				)}
			</EducationPanel>

			<StepIndicator>
				<Step $active={currentStep === 1} $completed={currentStep > 1}>
					1. Workload Attestation
				</Step>
				<Step $active={currentStep === 2} $completed={currentStep > 2}>
					2. SVID Issuance
				</Step>
				<Step $active={currentStep === 3} $completed={currentStep > 3}>
					3. SVID Validation
				</Step>
				<Step $active={currentStep === 4} $completed={false}>
					4. Token Exchange
				</Step>
			</StepIndicator>

			<FlowContainer>
				{/* Left Column: Configuration & Actions */}
				<div>
					<Card>
						<CardHeader>
							<FiServer />
							<h2>Workload Configuration</h2>
						</CardHeader>

						{currentStep === 1 && (
							<Alert $type="success" style={{ marginBottom: '1.5rem' }}>
								<FiCheckCircle />
								<div>
									<strong>Step 1: Workload Attestation</strong>
									<br />
									Configure your workload's attributes. In production, SPIRE Agent would
									automatically detect these from the platform (Kubernetes, AWS, etc.). Pre-filled
									examples are ready to use!
								</div>
							</Alert>
						)}

						{currentStep === 2 && (
							<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
								<FiInfo />
								<div>
									<strong>Step 2: SVID Issuance</strong>
									<br />
									SPIRE Server has issued an SVID (X.509 certificate) for your workload. This
									certificate proves your workload's identity and is automatically rotated before
									expiration.
								</div>
							</Alert>
						)}

						{currentStep === 3 && (
							<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
								<FiInfo />
								<div>
									<strong>Step 3: SVID Validation</strong>
									<br />
									The Token Exchange Service validates your SVID against the trust bundle to ensure
									it's legitimate and hasn't been tampered with.
								</div>
							</Alert>
						)}

						{currentStep === 4 && (
							<Alert $type="success" style={{ marginBottom: '1.5rem' }}>
								<FiCheckCircle />
								<div>
									<strong>Step 4: Token Exchange Complete</strong>
									<br />
									Your workload's SPIFFE identity has been exchanged for PingOne OAuth tokens. Use
									these tokens to access protected APIs and resources.
								</div>
							</Alert>
						)}

						<FormGroup>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<Label>Trust Domain</Label>
								<button
									type="button"
									onClick={() => setShowTrustDomainInfo((prev) => !prev)}
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.25rem',
										background: 'transparent',
										border: 'none',
										color: '#6b7280',
										fontSize: '0.75rem',
										cursor: 'pointer',
									}}
								>
									<FiInfo size={14} />
									<span>{showTrustDomainInfo ? 'Hide info' : "What's this?"}</span>
								</button>
							</div>
							<Input
								type="text"
								value={workloadConfig.trustDomain}
								onChange={(e) =>
									setWorkloadConfig({ ...workloadConfig, trustDomain: e.target.value })
								}
								placeholder="example.org"
								disabled={currentStep > 1}
							/>
							<HelperText>
								💡 <strong>Use the default:</strong> example.org (or enter your own)
							</HelperText>
							{showTrustDomainInfo && (
								<HelperText>
									<strong>Trust domain</strong> is the root of your SPIFFE identity namespace and trust
										bundle. All SVIDs in this domain chain back to a CA owned by this name.
									<br />
									Examples: <code>example.org</code>, <code>internal.ping.local</code>,
									<code>prod.bank.internal</code>.
								</HelperText>
							)}
						</FormGroup>

						<FormGroup>
							<Label>Workload Path</Label>
							<Input
								type="text"
								value={workloadConfig.workloadPath}
								onChange={(e) =>
									setWorkloadConfig({ ...workloadConfig, workloadPath: e.target.value })
								}
								placeholder="frontend/api"
								disabled={currentStep > 1}
							/>
							<HelperText>
								💡 <strong>Use the default:</strong> frontend/api (or enter your own)
							</HelperText>
						</FormGroup>

						<FormGroup>
							<Label>Workload Type</Label>
							<Select
								value={workloadConfig.workloadType}
								onChange={(e) =>
									setWorkloadConfig({
										...workloadConfig,
										workloadType: e.target.value as 'kubernetes' | 'vm' | 'container',
									})
								}
								disabled={currentStep > 1}
							>
								<option value="kubernetes">Kubernetes Pod</option>
								<option value="vm">Virtual Machine</option>
								<option value="container">Container</option>
							</Select>
						</FormGroup>

						{workloadConfig.workloadType === 'kubernetes' && (
							<>
								<FormGroup>
									<Label>Kubernetes Namespace</Label>
									<Input
										type="text"
										value={workloadConfig.namespace || ''}
										onChange={(e) =>
											setWorkloadConfig({ ...workloadConfig, namespace: e.target.value })
										}
										placeholder="default"
										disabled={currentStep > 1}
									/>
									<HelperText>
										💡 <strong>Use the default:</strong> default (or enter your own)
									</HelperText>
								</FormGroup>

								<FormGroup>
									<Label>Service Account</Label>
									<Input
										type="text"
										value={workloadConfig.serviceAccount || ''}
										onChange={(e) =>
											setWorkloadConfig({ ...workloadConfig, serviceAccount: e.target.value })
										}
										placeholder="frontend-sa"
										disabled={currentStep > 1}
									/>
									<HelperText>
										💡 <strong>Use the default:</strong> frontend-sa (or enter your own)
									</HelperText>
								</FormGroup>
							</>
						)}

						<FormGroup>
							<Label>PingOne Environment ID</Label>
							<Input
								type="text"
								value={environmentId}
								onChange={(e) => {
									const newValue = e.target.value;
									setEnvironmentId(newValue);
									if (newValue.trim()) {
										EnvironmentIdServiceV8.saveEnvironmentId(newValue);
									}
								}}
								placeholder="12345678-1234-1234-1234-123456789abc"
								disabled={currentStep > 1}
							/>
							<HelperText>
								{environmentId ? (
									<>
										✅ <strong>Auto-loaded from storage</strong> (or enter a different one)
									</>
								) : (
									<>
										💡 <strong>Use example:</strong> 12345678-1234-1234-1234-123456789abc (or enter
										your real Environment ID)
									</>
								)}
							</HelperText>
						</FormGroup>

						{currentStep === 1 && (
							<Button
								$variant="primary"
								onClick={handleGenerateSVID}
								disabled={
									!workloadConfig.trustDomain ||
									!workloadConfig.workloadPath ||
									!environmentId ||
									isLoading
								}
							>
								<FiKey />
								{isLoading ? 'Attesting & Issuing SVID...' : 'Attest Workload & Issue SVID'}
							</Button>
						)}

						{currentStep === 2 && (
							<Button $variant="primary" onClick={handleValidateSVID} disabled={isLoading}>
								<FiCheckCircle />
								{isLoading ? 'Validating SVID...' : 'Validate SVID with Trust Bundle'}
							</Button>
						)}

						{currentStep === 3 && (
							<Button $variant="primary" onClick={handleTokenExchange} disabled={isLoading}>
								<FiShield />
								{isLoading ? 'Exchanging for OAuth Token...' : 'Exchange SVID for PingOne Token'}
							</Button>
						)}

						{currentStep === 4 && (
							<Button $variant="secondary" onClick={handleReset}>
								Reset Flow
							</Button>
						)}
					</Card>
				</div>

				{/* Right Column: Results & Tokens */}
				<div>
					{svid && (
						<Card>
							<CardHeader>
								<FiKey />
								<h2>SPIFFE Verifiable Identity Document (SVID)</h2>
							</CardHeader>

							<Alert $type="info" style={{ marginBottom: '1rem' }}>
								<FiInfo />
								<div>
									<strong>What is an SVID?</strong> This is like a digital passport for your
									workload. It contains a cryptographic certificate that proves the workload's
									identity. In production, SPIRE automatically rotates these before they expire.
								</div>
							</Alert>

							<Alert $type="success">
								<FiCheckCircle />
								<div>
									<strong>SVID Generated Successfully</strong>
									<br />
									Expires: {new Date(svid.expiresAt).toLocaleString()} (1 hour - auto-rotates in
									production)
								</div>
							</Alert>

							<FormGroup>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Label>SPIFFE ID</Label>
									<button
										type="button"
										onClick={() => setShowSpiffeIdInfo((prev) => !prev)}
										style={{
											display: 'inline-flex',
											alignItems: 'center',
											gap: '0.25rem',
											background: 'transparent',
											border: 'none',
											color: '#6b7280',
											fontSize: '0.75rem',
											cursor: 'pointer',
										}}
									>
										<FiInfo size={14} />
										<span>{showSpiffeIdInfo ? 'Hide info' : "What's this?"}</span>
									</button>
								</div>
								<TokenDisplay>
									<CopyButton onClick={async () => await handleCopy(svid.spiffeId, 'SPIFFE ID')}>
										{copiedField === 'SPIFFE ID' ? <FiCheckCircle /> : <FiCopy />}
									</CopyButton>
									<TokenText>{svid.spiffeId}</TokenText>
								</TokenDisplay>
								<HelperText>
									📋 This unique ID identifies your workload across all systems
								</HelperText>
								{showSpiffeIdInfo && (
									<HelperText>
										<strong>SPIFFE ID</strong> is a globally unique name for your workload in the form
											<code>spiffe://trust-domain/path/to/workload</code>. It is not a secret; security
											comes from proving possession of an SVID that contains this ID.
										<br />
										Examples: <code>spiffe://example.org/ns/orders/sa/orders-api</code>
									</HelperText>
								)}
							</FormGroup>

							<FormGroup>
								<Label>X.509 Certificate (Public Part)</Label>
								<CodeBlock>{svid.x509Certificate}</CodeBlock>
								<HelperText>
									🔐 This certificate proves your workload's identity - like showing a passport at
									airport security
								</HelperText>
							</FormGroup>

							{currentStep >= 2 && (
								<Alert $type="info">
									<FiCheckCircle />
									<div>
										<strong>SVID Validated</strong>
										<br />
										Certificate signature verified against trust bundle
									</div>
								</Alert>
							)}
						</Card>
					)}

					{/* Simulated SPIRE registration entry based on current workload config */}
					{workloadConfig && (
						<Card style={{ marginTop: svid ? '2rem' : 0 }}>
							<CardHeader>
								<FiServer />
								<h2>SPIRE Registration Entry (Simulated)</h2>
							</CardHeader>
							{(() => {
								const derivedWorkload: Workload = {
									id: 'primary-workload',
									name:
										workloadConfig.serviceAccount ||
										workloadConfig.workloadPath.split('/').pop() ||
										'workload',
									namespace: workloadConfig.namespace || 'default',
									selectors:
										workloadConfig.workloadType === 'kubernetes'
											? [
												{
													type: 'k8s',
													value: `sa:${workloadConfig.serviceAccount || 'frontend-sa'}`,
												},
											]
											: [
												{
													type: workloadConfig.workloadType,
													value: `path:${workloadConfig.workloadPath}`,
												},
											],
								};

								const entry = buildRegistrationEntry(
									workloadConfig.trustDomain as SpiffeTrustDomain,
									derivedWorkload,
								);

								return (
									<>
										<FormGroup>
											<div
												style={{
													display: 'flex',
													justifyContent: 'space-between',
													alignItems: 'center',
												}}
											>
												<Label>Registration Entry JSON</Label>
												<button
													type="button"
													onClick={() => setShowRegistrationInfo((prev) => !prev)}
													style={{
														display: 'inline-flex',
														alignItems: 'center',
														gap: '0.25rem',
														background: 'transparent',
														border: 'none',
														color: '#6b7280',
														fontSize: '0.75rem',
														cursor: 'pointer',
													}}
												>
													<FiInfo size={14} />
													<span>{showRegistrationInfo ? 'Hide info' : "What's this?"}</span>
												</button>
											</div>
											<CodeBlock>{JSON.stringify(entry, null, 2)}</CodeBlock>
											<HelperText>
												This object shows how SPIRE maps your workload's selectors to a SPIFFE ID.
											</HelperText>
											{showRegistrationInfo && (
												<HelperText>
													<strong>Registration entry</strong> is a rule on the SPIRE Server that says
														"for workloads with these selectors, issue this SPIFFE ID from this parent".
													<br />
													Key fields:
													<ul>
														<li>
															<strong>spiffeId</strong>: the SPIFFE ID the workload receives.
														</li>
														<li>
															<strong>parentId</strong>: who is allowed to sign SVIDs for this
																workload (often the SPIRE Server).
														</li>
														<li>
															<strong>selectors</strong>: platform attributes that identify which
																workloads this entry applies to (e.g., Kubernetes service account).
														</li>
														<li>
															<strong>ttlSeconds</strong>: how long each SVID is valid before it must
																be rotated.
														</li>
													</ul>
												</HelperText>
											)}
										</FormGroup>
									</>
								);
							})()}
						</Card>
					)}

					{pingOneToken && (
						<Card style={{ marginTop: '2rem' }}>
							<CardHeader>
								<FiShield />
								<h2>PingOne OAuth Token (Dedicated View)</h2>
							</CardHeader>

							<Alert $type="info" style={{ marginBottom: '1rem' }}>
								<FiInfo />
								<div>
									<strong>Token Exchange Complete!</strong> Your workload's SVID was validated and
									exchanged for OAuth tokens. View and analyze those tokens on a dedicated page.
								</div>
							</Alert>

							<Alert $type="success" style={{ marginBottom: '1rem' }}>
								<FiCheckCircle />
								<div>
									<strong>Token Exchange Successful</strong>
									<br />
									Workload can now access PingOne-protected resources using these tokens.
								</div>
							</Alert>

							<FormGroup>
								<Button
									$variant="primary"
									onClick={() => {
										if (!pingOneToken) return;
										navigate('/v8u/spiffe-spire/tokens', {
											state: {
												tokens: {
													accessToken: pingOneToken.accessToken,
													idToken: pingOneToken.idToken,
													expiresIn: pingOneToken.expiresIn,
												},
											},
										});
									}}
								>
									<FiShield /> View Tokens on Dedicated Page
								</Button>
							</FormGroup>
						</Card>
					)}

					{pingOneToken && (
						<Card style={{ marginTop: '2rem' }}>
							<CardHeader>
								<FiShield />
								<h2>PingOne OAuth Token</h2>
							</CardHeader>

							<FormGroup>
								<Label>Token Metadata</Label>
								<CodeBlock>
									{`Token Type: ${pingOneToken.tokenType}
Expires In: ${pingOneToken.expiresIn} seconds (${TokenDisplayServiceV8.formatExpiry(pingOneToken.expiresIn)})
Scope: ${pingOneToken.scope}
Workload SPIFFE ID: ${svid?.spiffeId}
Issued At: ${new Date().toISOString()}`}
								</CodeBlock>
							</FormGroup>

							<Alert $type="info">
								<FiExternalLink />
								<div>
									<strong>Next Steps:</strong> Use this access token in the Authorization header
									when making API calls to PingOne-protected resources:
									<CodeBlock style={{ marginTop: '0.5rem' }}>
										{`Authorization: Bearer ${pingOneToken.accessToken.substring(0, 50)}...`}
									</CodeBlock>
								</div>
							</Alert>
						</Card>
					)}
				</div>
			</FlowContainer>

			{/* API Call Display Section - Full Width at Bottom */}
			{/* MFA-style bottom-docked PingOne/SPIFFE API history (shared across V8 flows) */}
			<SuperSimpleApiDisplayV8 />
		</PageContainer>
	);
};

export default SpiffeSpireFlowV8U;
