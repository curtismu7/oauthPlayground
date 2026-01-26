/**
 * @file UnifiedFlowModals.tsx
 * @module v8u/components
 * @description Modal components extracted from UnifiedFlowSteps
 * @version 8.0.0
 * @since 2024-11-16
 */

import React, { useState } from 'react';
import { FiCheckCircle, FiCopy, FiX } from 'react-icons/fi';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

// Local type definition since CallbackDetails is not exported from services
interface CallbackDetails {
	url: string;
	code?: string;
	state?: string;
	sessionState?: string;
	allParams: Record<string, string>;
	authorizationCode?: string;
	error?: string;
	errorDescription?: string;
}

interface UnifiedFlowModalsProps {
	showUserInfoModal: boolean;
	setShowUserInfoModal: React.Dispatch<React.SetStateAction<boolean>>;
	showPollingTimeoutModal: boolean;
	setShowPollingTimeoutModal: React.Dispatch<React.SetStateAction<boolean>>;
	showDeviceCodeSuccessModal: boolean;
	setShowDeviceCodeSuccessModal: React.Dispatch<React.SetStateAction<boolean>>;
	showCallbackSuccessModal: boolean;
	setShowCallbackSuccessModal: React.Dispatch<React.SetStateAction<boolean>>;
	callbackDetails: CallbackDetails | null;
	userInfo: any;
	flowType: string;
	deviceCode: string;
	userCode: string;
	verificationUri: string;
}

export const UnifiedFlowModals: React.FC<UnifiedFlowModalsProps> = ({
	showUserInfoModal,
	setShowUserInfoModal,
	showPollingTimeoutModal,
	setShowPollingTimeoutModal,
	showDeviceCodeSuccessModal,
	setShowDeviceCodeSuccessModal,
	showCallbackSuccessModal,
	setShowCallbackSuccessModal,
	callbackDetails,
	userInfo,
	flowType,
	deviceCode,
	userCode,
	verificationUri,
}) => {
	const [copiedSection, setCopiedSection] = useState<string | null>(null);

	const copyToClipboard = async (text: string, section: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedSection(section);
			toastV8.success(`${section} copied to clipboard`);
			setTimeout(() => setCopiedSection(null), 2000);
		} catch (error) {
			toastV8.error('Failed to copy to clipboard');
		}
	};

	// UserInfo Modal
	const renderUserInfoModal = () => {
		if (!showUserInfoModal) return null;

		return (
			<div
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 9999,
				}}
				onClick={() => setShowUserInfoModal(false)}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						setShowUserInfoModal(false);
					}
				}}
			>
				<section
					style={{
						background: 'white',
						borderRadius: '12px',
						padding: '24px',
						maxWidth: '500px',
						width: '90%',
						maxHeight: '80vh',
						overflow: 'auto',
						boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '16px',
						}}
					>
						<h3 style={{ margin: 0, color: '#1f2937' }}>User Information</h3>
						<button
							type="button"
							onClick={() => setShowUserInfoModal(false)}
							style={{
								background: 'none',
								border: 'none',
								fontSize: '24px',
								cursor: 'pointer',
								color: '#6b7280',
							}}
						>
							<FiX />
						</button>
					</div>

					{userInfo ? (
						<div>
							<div style={{ marginBottom: '16px' }}>
								<strong>Subject:</strong> {userInfo.sub}
							</div>
							{userInfo.name && (
								<div style={{ marginBottom: '16px' }}>
									<strong>Name:</strong> {userInfo.name}
								</div>
							)}
							{userInfo.email && (
								<div style={{ marginBottom: '16px' }}>
									<strong>Email:</strong> {userInfo.email}
								</div>
							)}
							{userInfo.preferred_username && (
								<div style={{ marginBottom: '16px' }}>
									<strong>Username:</strong> {userInfo.preferred_username}
								</div>
							)}

							<div style={{ marginTop: '24px' }}>
								<strong>Raw Claims:</strong>
								<pre
									style={{
										background: '#f3f4f6',
										padding: '12px',
										borderRadius: '6px',
										fontSize: '12px',
										overflow: 'auto',
										maxHeight: '200px',
									}}
								>
									{JSON.stringify(userInfo, null, 2)}
								</pre>
							</div>

							<button
								type="button"
								onClick={() => copyToClipboard(JSON.stringify(userInfo, null, 2), 'UserInfo')}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									padding: '8px 16px',
									background: '#3b82f6',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
								}}
							>
								<FiCopy size={16} />
								{copiedSection === 'UserInfo' ? 'Copied!' : 'Copy UserInfo'}
							</button>
						</div>
					) : (
						<p>No user information available</p>
					)}
				</section>
			</div>
		);
	};

	// Polling Timeout Modal
	const renderPollingTimeoutModal = () => {
		if (!showPollingTimeoutModal) return null;

		return (
			<div
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 9999,
				}}
				onClick={() => setShowPollingTimeoutModal(false)}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						setShowPollingTimeoutModal(false);
					}
				}}
			>
				<section
					style={{
						background: 'white',
						borderRadius: '12px',
						padding: '24px',
						maxWidth: '400px',
						width: '90%',
						boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '16px',
						}}
					>
						<h3 style={{ margin: 0, color: '#1f2937' }}>Polling Timeout</h3>
						<button
							type="button"
							onClick={() => setShowPollingTimeoutModal(false)}
							style={{
								background: 'none',
								border: 'none',
								fontSize: '24px',
								cursor: 'pointer',
								color: '#6b7280',
							}}
						>
							<FiX />
						</button>
					</div>

					<p style={{ marginBottom: '16px' }}>
						The device authorization polling has timed out. This usually means:
					</p>
					<ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>
						<li>The authorization was not completed within the time limit</li>
						<li>The device code has expired</li>
						<li>There was an issue with the authorization process</li>
					</ul>

					<div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
						<button
							type="button"
							onClick={() => setShowPollingTimeoutModal(false)}
							style={{
								padding: '8px 16px',
								background: '#6b7280',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								cursor: 'pointer',
							}}
						>
							Close
						</button>
					</div>
				</section>
			</div>
		);
	};

	// Device Code Success Modal
	const renderDeviceCodeSuccessModal = () => {
		if (!showDeviceCodeSuccessModal) return null;

		return (
			<div
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 9999,
				}}
				onClick={() => setShowDeviceCodeSuccessModal(false)}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						setShowDeviceCodeSuccessModal(false);
					}
				}}
			>
				<section
					style={{
						background: 'white',
						borderRadius: '12px',
						padding: '24px',
						maxWidth: '500px',
						width: '90%',
						boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '16px',
						}}
					>
						<h3
							style={{
								margin: 0,
								color: '#1f2937',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
							}}
						>
							<FiCheckCircle color="#22c55e" />
							Device Authorization Started
						</h3>
						<button
							type="button"
							onClick={() => setShowDeviceCodeSuccessModal(false)}
							style={{
								background: 'none',
								border: 'none',
								fontSize: '24px',
								cursor: 'pointer',
								color: '#6b7280',
							}}
						>
							<FiX />
						</button>
					</div>

					<div style={{ marginBottom: '16px' }}>
						<p style={{ marginBottom: '12px' }}>
							<strong>Step 1:</strong> Visit the verification URL on your device or computer:
						</p>
						<div
							style={{
								background: '#f3f4f6',
								padding: '12px',
								borderRadius: '6px',
								fontFamily: 'monospace',
								wordBreak: 'break-all',
								marginBottom: '16px',
							}}
						>
							{verificationUri}
						</div>
						<button
							type="button"
							onClick={() => copyToClipboard(verificationUri, 'Verification URL')}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '6px 12px',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '14px',
								marginBottom: '16px',
							}}
						>
							<FiCopy size={14} />
							{copiedSection === 'Verification URL' ? 'Copied!' : 'Copy URL'}
						</button>
					</div>

					<div style={{ marginBottom: '16px' }}>
						<p style={{ marginBottom: '12px' }}>
							<strong>Step 2:</strong> Enter this device code:
						</p>
						<div
							style={{
								background: '#f3f4f6',
								padding: '12px',
								borderRadius: '6px',
								fontFamily: 'monospace',
								fontSize: '18px',
								textAlign: 'center',
								letterSpacing: '2px',
								marginBottom: '16px',
							}}
						>
							{userCode}
						</div>
						<button
							type="button"
							onClick={() => copyToClipboard(userCode, 'Device Code')}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '6px 12px',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '14px',
								marginBottom: '16px',
							}}
						>
							<FiCopy size={14} />
							{copiedSection === 'Device Code' ? 'Copied!' : 'Copy Code'}
						</button>
					</div>

					<div
						style={{
							background: '#fef3c7',
							padding: '12px',
							borderRadius: '6px',
							marginBottom: '16px',
						}}
					>
						<p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
							<strong>Note:</strong> The application will continue polling for authorization. Once
							you approve the request on your device, the tokens will be automatically obtained.
						</p>
					</div>

					<div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
						<button
							type="button"
							onClick={() => setShowDeviceCodeSuccessModal(false)}
							style={{
								padding: '8px 16px',
								background: '#22c55e',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								cursor: 'pointer',
							}}
						>
							Continue
						</button>
					</div>
				</section>
			</div>
		);
	};

	// Callback Success Modal
	const renderCallbackSuccessModal = () => {
		if (!showCallbackSuccessModal || !callbackDetails) return null;

		return (
			<div
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 9999,
				}}
				onClick={() => setShowCallbackSuccessModal(false)}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						setShowCallbackSuccessModal(false);
					}
				}}
			>
				<section
					style={{
						background: 'white',
						borderRadius: '12px',
						padding: '24px',
						maxWidth: '600px',
						width: '90%',
						maxHeight: '80vh',
						overflow: 'auto',
						boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '16px',
						}}
					>
						<h3
							style={{
								margin: 0,
								color: '#1f2937',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
							}}
						>
							<FiCheckCircle color="#22c55e" />
							Authorization Successful
						</h3>
						<button
							type="button"
							onClick={() => setShowCallbackSuccessModal(false)}
							style={{
								background: 'none',
								border: 'none',
								fontSize: '24px',
								cursor: 'pointer',
								color: '#6b7280',
							}}
						>
							<FiX />
						</button>
					</div>

					<div style={{ marginBottom: '20px' }}>
						<h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Callback Details:</h4>
						<div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
							{callbackDetails.authorizationCode && (
								<div style={{ marginBottom: '12px' }}>
									<strong>Authorization Code:</strong>
									<div
										style={{
											background: '#f3f4f6',
											padding: '8px',
											borderRadius: '4px',
											fontFamily: 'monospace',
											fontSize: '12px',
											wordBreak: 'break-all',
											marginTop: '4px',
										}}
									>
										{callbackDetails.authorizationCode}
									</div>
								</div>
							)}

							{callbackDetails.state && (
								<div style={{ marginBottom: '12px' }}>
									<strong>State:</strong> {callbackDetails.state}
								</div>
							)}

							{callbackDetails.error && (
								<div style={{ marginBottom: '12px', color: '#dc2626' }}>
									<strong>Error:</strong> {callbackDetails.error}
								</div>
							)}

							{callbackDetails.errorDescription && (
								<div style={{ marginBottom: '12px', color: '#dc2626' }}>
									<strong>Error Description:</strong> {callbackDetails.errorDescription}
								</div>
							)}
						</div>
					</div>

					{flowType === 'oauth-authz' || flowType === 'hybrid' ? (
						<div style={{ marginBottom: '20px' }}>
							<h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Next Steps:</h4>
							<ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
								<li>Click "Close" below to continue</li>
								<li>Click "Exchange Code for Tokens" to complete the flow</li>
								<li>Your access token, ID token, and refresh token will be displayed</li>
								<li>Exchange the authorization code for tokens</li>
							</ol>
						</div>
					) : (
						<div style={{ marginBottom: '20px' }}>
							<h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Next Steps:</h4>
							<ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
								<li>Click "Close" below to continue</li>
								<li>Tokens have been automatically extracted!</li>
								<li>Click "Next Step" to view and use your tokens</li>
							</ol>
						</div>
					)}

					<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
						<button
							type="button"
							onClick={() => setShowCallbackSuccessModal(false)}
							style={{
								width: '100%',
								padding: '12px',
								background: '#22c55e',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								fontSize: '16px',
								fontWeight: '600',
								cursor: 'pointer',
								flexShrink: 0,
							}}
						>
							Close
						</button>
					</div>
				</section>
			</div>
		);
	};

	return (
		<>
			{renderUserInfoModal()}
			{renderCallbackSuccessModal()}
			{renderPollingTimeoutModal()}
			{renderDeviceCodeSuccessModal()}
		</>
	);
};
