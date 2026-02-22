// src/pages/UltimateTokenDisplayDemo.PingUI.tsx
// Demo page showcasing the UltimateTokenDisplay component - PingOne UI Version
// PingOne UI migration following pingui2.md standards

import React, { useState } from 'react';
import UltimateTokenDisplay from '../components/UltimateTokenDisplay';
import { v4ToastManager } from '../utils/v4ToastMessages';

// PingOne UI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	style?: React.CSSProperties;
	title?: string;
}> = ({ icon, size = 24, className = '', style, title }) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: size, ...style }}
			title={title}
		/>
	);
};

// PingOne UI Styled Components (using inline styles with CSS variables)
const getContainerStyle = () => ({
	minHeight: '100vh',
	background: 'var(--pingone-surface-primary)',
	padding: 'var(--pingone-spacing-xl, 2rem) 0',
});

const getContentWrapperStyle = () => ({
	maxWidth: '90rem',
	margin: '0 auto',
	padding: '0 var(--pingone-spacing-md, 1rem)',
});

const getHeaderStyle = () => ({
	textAlign: 'center',
	marginBottom: 'var(--pingone-spacing-xl, 3rem)',
});

const getTitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-3xl, 2.5rem)',
	fontWeight: 'var(--pingone-font-weight-bold, 700)',
	color: 'var(--pingone-text-primary)',
	marginBottom: 'var(--pingone-spacing-sm, 0.5rem)',
});

const getSubtitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-lg, 1.125rem)',
	color: 'var(--pingone-text-secondary)',
	margin: '0',
});

const getControlPanelStyle = () => ({
	background: 'var(--pingone-surface-card)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-xl, 12px)',
	padding: 'var(--pingone-spacing-xl, 2rem)',
	marginBottom: 'var(--pingone-spacing-xl, 2rem)',
	boxShadow: 'var(--pingone-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1))',
});

const getControlGridStyle = () => ({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
	gap: 'var(--pingone-spacing-md, 1rem)',
});

const getControlGroupStyle = () => ({
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--pingone-spacing-sm, 0.5rem)',
});

const getLabelStyle = () => ({
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
	color: 'var(--pingone-text-primary)',
	marginBottom: 'var(--pingone-spacing-xs, 0.25rem)',
});

const getInputStyle = () => ({
	padding: 'var(--pingone-spacing-sm, 0.625rem) var(--pingone-spacing-md, 1rem)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	background: 'var(--pingone-surface-primary)',
	color: 'var(--pingone-text-primary)',
	transition: 'all 0.15s ease-in-out',
	'&:focus': {
		outline: 'none',
		borderColor: 'var(--pingone-brand-primary)',
		boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
	},
});

const getSelectStyle = () => ({
	padding: 'var(--pingone-spacing-sm, 0.625rem) var(--pingone-spacing-md, 1rem)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	background: 'var(--pingone-surface-primary)',
	color: 'var(--pingone-text-primary)',
	transition: 'all 0.15s ease-in-out',
	'&:focus': {
		outline: 'none',
		borderColor: 'var(--pingone-brand-primary)',
		boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
	},
});

const getButtonStyle = (variant: 'primary' | 'secondary' = 'primary') => ({
	background:
		variant === 'primary' ? 'var(--pingone-brand-primary)' : 'var(--pingone-surface-secondary)',
	color: variant === 'primary' ? 'var(--pingone-text-inverse)' : 'var(--pingone-text-primary)',
	border: variant === 'secondary' ? '1px solid var(--pingone-border-primary)' : 'none',
	borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
	padding: 'var(--pingone-spacing-md, 1rem) var(--pingone-spacing-lg, 1.5rem)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
	cursor: 'pointer',
	transition: 'all 0.15s ease-in-out',
	display: 'inline-flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-xs, 0.25rem)',
	'&:hover': {
		background:
			variant === 'primary'
				? 'var(--pingone-brand-primary-dark)'
				: 'var(--pingone-surface-tertiary)',
		transform: 'translateY(-1px)',
		boxShadow: 'var(--pingone-shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1))',
	},
});

const getDemoSectionStyle = () => ({
	background: 'var(--pingone-surface-card)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-lg, 0.75rem)',
	padding: 'var(--pingone-spacing-lg, 1.5rem)',
	marginBottom: 'var(--pingone-spacing-lg, 1.5rem)',
});

const getSectionTitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-lg, 1.125rem)',
	fontWeight: 'var(--pingone-font-weight-semibold, 600)',
	color: 'var(--pingone-text-primary)',
	marginBottom: 'var(--pingone-spacing-md, 1rem)',
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-sm, 0.5rem)',
});

const UltimateTokenDisplayDemoPingUI: React.FC = () => {
	const [tokenData, setTokenData] = useState({
		accessToken:
			'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
		idToken:
			'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjM5MDIyLCJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tIiwiYXVkIjoicGluZ29uZS1wbGF5Z3JvdW5kIn0.signature',
		refreshToken: 'tGzv3JOkF0XG5Qx2TlKWIA',
		tokenType: 'Bearer',
		expiresIn: 3600,
		scope: 'openid profile email',
	});

	const [displayOptions, setDisplayOptions] = useState({
		showAccessToken: true,
		showIdToken: true,
		showRefreshToken: true,
		showTokenInfo: true,
		compactMode: false,
		enableCopy: true,
		enableShare: false,
	});

	const handleTokenRefresh = () => {
		const newTokenData = {
			...tokenData,
			accessToken: `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${Date.now()}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`,
			expiresIn: tokenData.expiresIn + 300,
		};
		setTokenData(newTokenData);
		v4ToastManager.success('Token refreshed successfully!');
	};

	const handleTokenRevoke = () => {
		setTokenData({
			accessToken: '',
			idToken: '',
			refreshToken: '',
			tokenType: 'Bearer',
			expiresIn: 0,
			scope: '',
		});
		v4ToastManager.info('Token revoked successfully!');
	};

	const handleOptionChange = (option: string, value: boolean) => {
		setDisplayOptions((prev) => ({
			...prev,
			[option]: value,
		}));
	};

	return (
		<div className="end-user-nano">
			<div style={getContainerStyle()}>
				<div style={getContentWrapperStyle()}>
					{/* Header */}
					<div style={getHeaderStyle()}>
						<h1 style={getTitleStyle()}>
							<MDIIcon
								icon="token"
								size={40}
								style={{ marginRight: 'var(--pingone-spacing-md, 1rem)' }}
							/>
							Ultimate Token Display Demo
						</h1>
						<p style={getSubtitleStyle()}>
							Showcase of the comprehensive token display component with PingOne UI styling
						</p>
					</div>

					{/* Control Panel */}
					<div style={getControlPanelStyle()}>
						<h3 style={getSectionTitleStyle()}>
							<MDIIcon icon="settings" size={20} />
							Token Controls
						</h3>

						<div style={getControlGridStyle()}>
							<div style={getControlGroupStyle()}>
								<label htmlFor="accessToken" style={getLabelStyle()}>
									Access Token
								</label>
								<input
									id="accessToken"
									type="text"
									style={getInputStyle()}
									value={tokenData.accessToken}
									onChange={(e) =>
										setTokenData((prev) => ({ ...prev, accessToken: e.target.value }))
									}
									placeholder="Enter access token..."
								/>
							</div>

							<div style={getControlGroupStyle()}>
								<label htmlFor="tokenType" style={getLabelStyle()}>
									Token Type
								</label>
								<select
									id="tokenType"
									style={getSelectStyle()}
									value={tokenData.tokenType}
									onChange={(e) => setTokenData((prev) => ({ ...prev, tokenType: e.target.value }))}
								>
									<option value="Bearer">Bearer</option>
									<option value="DPoP">DPoP</option>
									<option value="MAC">MAC</option>
								</select>
							</div>

							<div style={getControlGroupStyle()}>
								<label htmlFor="expiresIn" style={getLabelStyle()}>
									Expires In (seconds)
								</label>
								<input
									id="expiresIn"
									type="number"
									style={getInputStyle()}
									value={tokenData.expiresIn}
									onChange={(e) =>
										setTokenData((prev) => ({ ...prev, expiresIn: parseInt(e.target.value) || 0 }))
									}
									placeholder="3600"
								/>
							</div>

							<div style={getControlGroupStyle()}>
								<label htmlFor="scope" style={getLabelStyle()}>
									Scope
								</label>
								<input
									id="scope"
									type="text"
									style={getInputStyle()}
									value={tokenData.scope}
									onChange={(e) => setTokenData((prev) => ({ ...prev, scope: e.target.value }))}
									placeholder="openid profile email"
								/>
							</div>
						</div>

						<div
							style={{
								display: 'flex',
								gap: 'var(--pingone-spacing-md, 1rem)',
								marginTop: 'var(--pingone-spacing-lg, 1.5rem)',
							}}
						>
							<button type="button" style={getButtonStyle('primary')} onClick={handleTokenRefresh}>
								<MDIIcon icon="refresh" size={16} />
								Refresh Token
							</button>
							<button type="button" style={getButtonStyle('secondary')} onClick={handleTokenRevoke}>
								<MDIIcon icon="delete" size={16} />
								Revoke Token
							</button>
						</div>
					</div>

					{/* Display Options */}
					<div style={getControlPanelStyle()}>
						<h3 style={getSectionTitleStyle()}>
							<MDIIcon icon="eye" size={20} />
							Display Options
						</h3>

						<div style={getControlGridStyle()}>
							{[
								{ key: 'showAccessToken', label: 'Show Access Token' },
								{ key: 'showIdToken', label: 'Show ID Token' },
								{ key: 'showRefreshToken', label: 'Show Refresh Token' },
								{ key: 'showTokenInfo', label: 'Show Token Info' },
								{ key: 'compactMode', label: 'Compact Mode' },
								{ key: 'enableCopy', label: 'Enable Copy' },
								{ key: 'enableShare', label: 'Enable Share' },
							].map((option) => (
								<div
									key={option.key}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 'var(--pingone-spacing-sm, 0.5rem)',
									}}
								>
									<input
										type="checkbox"
										id={option.key}
										checked={displayOptions[option.key as keyof typeof displayOptions] as boolean}
										onChange={(e) => handleOptionChange(option.key, e.target.checked)}
										style={{ cursor: 'pointer' }}
									/>
									<label
										htmlFor={option.key}
										style={{ cursor: 'pointer', fontSize: 'var(--pingone-font-size-sm, 0.875rem)' }}
									>
										{option.label}
									</label>
								</div>
							))}
						</div>
					</div>

					{/* Token Display Demo */}
					<div style={getDemoSectionStyle()}>
						<h3 style={getSectionTitleStyle()}>
							<MDIIcon icon="token" size={20} />
							Token Display
						</h3>

						<UltimateTokenDisplay
							tokens={{
								accessToken: displayOptions.showAccessToken ? tokenData.accessToken : '',
								idToken: displayOptions.showIdToken ? tokenData.idToken : '',
								refreshToken: displayOptions.showRefreshToken ? tokenData.refreshToken : '',
							}}
							tokenInfo={
								displayOptions.showTokenInfo
									? {
											tokenType: tokenData.tokenType,
											expiresIn: tokenData.expiresIn,
											scope: tokenData.scope,
											issuedAt: new Date().toISOString(),
											expiresAt: new Date(Date.now() + tokenData.expiresIn * 1000).toISOString(),
										}
									: undefined
							}
							options={{
								compact: displayOptions.compactMode,
								enableCopy: displayOptions.enableCopy,
								enableShare: displayOptions.enableShare,
								showDecoded: true,
								showValidation: true,
							}}
						/>
					</div>

					{/* Feature Showcase */}
					<div style={getDemoSectionStyle()}>
						<h3 style={getSectionTitleStyle()}>
							<MDIIcon icon="zap" size={20} />
							Features
						</h3>

						<div style={getControlGridStyle()}>
							{[
								'JWT Token Decoding',
								'Token Validation',
								'Copy to Clipboard',
								'Share Functionality',
								'Compact View Mode',
								'Expiration Tracking',
								'Scope Display',
								'Token Type Detection',
							].map((feature, index) => (
								<div
									key={index}
									style={{
										background: 'var(--pingone-surface-tertiary)',
										border: '1px solid var(--pingone-border-secondary)',
										borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
										padding: 'var(--pingone-spacing-md, 1rem)',
										textAlign: 'center',
									}}
								>
									<MDIIcon
										icon="check-circle"
										size={20}
										style={{
											color: 'var(--pingone-success)',
											marginBottom: 'var(--pingone-spacing-sm, 0.5rem)',
										}}
									/>
									<div
										style={{
											fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
											color: 'var(--pingone-text-primary)',
										}}
									>
										{feature}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default UltimateTokenDisplayDemoPingUI;
