import { V9_COLORS } from '../../services/v9/V9ColorStandards';
/**
 * @file SpecVersionSelector.tsx
 * @module v8u/components
 * @description Spec version selector component for OAuth 2.0 Authorization Framework (RFC 6749), OAuth 2.1 Authorization Framework (draft), and OpenID Connect Core 1.0 with user guidance
 * @version 8.0.0
 * @since 2024-11-16
 */


import React, { useState } from 'react';
import { type SpecVersion, SpecVersionServiceV8 } from '@/v8/services/specVersionServiceV8';
import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';

export interface SpecVersionSelectorProps {
	specVersion: SpecVersion;
	onChange: (specVersion: SpecVersion) => void;
	disabled?: boolean;
}

// User-facing labels for radio buttons (concise)
const SPEC_VERSION_BUTTON_LABELS: Record<SpecVersion, string> = {
	'oauth2.0': 'OAuth 2.0',
	oidc: 'OIDC Core 1.0',
	'oauth2.1': 'OAuth 2.1 / OIDC 2.1',
};

// User guidance for each spec version
const SPEC_GUIDANCE: Record<
	SpecVersion,
	{ description: string; whenToUse: string[]; flows: string[] }
> = {
	oidc: {
		description:
			'OpenID Connect Core 1.0 - Authentication layer on top of OAuth 2.0. Adds identity layer with ID Tokens, openid scope, UserInfo endpoint, and user authentication. Provides authorization AND authentication.',
		whenToUse: [
			'You need user authentication and identity information (ID tokens, user claims)',
			'You want ID tokens with user claims (email, name, profile, etc.)',
			'You need the UserInfo endpoint to fetch user profile data',
			'You are building a web application with user login and identity',
		],
		flows: ['Authorization Code', 'Implicit', 'Hybrid', 'Device Authorization'],
	},
	'oauth2.0': {
		description:
			'OAuth 2.0 Authorization Framework (RFC 6749) - Baseline OAuth framework standard. Provides authorization without authentication. Most flexible, supports all flow types including Implicit.',
		whenToUse: [
			'You need maximum compatibility with older systems and legacy applications',
			'You want to use Implicit Flow (deprecated in OAuth 2.1 draft)',
			'You only need authorization (API access) without user authentication',
			'You need the broadest flow type support',
		],
		flows: ['Authorization Code', 'Implicit', 'Client Credentials', 'Device Authorization'],
	},
	'oauth2.1': {
		description:
			'OAuth 2.1 Authorization Framework (draft) - Consolidated OAuth specification (IETF draft-ietf-oauth-v2-1). Removes deprecated flows (Implicit, ROPC) and enforces modern security practices. PKCE is required for Authorization Code; HTTPS enforced. Note: Still an Internet-Draft, not yet an RFC. When combined with OpenID Connect Core 1.0, this provides OIDC Core 1.0 using Authorization Code + PKCE with OAuth 2.1 (draft) baseline.',
		whenToUse: [
			'You are building new applications requiring highest security standards',
			'You want to follow the latest OAuth security best practices',
			'You can use PKCE (required for Authorization Code flow)',
			'You can use HTTPS for all redirect URIs',
			'You want future-proof implementation (even though still a draft)',
		],
		flows: ['Authorization Code', 'Client Credentials', 'Device Authorization'],
	},
};

export const SpecVersionSelector: React.FC<SpecVersionSelectorProps> = ({
	specVersion,
	onChange,
	disabled = false,
}) => {
	const [showGuidance, setShowGuidance] = useState(false);
	const [selectedGuidance, setSelectedGuidance] = useState<SpecVersion | null>(null);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newSpec = event.target.value as SpecVersion;
		log.debug(`Spec version changed`, { from: specVersion, to: newSpec });
		onChange(newSpec);
	};

	const handleGuidanceClick = (spec: SpecVersion, event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		if (selectedGuidance === spec && showGuidance) {
			setShowGuidance(false);
			setSelectedGuidance(null);
		} else {
			setSelectedGuidance(spec);
			setShowGuidance(true);
		}
	};

	const specVersions: SpecVersion[] = ['oauth2.0', 'oidc', 'oauth2.1'];
	const currentGuidance = selectedGuidance ? SPEC_GUIDANCE[selectedGuidance] : null;

	return (
		<div
			style={{
				marginBottom: '16px',
			}}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '8px',
					marginBottom: '6px',
				}}
			>
				<div
					style={{
						display: 'block',
						fontSize: '13px',
						fontWeight: '600',
						color: disabled ? V9_COLORS.TEXT.GRAY_LIGHT : V9_COLORS.TEXT.GRAY_DARK,
					}}
				>
					Specification Version
					{disabled && (
						<span
							style={{
								marginLeft: '8px',
								fontSize: '12px',
								fontWeight: '400',
								color: V9_COLORS.TEXT.GRAY_LIGHT,
								fontStyle: 'italic',
							}}
							title="Specification version cannot be changed after starting the flow"
						>
							(Locked - flow in progress)
						</span>
					)}
				</div>
				<button
					type="button"
					onClick={() => {
						if (!disabled) {
							setShowGuidance(!showGuidance);
							setSelectedGuidance(null);
						}
					}}
					disabled={disabled}
					style={{
						background: 'none',
						border: 'none',
						cursor: disabled ? 'not-allowed' : 'pointer',
						padding: '2px',
						display: 'flex',
						alignItems: 'center',
						color: disabled ? V9_COLORS.TEXT.GRAY_LIGHT : V9_COLORS.TEXT.GRAY_MEDIUM,
						opacity: disabled ? 0.6 : 1,
					}}
					title={
						disabled
							? 'Specification version cannot be changed after starting the flow'
							: 'Show guidance for all spec versions'
					}
				>
					<span style={{ fontSize: '16px' }}>❓</span>
				</button>
			</div>

			{showGuidance && !selectedGuidance && (
				<div
					style={{
						background: V9_COLORS.BG.GRAY_LIGHT,
						border: `1px solid ${V9_COLORS.PRIMARY.BLUE}`,
						borderRadius: '6px',
						padding: '12px',
						marginBottom: '12px',
						fontSize: '13px',
						color: V9_COLORS.PRIMARY.BLUE_DARK,
					}}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'flex-start',
							marginBottom: '8px',
						}}
					>
						<strong style={{ color: V9_COLORS.PRIMARY.BLUE_DARK }}>
							📚 Choosing a Specification Version
						</strong>
						<button
							type="button"
							onClick={() => setShowGuidance(false)}
							style={{
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								padding: '0',
								display: 'flex',
								alignItems: 'center',
								color: V9_COLORS.PRIMARY.BLUE_DARK,
							}}
						>
							<span style={{ fontSize: '16px' }}>❌</span>
						</button>
					</div>
					<ul style={{ margin: '0', paddingLeft: '20px', color: V9_COLORS.PRIMARY.BLUE_DARK }}>
						<li>
							<strong>OpenID Connect Core 1.0:</strong> Use when you need user authentication and
							identity information (ID tokens, openid scope, UserInfo endpoint). Adds identity layer
							on top of OAuth 2.0.
						</li>
						<li>
							<strong>OAuth 2.0 Authorization Framework (RFC 6749):</strong> Use for baseline
							authorization without authentication. Maximum compatibility, supports all flow types
							including Implicit.
						</li>
						<li>
							<strong>OAuth 2.1 Authorization Framework (draft):</strong> Use for new applications
							requiring highest security (PKCE required, HTTPS enforced). Note: Still an
							Internet-Draft. When used with OpenID Connect, this means "OIDC Core 1.0 using OAuth
							2.1 (draft) baseline".
						</li>
					</ul>
					<p
						style={{
							margin: '8px 0 0 0',
							fontSize: '12px',
							color: V9_COLORS.PRIMARY.BLUE_DARK,
						}}
					>
						Click the{' '}
						<FiHelpCircle size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> icon
						next to each option for detailed guidance.
					</p>
				</div>
			)}

			{showGuidance && selectedGuidance && currentGuidance && (
        <div
          style={{
            background: V9_COLORS.PRIMARY.YELLOW,
            border: `1px solid ${V9_COLORS.PRIMARY.YELLOW_DARK}`,
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '12px',
            fontSize: '13px',
            color: V9_COLORS.TEXT.GRAY_DARK,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '8px',
            }}
          >
            <strong style={{ color: V9_COLORS.TEXT.GRAY_DARK }}>
              📖 {SpecVersionServiceV8.getSpecLabel(selectedGuidance)} Guidance
            </strong>
            <button
              type="button"
              onClick={() => {
                setShowGuidance(false);
                setSelectedGuidance(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                color: V9_COLORS.TEXT.GRAY_DARK,
              }}
            >
              <span style={{ fontSize: '16px' }}>❌</span>
            </button>
          </div>
          <div>
            <strong style={{ color: V9_COLORS.TEXT.GRAY_DARK, fontSize: '12px' }}>
              Available flows:
            </strong>
            <span style={{ marginLeft: '6px', fontSize: '12px' }}>
              {currentGuidance.flows.join(', ')}
            </span>
          </div>
        </div>
      )}

			<div
				style={{
					display: 'flex',
					gap: '12px',
					flexWrap: 'wrap',
				}}
			>
				{specVersions.map((spec) => {
					const isSelected = specVersion === spec;

					return (
						<div key={spec} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
							<label
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: '6px',
									cursor: disabled ? 'not-allowed' : 'pointer',
									fontSize: '14px',
									color: disabled ? '#9ca3af' : '#374151',
									opacity: disabled ? 0.6 : 1,
								}}
							>
								<input
									type="radio"
									name="specVersion"
									value={spec}
									checked={isSelected}
									onChange={handleChange}
									disabled={disabled}
									style={{
										cursor: disabled ? 'not-allowed' : 'pointer',
									}}
									title={
										disabled
											? 'Specification version cannot be changed after starting the flow. Use "Restart Flow" to change specification version.'
											: undefined
									}
								/>
								<span>{SPEC_VERSION_BUTTON_LABELS[spec]}</span>
							</label>
							<button
								type="button"
								onClick={(e) => {
									if (!disabled) {
										handleGuidanceClick(spec, e);
									}
								}}
								disabled={disabled}
								style={{
									background: 'none',
									border: 'none',
									cursor: disabled ? 'not-allowed' : 'pointer',
									padding: '2px',
									display: 'flex',
									alignItems: 'center',
									color: disabled ? '#9ca3af' : '#6b7280',
									opacity: disabled ? 0.6 : 1,
								}}
								title={
									disabled
										? 'Specification version cannot be changed after starting the flow'
										: `Get guidance for ${SPEC_VERSION_BUTTON_LABELS[spec]}`
								}
							>
								<span style={{ fontSize: '14px' }}>❓</span>
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
};
