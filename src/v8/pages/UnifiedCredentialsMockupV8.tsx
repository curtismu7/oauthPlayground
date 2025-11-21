/**
 * @file UnifiedCredentialsMockupV8.tsx
 * @module v8/pages
 * @description Mock-up page demonstrating the unified credentials UI design
 * @version 8.0.0
 * @since 2024-11-16
 *
 * This is a demo/mock-up page that showcases:
 * - Spec version selection (OAuth 2.0, OAuth 2.1, OIDC)
 * - Flow type selection with smart filtering
 * - Dynamic field visibility based on spec/flow
 * - Checkbox availability and requirements
 * - Compliance warnings and validation
 *
 * Uses V8 services:
 * - SpecVersionServiceV8
 * - UnifiedFlowOptionsServiceV8
 * - FlowOptionsServiceV8
 */

import React, { useMemo, useState } from 'react';
import { FlowOptionsServiceV8 } from '@/v8/services/flowOptionsServiceV8';
import {
	type FlowType,
	type SpecVersion,
	SpecVersionServiceV8,
} from '@/v8/services/specVersionServiceV8';
import { UnifiedFlowOptionsServiceV8 } from '@/v8/services/unifiedFlowOptionsServiceV8';

const MODULE_TAG = '[🎨 UNIFIED-UI-MOCKUP-V8]';

export const UnifiedCredentialsMockupV8: React.FC = () => {
	const [specVersion, setSpecVersion] = useState<SpecVersion>('oauth2.0');
	const [flowType, setFlowType] = useState<FlowType>('oauth-authz');
	const [usePKCE, setUsePKCE] = useState(false);
	const [useRefreshToken, setUseRefreshToken] = useState(false);
	const [useRedirectUriPatterns, setUseRedirectUriPatterns] = useState(false);

	// Get available flows for current spec
	const availableFlows = useMemo(() => {
		return SpecVersionServiceV8.getAvailableFlows(specVersion);
	}, [specVersion]);

	// Ensure selected flow is available for current spec
	const effectiveFlowType = useMemo(() => {
		if (availableFlows.includes(flowType)) {
			return flowType;
		}
		return availableFlows[0] || 'oauth-authz';
	}, [flowType, availableFlows]);

	// Update flow type if current selection is not available
	if (flowType !== effectiveFlowType) {
		setFlowType(effectiveFlowType);
	}

	// Get unified options and visibility
	const flowOptions = useMemo(() => {
		return UnifiedFlowOptionsServiceV8.getOptionsForFlow(specVersion, effectiveFlowType);
	}, [specVersion, effectiveFlowType]);

	const fieldVisibility = useMemo(() => {
		return UnifiedFlowOptionsServiceV8.getFieldVisibility(specVersion, effectiveFlowType);
	}, [specVersion, effectiveFlowType]);

	const checkboxAvailability = useMemo(() => {
		return UnifiedFlowOptionsServiceV8.getCheckboxAvailability(specVersion, effectiveFlowType);
	}, [specVersion, effectiveFlowType]);

	const complianceWarnings = useMemo(() => {
		return UnifiedFlowOptionsServiceV8.getComplianceWarnings(specVersion, effectiveFlowType);
	}, [specVersion, effectiveFlowType]);

	// Get spec versions with labels
	const specVersions = UnifiedFlowOptionsServiceV8.getAllSpecVersionsWithLabels();
	const flowLabels = UnifiedFlowOptionsServiceV8.getAvailableFlowsWithLabels(specVersion);

	// Auto-enable PKCE if required
	if (checkboxAvailability.pkceRequired && !usePKCE) {
		setUsePKCE(true);
	}

	const handleSpecVersionChange = (newSpec: SpecVersion) => {
		console.log(`${MODULE_TAG} Spec version changed`, { from: specVersion, to: newSpec });
		setSpecVersion(newSpec);
		// Reset PKCE if not required in new spec
		if (newSpec !== 'oauth2.1' || effectiveFlowType !== 'oauth-authz') {
			setUsePKCE(false);
		}
	};

	const handleFlowTypeChange = (newFlow: FlowType) => {
		console.log(`${MODULE_TAG} Flow type changed`, { from: flowType, to: newFlow });
		setFlowType(newFlow);
	};

	return (
		<div className="unified-credentials-mockup-v8">
			<div className="flow-header">
				<div className="header-content">
					<div className="header-left">
						<div className="version-tag">V8 MOCKUP</div>
						<div className="header-text">
							<h1>Unified Credentials UI</h1>
							<p>Demo: Spec-aware configuration form</p>
						</div>
					</div>
				</div>
			</div>

			<div className="mockup-container">
				{/* Spec Version Selection */}
				<div className="form-section">
					<div className="section-header">
						<h3>📋 Specification Version</h3>
					</div>
					<div className="section-content">
						<div className="spec-selector">
							{specVersions.map((spec) => (
								<label key={spec.type} className="spec-radio">
									<input
										type="radio"
										name="specVersion"
										value={spec.type}
										checked={specVersion === spec.type}
										onChange={() => handleSpecVersionChange(spec.type)}
									/>
									<div className="spec-option">
										<span className="spec-name">{spec.label}</span>
										<span className="spec-description">{spec.description}</span>
									</div>
								</label>
							))}
						</div>
					</div>
				</div>

				{/* Flow Type Selection */}
				<div className="form-section">
					<div className="section-header">
						<h3>🔄 Flow Type</h3>
					</div>
					<div className="section-content">
						<div className="form-group">
							<label>Select Flow Type</label>
							<select
								value={effectiveFlowType}
								onChange={(e) => handleFlowTypeChange(e.target.value as FlowType)}
								className="flow-select"
							>
								{flowLabels.map((flow) => (
									<option key={flow.type} value={flow.type}>
										{flow.label}
									</option>
								))}
							</select>
							<small>Available flows for {SpecVersionServiceV8.getSpecLabel(specVersion)}</small>
						</div>
					</div>
				</div>

				{/* Compliance Warnings */}
				{complianceWarnings.length > 0 && (
					<div className="form-section">
						<div className="compliance-warnings">
							<div className="warnings-header">
								<strong>⚠️ Compliance Warnings</strong>
							</div>
							<ul className="warnings-list">
								{complianceWarnings.map((warning, idx) => (
									<li key={idx}>{warning}</li>
								))}
							</ul>
						</div>
					</div>
				)}

				{/* Basic Credentials */}
				<div className="form-section">
					<div className="section-header">
						<h3>🔐 Basic Authentication</h3>
					</div>
					<div className="section-content">
						{fieldVisibility.showEnvironmentId && (
							<div className="form-group">
								<label>
									Environment ID <span className="required">*</span>
								</label>
								<input type="text" placeholder="12345678-1234-1234-1234-123456789012" />
								<small>Your PingOne environment identifier</small>
							</div>
						)}

						{fieldVisibility.showClientId && (
							<div className="form-group">
								<label>
									Client ID <span className="required">*</span>
								</label>
								<input type="text" placeholder="abc123def456..." />
								<small>Public identifier for your application</small>
							</div>
						)}

						{fieldVisibility.showClientSecret && (
							<div className="form-group">
								<label>
									Client Secret
									{flowOptions.requiresClientSecret ? (
										<span className="required">*</span>
									) : (
										<span className="optional">(optional)</span>
									)}
								</label>
								<input type="password" placeholder="••••••••••••••••" />
								<small>Keep this secure - never expose in client-side code</small>
							</div>
						)}
					</div>
				</div>

				{/* Redirect Configuration */}
				{fieldVisibility.showRedirectUri && (
					<div className="form-section">
						<div className="section-header">
							<h3>🔄 Redirect Configuration</h3>
						</div>
						<div className="section-content">
							<div className="form-group">
								<label>
									Redirect URI <span className="required">*</span>
								</label>
								<input
									type="text"
									placeholder={
										useRedirectUriPatterns
											? 'https://localhost:3000/.*'
											: 'https://localhost:3000/callback'
									}
								/>
								<small>Where users return after authentication</small>
							</div>

							{checkboxAvailability.showRedirectUriPatterns && (
								<div className="checkbox-group">
									<label className="checkbox-label">
										<input
											type="checkbox"
											checked={useRedirectUriPatterns}
											onChange={(e) => setUseRedirectUriPatterns(e.target.checked)}
										/>
										<span>Allow Redirect URI Patterns</span>
									</label>
									<small>Enable regex pattern matching for flexible redirect URIs</small>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Post-Logout Redirect URI */}
				{fieldVisibility.showPostLogoutRedirectUri && (
					<div className="form-section">
						<div className="section-header">
							<h3>🚪 Logout Configuration</h3>
						</div>
						<div className="section-content">
							<div className="form-group">
								<label>
									Post-Logout Redirect URI <span className="optional">(optional)</span>
								</label>
								<input type="text" placeholder="https://localhost:3000/logout-complete" />
								<small>Where users go after logout (OIDC)</small>
							</div>
						</div>
					</div>
				)}

				{/* Scopes */}
				{fieldVisibility.showScopes && (
					<div className="form-section">
						<div className="section-header">
							<h3>🔐 Permissions</h3>
						</div>
						<div className="section-content">
							<div className="form-group">
								<label>
									Scopes <span className="required">*</span>
								</label>
								<input
									type="text"
									placeholder={
										flowOptions.requireOpenIDScope ? 'openid profile email' : 'profile email'
									}
									defaultValue={specVersion === 'oidc' ? 'openid profile email' : ''}
								/>
								<small>
									{specVersion === 'oidc'
										? 'Space-separated list - "openid" required for OIDC'
										: 'Space-separated list of requested permissions'}
								</small>
							</div>
						</div>
					</div>
				)}

				{/* Advanced Configuration */}
				<div className="form-section">
					<div className="section-header">
						<h3>⚙️ Advanced Configuration</h3>
					</div>
					<div className="section-content">
						{fieldVisibility.showResponseType && flowOptions.responseTypes.length > 0 && (
							<div className="form-group">
								<label>Response Type</label>
								<select className="flow-select">
									{flowOptions.responseTypes.map((type) => (
										<option key={type} value={type}>
											{FlowOptionsServiceV8.getResponseTypeLabel(type)}
										</option>
									))}
								</select>
								<small>Response type for the authorization endpoint</small>
							</div>
						)}

						{fieldVisibility.showAuthMethod && (
							<div className="form-group">
								<label>Token Endpoint Authentication Method</label>
								<select className="flow-select">
									{flowOptions.authMethods.map((method) => (
										<option key={method} value={method}>
											{FlowOptionsServiceV8.getAuthMethodLabel(method)}
										</option>
									))}
								</select>
								<small>How the client authenticates with the token endpoint</small>
							</div>
						)}

						{/* PKCE Checkbox */}
						{checkboxAvailability.showPKCE && (
							<div className="checkbox-group">
								<label className="checkbox-label">
									<input
										type="checkbox"
										checked={usePKCE}
										disabled={checkboxAvailability.pkceRequired}
										onChange={(e) => setUsePKCE(e.target.checked)}
									/>
									<span>
										🔐 Use PKCE (Proof Key for Code Exchange)
										{checkboxAvailability.pkceRequired && (
											<span className="required-badge">Required</span>
										)}
									</span>
								</label>
								<small>
									{checkboxAvailability.pkceRequired
										? 'PKCE is required for OAuth 2.1 Authorization Code Flow'
										: 'Enable PKCE for enhanced security with public clients'}
								</small>
								{flowOptions.pkceEnforcement && (
									<div className="info-box">
										<strong>PKCE Enforcement:</strong>{' '}
										{FlowOptionsServiceV8.getPKCELabel(flowOptions.pkceEnforcement)}
									</div>
								)}
							</div>
						)}

						{/* Refresh Token Checkbox */}
						{checkboxAvailability.showRefreshToken && (
							<div className="checkbox-group">
								<label className="checkbox-label">
									<input
										type="checkbox"
										checked={useRefreshToken}
										onChange={(e) => setUseRefreshToken(e.target.checked)}
									/>
									<span>🔄 Enable Refresh Token</span>
								</label>
								<small>Allow users to refresh access tokens without re-authenticating</small>
							</div>
						)}

						{/* OIDC-specific fields */}
						{fieldVisibility.showIdToken && (
							<div className="form-group">
								<label>ID Token Display</label>
								<div className="info-box">
									OIDC flow - ID Token will be included in the response
								</div>
							</div>
						)}

						{fieldVisibility.showUserInfo && (
							<div className="form-group">
								<label>UserInfo Endpoint</label>
								<div className="info-box">
									OIDC flow - UserInfo endpoint available for user profile information
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Action Buttons */}
				<div className="form-actions">
					<button type="button" className="btn btn-primary">
						💾 Save Configuration
					</button>
					<button type="button" className="btn btn-secondary">
						Reset
					</button>
				</div>
			</div>

			<style>{`
				.unified-credentials-mockup-v8 {
					max-width: 1200px;
					margin: 0 auto;
					background: #f8f9fa;
					min-height: 100vh;
				}

				.flow-header {
					background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
					padding: 28px 40px;
					margin-bottom: 0;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
				}

				.header-content {
					display: flex;
					align-items: center;
					justify-content: space-between;
				}

				.header-left {
					display: flex;
					align-items: flex-start;
					gap: 20px;
					flex: 1;
				}

				.version-tag {
					font-size: 11px;
					font-weight: 700;
					color: rgba(255, 255, 255, 0.9);
					letter-spacing: 1.5px;
					text-transform: uppercase;
					padding-top: 2px;
				}

				.header-text h1 {
					font-size: 26px;
					font-weight: 700;
					margin: 0 0 4px 0;
					color: #ffffff;
				}

				.header-text p {
					font-size: 13px;
					color: rgba(255, 255, 255, 0.9);
					margin: 0;
				}

				.mockup-container {
					padding: 24px;
					background: white;
					margin: 20px;
					border-radius: 8px;
					box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
				}

				.form-section {
					border: 1px solid #e2e8f0;
					border-radius: 6px;
					margin-bottom: 20px;
					overflow: hidden;
				}

				.section-header {
					background: linear-gradient(to right, #eff6ff 0%, #f0f9ff 100%);
					padding: 12px 20px;
					border-bottom: 1px solid #bfdbfe;
				}

				.section-header h3 {
					font-size: 14px;
					font-weight: 600;
					margin: 0;
					color: #0c4a6e;
				}

				.section-content {
					padding: 20px;
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
					gap: 16px;
				}

				.spec-selector {
					display: flex;
					flex-direction: column;
					gap: 12px;
					width: 100%;
				}

				.spec-radio {
					display: flex;
					align-items: center;
					gap: 12px;
					cursor: pointer;
					padding: 12px;
					border: 2px solid #e2e8f0;
					border-radius: 6px;
					transition: all 0.2s ease;
				}

				.spec-radio:hover {
					border-color: #3b82f6;
					background: #f0f9ff;
				}

				.spec-radio input[type="radio"] {
					margin: 0;
					cursor: pointer;
				}

				.spec-radio input[type="radio"]:checked ~ .spec-option {
					color: #0c4a6e;
				}

				.spec-radio:has(input[type="radio"]:checked) {
					border-color: #3b82f6;
					background: #eff6ff;
				}

				.spec-option {
					display: flex;
					flex-direction: column;
					gap: 4px;
					flex: 1;
				}

				.spec-name {
					font-weight: 600;
					font-size: 14px;
					color: #1e293b;
				}

				.spec-description {
					font-size: 12px;
					color: #64748b;
				}

				.form-group {
					display: flex;
					flex-direction: column;
					gap: 6px;
				}

				.form-group label {
					font-size: 13px;
					font-weight: 500;
					color: #334155;
				}

				.required {
					color: #ef4444;
					margin-left: 4px;
				}

				.optional {
					color: #64748b;
					font-size: 11px;
					margin-left: 4px;
				}

				.form-group input,
				.form-group select,
				.flow-select {
					padding: 10px 12px;
					border: 1px solid #cbd5e1;
					border-radius: 6px;
					font-size: 13px;
					font-family: inherit;
					background: white;
					color: #1e293b;
				}

				.form-group input:focus,
				.form-group select:focus,
				.flow-select:focus {
					outline: none;
					border-color: #3b82f6;
					box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
				}

				.form-group small {
					font-size: 11px;
					color: #64748b;
					margin-top: 2px;
				}

				.checkbox-group {
					display: flex;
					flex-direction: column;
					gap: 6px;
					padding: 12px;
					background: #f8fafc;
					border-radius: 6px;
					border: 1px solid #e2e8f0;
				}

				.checkbox-label {
					display: flex;
					align-items: center;
					gap: 8px;
					cursor: pointer;
					font-size: 13px;
					font-weight: 500;
					color: #1e293b;
				}

				.checkbox-label input[type="checkbox"] {
					cursor: pointer;
					width: 16px;
					height: 16px;
				}

				.checkbox-label input[type="checkbox"]:disabled {
					cursor: not-allowed;
					opacity: 0.6;
				}

				.required-badge {
					background: #ef4444;
					color: white;
					font-size: 10px;
					padding: 2px 6px;
					border-radius: 4px;
					margin-left: 8px;
					font-weight: 600;
				}

				.info-box {
					padding: 10px 12px;
					background: #f0f9ff;
					border: 1px solid #bfdbfe;
					border-radius: 6px;
					font-size: 12px;
					color: #0c4a6e;
					margin-top: 8px;
				}

				.compliance-warnings {
					padding: 16px;
					background: #fef3c7;
					border: 1px solid #fcd34d;
					border-radius: 6px;
					margin: 20px;
				}

				.warnings-header {
					font-size: 14px;
					font-weight: 600;
					color: #92400e;
					margin-bottom: 8px;
				}

				.warnings-list {
					margin: 0;
					padding-left: 20px;
					color: #78350f;
					font-size: 13px;
				}

				.warnings-list li {
					margin-bottom: 4px;
				}

				.form-actions {
					display: flex;
					gap: 12px;
					padding: 20px;
					border-top: 1px solid #e2e8f0;
					margin-top: 20px;
				}

				.btn {
					padding: 10px 20px;
					border: none;
					border-radius: 6px;
					font-size: 14px;
					font-weight: 600;
					cursor: pointer;
					transition: all 0.2s ease;
				}

				.btn-primary {
					background: #3b82f6;
					color: white;
				}

				.btn-primary:hover {
					background: #2563eb;
				}

				.btn-secondary {
					background: #f1f5f9;
					color: #475569;
					border: 1px solid #cbd5e1;
				}

				.btn-secondary:hover {
					background: #e2e8f0;
				}
			`}</style>
		</div>
	);
};

export default UnifiedCredentialsMockupV8;
