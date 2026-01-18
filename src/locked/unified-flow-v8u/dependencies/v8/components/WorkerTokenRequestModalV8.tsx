/**
 * @file WorkerTokenRequestModalV8.tsx
 * @module v8/components
 * @description Educational modal showing worker token API request details for V8
 * @version 8.0.0
 * @since 2024-11-16
 */

import React, { useState } from 'react';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';

interface WorkerTokenRequestModalV8Props {
	isOpen: boolean;
	onClose: () => void;
	onExecute: () => Promise<string | null>; // Return generated token or null
	requestDetails: {
		tokenEndpoint: string;
		requestParams: {
			grant_type: string;
			client_id: string;
			client_secret: string;
			scope: string;
		};
		authMethod: string;
		region: string;
		resolvedHeaders: Record<string, string>;
		resolvedBody: string;
	};
	isExecuting: boolean;
	showTokenAtEnd?: boolean; // Whether to show token after generation
}

export const WorkerTokenRequestModalV8: React.FC<WorkerTokenRequestModalV8Props> = ({
	isOpen,
	onClose,
	onExecute,
	requestDetails,
	isExecuting,
	showTokenAtEnd = true,
}) => {
	const [showSecret, setShowSecret] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [generatedToken, setGeneratedToken] = useState<string | null>(null);
	const [isTokenStep, setIsTokenStep] = useState(false);

	// Lock body scroll when modal is open
	React.useEffect(() => {
		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	}, [isOpen]);

	// Handle ESC key to close modal
	React.useEffect(() => {
		if (!isOpen) return undefined;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const handleCopy = (text: string, field: string) => {
		navigator.clipboard.writeText(text);
		setCopiedField(field);
		setTimeout(() => setCopiedField(null), 2000);
	};

	const handleExecute = async () => {
		const token = await onExecute();
		if (token && showTokenAtEnd) {
			setGeneratedToken(token);
			setIsTokenStep(true);
		} else {
			onClose();
		}
	};

	const handleUseToken = () => {
		onClose();
	};

	// Reset state when modal closes
	React.useEffect(() => {
		if (!isOpen) {
			setGeneratedToken(null);
			setIsTokenStep(false);
		}
	}, [isOpen]);

	// Color code the URL parts
	const renderColoredUrl = (url: string) => {
		const parts = url.match(/(https:\/\/)([^/]+)(\/[^/]+)(\/as\/token)/);
		if (!parts) return url;

		return (
			<span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
				<span style={{ color: '#10b981' }}>{parts[1]}</span>
				<span style={{ color: '#3b82f6' }}>{parts[2]}</span>
				<span style={{ color: '#f59e0b' }}>{parts[3]}</span>
				<span style={{ color: '#8b5cf6' }}>{parts[4]}</span>
			</span>
		);
	};

	return (
		<>
			{/* Backdrop */}
			<div
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0, 0, 0, 0.6)',
					zIndex: 1001,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
				onClick={onClose}
			/>

			{/* Modal */}
			<div
				style={{
					position: 'fixed',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					background: 'white',
					borderRadius: '8px',
					boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
					zIndex: 1002,
					maxWidth: '700px',
					width: '90%',
					maxHeight: '85vh',
					overflow: 'auto',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div
					style={{
						background: 'linear-gradient(to right, #fef3c7 0%, #fde68a 100%)',
						padding: '20px 24px',
						borderBottom: '1px solid #fcd34d',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<div>
							<h2
								style={{
									margin: '0 0 4px 0',
									fontSize: '18px',
									fontWeight: '700',
									color: '#92400e',
								}}
							>
								{isTokenStep ? '🔑 Generated Worker Token' : '📡 Worker Token API Request'}
							</h2>
							<p style={{ margin: 0, fontSize: '13px', color: '#78350f' }}>
								{isTokenStep
									? 'Your worker token has been generated and saved'
									: 'Review the request details before executing'}
							</p>
						</div>
						<button
							onClick={onClose}
							style={{
								background: 'none',
								border: 'none',
								fontSize: '24px',
								cursor: 'pointer',
								color: '#92400e',
								padding: '4px 8px',
							}}
						>
							×
						</button>
					</div>
				</div>

				{/* Content */}
				<div style={{ padding: '24px' }}>
					{isTokenStep && generatedToken ? (
						<>
							{/* Token Display Step */}
							<div
								style={{
									padding: '12px',
									background: '#d1fae5',
									borderRadius: '6px',
									border: '1px solid #10b981',
									marginBottom: '20px',
									fontSize: '13px',
									color: '#065f46',
								}}
							>
								<strong>✅ Token Generated Successfully!</strong> This token will be used for API
								calls.
							</div>

							{/* Token Display */}
							<div style={{ marginBottom: '20px' }}>
								{UnifiedTokenDisplayService.showTokens(
									{ access_token: generatedToken },
									'oauth',
									'worker-token-v8',
									{
										showCopyButtons: true,
										showDecodeButtons: true,
									}
								)}
							</div>

							{/* Actions */}
							<div style={{ display: 'flex', gap: '8px' }}>
								<button
									onClick={async () => {
										if (generatedToken) {
											try {
												const { workerTokenServiceV8 } = await import('@/v8/services/workerTokenServiceV8');
												await workerTokenServiceV8.saveToken(generatedToken);
												const { toastV8 } = await import('@/v8/utils/toastNotificationsV8');
												toastV8.success('Token saved successfully!');
											} catch (error) {
												console.error('[WorkerTokenRequestModal] Failed to save token:', error);
												const { toastV8 } = await import('@/v8/utils/toastNotificationsV8');
												toastV8.error('Failed to save token');
											}
										}
									}}
									style={{
										flex: 1,
										padding: '10px 16px',
										background: '#3b82f6',
										color: 'white',
										border: 'none',
										borderRadius: '4px',
										fontSize: '14px',
										fontWeight: '600',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '6px',
									}}
								>
									💾 Save Token
								</button>
								<button
									onClick={onClose}
									style={{
										flex: 1,
										padding: '10px 16px',
										background: '#e5e7eb',
										color: '#1f2937',
										border: 'none',
										borderRadius: '4px',
										fontSize: '14px',
										fontWeight: '600',
										cursor: 'pointer',
									}}
								>
									Close
								</button>
							</div>
						</>
					) : (
						<>
							{/* Request Review Step */}
							{/* Info Box */}
							<div
								style={{
									padding: '12px',
									background: '#d1fae5',
									borderRadius: '6px',
									border: '1px solid #10b981',
									marginBottom: '20px',
									fontSize: '13px',
									color: '#065f46',
								}}
							>
								<strong>✅ Educational Mode:</strong> This shows you exactly what API call will be
								made. Review the details and click "Execute Request" to proceed.
							</div>

							{/* Token Endpoint */}
							<div style={{ marginBottom: '20px' }}>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										marginBottom: '8px',
									}}
								>
									<h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151' }}>
										🌐 Token Endpoint
									</h3>
									<button
										onClick={() => handleCopy(requestDetails.tokenEndpoint, 'endpoint')}
										style={{
											padding: '4px 8px',
											background: copiedField === 'endpoint' ? '#10b981' : '#e5e7eb',
											color: copiedField === 'endpoint' ? 'white' : '#374151',
											border: 'none',
											borderRadius: '4px',
											fontSize: '12px',
											cursor: 'pointer',
											fontWeight: '600',
										}}
									>
										{copiedField === 'endpoint' ? '✓ Copied' : '📋 Copy'}
									</button>
								</div>
								<div
									style={{
										padding: '12px',
										background: '#f9fafb',
										borderRadius: '4px',
										border: '1px solid #e5e7eb',
										wordBreak: 'break-all',
									}}
								>
									{renderColoredUrl(requestDetails.tokenEndpoint)}
								</div>
								<div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
									<strong>Method:</strong> POST | <strong>Region:</strong>{' '}
									{requestDetails.region.toUpperCase()}
								</div>
							</div>

							{/* Request Parameters */}
							<div style={{ marginBottom: '20px' }}>
								<h3
									style={{
										margin: '0 0 8px 0',
										fontSize: '14px',
										fontWeight: '600',
										color: '#374151',
									}}
								>
									📝 Request Parameters
								</h3>
								<div
									style={{
										background: 'white',
										border: '1px solid #e5e7eb',
										borderRadius: '6px',
										overflow: 'hidden',
									}}
								>
									{/* Grant Type */}
									<div
										style={{
											display: 'grid',
											gridTemplateColumns: '140px 1fr',
											borderBottom: '1px solid #e5e7eb',
										}}
									>
										<div
											style={{
												padding: '12px',
												background: '#f9fafb',
												fontWeight: '600',
												fontSize: '13px',
												color: '#374151',
											}}
										>
											grant_type
										</div>
										<div
											style={{
												padding: '12px',
												fontFamily: 'monospace',
												fontSize: '12px',
												color: '#6b7280',
											}}
										>
											{requestDetails.requestParams.grant_type}
										</div>
									</div>

									{/* Client ID */}
									<div
										style={{
											display: 'grid',
											gridTemplateColumns: '140px 1fr',
											borderBottom: '1px solid #e5e7eb',
										}}
									>
										<div
											style={{
												padding: '12px',
												background: '#f9fafb',
												fontWeight: '600',
												fontSize: '13px',
												color: '#374151',
											}}
										>
											client_id
										</div>
										<div
											style={{
												padding: '12px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
											}}
										>
											<span
												style={{
													fontFamily: 'monospace',
													fontSize: '12px',
													color: '#6b7280',
													wordBreak: 'break-all',
												}}
											>
												{requestDetails.requestParams.client_id}
											</span>
											<button
												onClick={() =>
													handleCopy(requestDetails.requestParams.client_id, 'clientId')
												}
												style={{
													padding: '4px 8px',
													background: 'none',
													border: 'none',
													color: '#6b7280',
													cursor: 'pointer',
													fontSize: '12px',
													marginLeft: '8px',
												}}
											>
												{copiedField === 'clientId' ? '✓' : '📋'}
											</button>
										</div>
									</div>

									{/* Client Secret */}
									<div style={{ display: 'grid', gridTemplateColumns: '140px 1fr' }}>
										<div
											style={{
												padding: '12px',
												background: '#f9fafb',
												fontWeight: '600',
												fontSize: '13px',
												color: '#374151',
											}}
										>
											client_secret
										</div>
										<div
											style={{
												padding: '12px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
											}}
										>
											<span
												style={{
													fontFamily: 'monospace',
													fontSize: '12px',
													color: '#6b7280',
													wordBreak: 'break-all',
												}}
											>
												{showSecret
													? requestDetails.requestParams.client_secret
													: '••••••••••••••••'}
											</span>
											<div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
												<button
													onClick={() => setShowSecret(!showSecret)}
													style={{
														padding: '4px 8px',
														background: 'none',
														border: 'none',
														color: '#6b7280',
														cursor: 'pointer',
														fontSize: '12px',
													}}
												>
													{showSecret ? '👁️' : '👁️‍🗨️'}
												</button>
												<button
													onClick={() =>
														handleCopy(requestDetails.requestParams.client_secret, 'clientSecret')
													}
													style={{
														padding: '4px 8px',
														background: 'none',
														border: 'none',
														color: '#6b7280',
														cursor: 'pointer',
														fontSize: '12px',
													}}
												>
													{copiedField === 'clientSecret' ? '✓' : '📋'}
												</button>
											</div>
										</div>
									</div>

									{/* Scope */}
									<div
										style={{
											display: 'grid',
											gridTemplateColumns: '140px 1fr',
											borderTop: '1px solid #e5e7eb',
										}}
									>
										<div
											style={{
												padding: '12px',
												background: '#f9fafb',
												fontWeight: '600',
												fontSize: '13px',
												color: '#374151',
											}}
										>
											scope
										</div>
										<div
											style={{
												padding: '12px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
											}}
										>
											<span
												style={{
													fontFamily: 'monospace',
													fontSize: '12px',
													color: '#6b7280',
													wordBreak: 'break-all',
												}}
											>
												{requestDetails.requestParams.scope}
											</span>
											<button
												onClick={() => handleCopy(requestDetails.requestParams.scope, 'scope')}
												style={{
													padding: '4px 8px',
													background: 'none',
													border: 'none',
													color: '#6b7280',
													cursor: 'pointer',
													fontSize: '12px',
													marginLeft: '8px',
												}}
											>
												{copiedField === 'scope' ? '✓' : '📋'}
											</button>
										</div>
									</div>
								</div>
							</div>

							{/* Authentication Method */}
							<div style={{ marginBottom: '20px' }}>
								<h3
									style={{
										margin: '0 0 8px 0',
										fontSize: '14px',
										fontWeight: '600',
										color: '#374151',
									}}
								>
									🔐 Authentication Method
								</h3>
								<div
									style={{
										padding: '12px',
										background: '#f9fafb',
										borderRadius: '4px',
										border: '1px solid #e5e7eb',
										fontSize: '13px',
										color: '#374151',
									}}
								>
									<strong>{requestDetails.authMethod}</strong>
									<div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
										Credentials sent in request body (POST parameters)
									</div>
								</div>
							</div>

							{/* Headers */}
							<div style={{ marginBottom: '20px' }}>
								<h3
									style={{
										margin: '0 0 8px 0',
										fontSize: '14px',
										fontWeight: '600',
										color: '#374151',
									}}
								>
									📬 HTTP Headers
								</h3>
								<div
									style={{
										background: '#f9fafb',
										border: '1px solid #e5e7eb',
										borderRadius: '6px',
										padding: '12px',
									}}
								>
									{Object.entries(requestDetails.resolvedHeaders).map(([key, value]) => (
										<div
											key={key}
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												borderBottom: '1px solid #e5e7eb',
												padding: '8px 0',
											}}
										>
											<span
												style={{
													fontWeight: 600,
													color: '#1f2937',
													fontSize: '12px',
													marginRight: '12px',
												}}
											>
												{key}
											</span>
											<code style={{ fontSize: '12px', color: '#4b5563', wordBreak: 'break-all' }}>
												{value}
											</code>
										</div>
									))}
								</div>
							</div>

							{/* Body */}
							<div style={{ marginBottom: '20px' }}>
								<h3
									style={{
										margin: '0 0 8px 0',
										fontSize: '14px',
										fontWeight: '600',
										color: '#374151',
									}}
								>
									📦 Request Body (application/x-www-form-urlencoded)
								</h3>
								<pre
									style={{
										background: '#0f172a',
										color: '#bfdbfe',
										padding: '12px',
										borderRadius: '6px',
										maxHeight: '200px',
										overflow: 'auto',
										fontSize: '12px',
									}}
								>
									{requestDetails.resolvedBody}
								</pre>
							</div>

							{/* Warning Box */}
							<div
								style={{
									padding: '12px',
									background: '#fef3c7',
									borderRadius: '6px',
									border: '1px solid #fcd34d',
									marginBottom: '20px',
									fontSize: '13px',
									color: '#92400e',
								}}
							>
								<strong>⚠️ Security Note:</strong> Worker tokens have elevated privileges. Store them
								securely and never expose them in client-side code.
							</div>

							{/* Actions */}
							<div style={{ display: 'flex', gap: '8px' }}>
								<button
									onClick={onClose}
									style={{
										flex: 1,
										padding: '10px 16px',
										background: '#e5e7eb',
										color: '#1f2937',
										border: 'none',
										borderRadius: '4px',
										fontSize: '14px',
										fontWeight: '600',
										cursor: 'pointer',
									}}
								>
									Cancel
								</button>
								<button
									onClick={handleExecute}
									disabled={isExecuting}
									style={{
										flex: 1,
										padding: '10px 16px',
										background: isExecuting ? '#9ca3af' : '#3b82f6',
										color: 'white',
										border: 'none',
										borderRadius: '4px',
										fontSize: '14px',
										fontWeight: '600',
										cursor: isExecuting ? 'not-allowed' : 'pointer',
									}}
								>
									{isExecuting ? '🔄 Executing...' : '▶️ Execute Request'}
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</>
	);
};

export default WorkerTokenRequestModalV8;
