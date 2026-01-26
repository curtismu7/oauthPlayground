/**
 * @file UnifiedFlowStepRenderers.tsx
 * @module v8u/components
 * @description Step rendering components extracted from UnifiedFlowSteps
 * @version 8.0.0
 * @since 2024-11-16
 */

import React, { useState } from 'react';
import { FiCopy, FiEye, FiEyeOff, FiRefreshCw } from 'react-icons/fi';
import { ColoredUrlDisplay } from '@/components/ColoredUrlDisplay';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import type { FlowState } from '../services/UnifiedFlowStateManager';
import type { UnifiedFlowCredentials } from '../services/unifiedFlowIntegrationV8U';

interface StepRenderersProps {
	credentials: UnifiedFlowCredentials;
	flowType: string;
	flowState: FlowState;
	setFlowState: React.Dispatch<React.SetStateAction<FlowState>>;
	currentStep: number;
	onCredentialsChange: (credentials: UnifiedFlowCredentials) => void;
}

// Token Display Component
const TokenDisplay: React.FC<{
	title: string;
	token: string;
	showCopy?: boolean;
}> = ({ title, token, showCopy = true }) => {
	const [isVisible, setIsVisible] = useState(false);

	const copyToken = async () => {
		try {
			await navigator.clipboard.writeText(token);
			toastV8.success(`${title} copied to clipboard`);
		} catch {
			toastV8.error('Failed to copy token');
		}
	};

	return (
		<div style={{ marginBottom: '16px' }}>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '8px',
				}}
			>
				<strong>{title}:</strong>
				<div style={{ display: 'flex', gap: '8px' }}>
					{showCopy && (
						<button
							type="button"
							onClick={copyToken}
							style={{
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								color: '#6b7280',
							}}
							title="Copy token"
						>
							<FiCopy size={16} />
						</button>
					)}
					<button
						type="button"
						onClick={() => setIsVisible(!isVisible)}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							color: '#6b7280',
						}}
						title={isVisible ? 'Hide token' : 'Show token'}
					>
						{isVisible ? <FiEyeOff size={16} /> : <FiEye size={16} />}
					</button>
				</div>
			</div>
			<div
				style={{
					background: '#f3f4f6',
					padding: '12px',
					borderRadius: '6px',
					fontFamily: 'monospace',
					fontSize: '12px',
					wordBreak: 'break-all',
					maxHeight: isVisible ? '200px' : '40px',
					overflow: 'auto',
				}}
			>
				{isVisible ? token : token.substring(0, 20) + (token.length > 20 ? '...' : '')}
			</div>
		</div>
	);
};

// Step 0: Configuration (handled by parent component)
export const renderStep0 = () => null;

// Step 3: Tokens Display
export const renderStep3Tokens = ({ flowState }: Partial<StepRenderersProps>) => {
	if (!flowState.tokens?.accessToken) {
		return (
			<div style={{ padding: '20px', textAlign: 'center' }}>
				<p>No tokens available. Please complete the previous steps first.</p>
			</div>
		);
	}

	return (
		<div style={{ padding: '20px' }}>
			<h3>🎉 Tokens Obtained Successfully!</h3>

			<TokenDisplay title="Access Token" token={flowState.tokens.accessToken} />

			{flowState.tokens.idToken && (
				<TokenDisplay title="ID Token" token={flowState.tokens.idToken} />
			)}

			{flowState.tokens.refreshToken && (
				<TokenDisplay title="Refresh Token" token={flowState.tokens.refreshToken} />
			)}

			{flowState.tokens.expiresIn && (
				<div
					style={{ marginTop: '16px', padding: '12px', background: '#fef3c7', borderRadius: '6px' }}
				>
					<strong>Token Information:</strong>
					<ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
						<li>Expires in: {flowState.tokens.expiresIn} seconds</li>
						{flowState.tokens.tokenType && <li>Token Type: {flowState.tokens.tokenType}</li>}
						{flowState.tokens.scope && <li>Scope: {flowState.tokens.scope}</li>}
					</ul>
				</div>
			)}
		</div>
	);
};

// Step 1: Authorization URL Display
export const renderStep1AuthUrl = ({ flowState }: Partial<StepRenderersProps>) => {
	if (!flowState.authUrl) {
		return (
			<div style={{ padding: '20px', textAlign: 'center' }}>
				<p>No authorization URL available. Please complete the configuration step first.</p>
			</div>
		);
	}

	return (
		<div style={{ padding: '20px' }}>
			<h3>🔗 Authorization URL Generated</h3>
			<p style={{ marginBottom: '16px' }}>
				Click the link below or copy it to start the authorization flow:
			</p>

			<ColoredUrlDisplay url={flowState.authUrl} />

			<div
				style={{ marginTop: '16px', padding: '12px', background: '#eff6ff', borderRadius: '6px' }}
			>
				<strong>Next Steps:</strong>
				<ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
					<li>Click the authorization URL above</li>
					<li>Authenticate with PingOne</li>
					<li>You will be redirected back to this application</li>
					<li>The callback will be processed automatically</li>
				</ol>
			</div>
		</div>
	);
};

// Simple loading component
export const LoadingStep: React.FC<{ message: string }> = ({ message }) => (
	<div style={{ padding: '40px', textAlign: 'center' }}>
		<div style={{ marginBottom: '16px' }}>
			<FiRefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
		</div>
		<p>{message}</p>
	</div>
);

// Error display component
export const ErrorStep: React.FC<{ error: string; onRetry?: () => void }> = ({
	error,
	onRetry,
}) => (
	<div style={{ padding: '20px' }}>
		<div
			style={{
				background: '#fef2f2',
				padding: '16px',
				borderRadius: '6px',
				border: '1px solid #fecaca',
			}}
		>
			<h4 style={{ color: '#dc2626', margin: '0 0 8px 0' }}>❌ Error</h4>
			<p style={{ margin: '0 0 16px 0', color: '#991b1b' }}>{error}</p>
			{onRetry && (
				<button
					type="button"
					onClick={onRetry}
					style={{
						padding: '8px 16px',
						background: '#dc2626',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
					}}
				>
					Retry
				</button>
			)}
		</div>
	</div>
);
