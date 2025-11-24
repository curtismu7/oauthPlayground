/**
 * @file SpecVersionSelector.tsx
 * @module v8u/components
 * @description Spec version selector component (OAuth 2.0, OAuth 2.1, OIDC) with user guidance
 * @version 8.0.0
 * @since 2024-11-16
 */

import React, { useState } from 'react';
import { type SpecVersion, SpecVersionServiceV8 } from '@/v8/services/specVersionServiceV8';
import { FiHelpCircle, FiX } from 'react-icons/fi';

const MODULE_TAG = '[📋 SPEC-VERSION-SELECTOR-V8U]';

export interface SpecVersionSelectorProps {
	specVersion: SpecVersion;
	onChange: (specVersion: SpecVersion) => void;
}

// User guidance for each spec version
const SPEC_GUIDANCE: Record<SpecVersion, { description: string; whenToUse: string[]; flows: string[] }> = {
	oidc: {
		description: 'Authentication layer on OAuth 2.0. Best for user authentication and identity.',
		whenToUse: [
			'You need user authentication and identity information',
			'You want ID tokens with user claims',
			'You need user profile information (email, name, etc.)',
			'You are building a web application with user login',
		],
		flows: ['Authorization Code', 'Implicit', 'Hybrid', 'Device Authorization'],
	},
	'oauth2.0': {
		description: 'Standard OAuth 2.0 (RFC 6749). Most flexible, supports all flow types.',
		whenToUse: [
			'You need maximum compatibility with older systems',
			'You want to use Implicit Flow (deprecated in 2.1)',
			'You are working with legacy applications',
			'You need the broadest flow type support',
		],
		flows: ['Authorization Code', 'Implicit', 'Client Credentials', 'Device Authorization'],
	},
	'oauth2.1': {
		description: 'Modern OAuth 2.0 with security best practices. PKCE required, HTTPS enforced.',
		whenToUse: [
			'You are building new applications',
			'You want the highest security standards',
			'You can use PKCE (required)',
			'You can use HTTPS for all redirect URIs',
		],
		flows: ['Authorization Code', 'Client Credentials', 'Device Authorization'],
	},
};

export const SpecVersionSelector: React.FC<SpecVersionSelectorProps> = ({
	specVersion,
	onChange,
}) => {
	const [showGuidance, setShowGuidance] = useState(false);
	const [selectedGuidance, setSelectedGuidance] = useState<SpecVersion | null>(null);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newSpec = event.target.value as SpecVersion;
		console.log(`${MODULE_TAG} Spec version changed`, { from: specVersion, to: newSpec });
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

	const specVersions: SpecVersion[] = ['oidc', 'oauth2.0', 'oauth2.1'];
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
				<label
					style={{
						display: 'block',
						fontSize: '13px',
						fontWeight: '600',
						color: '#374151',
					}}
				>
					Specification Version
				</label>
				<button
					type="button"
					onClick={() => {
						setShowGuidance(!showGuidance);
						setSelectedGuidance(null);
					}}
					style={{
						background: 'none',
						border: 'none',
						cursor: 'pointer',
						padding: '2px',
						display: 'flex',
						alignItems: 'center',
						color: '#6b7280',
					}}
					title="Show guidance for all spec versions"
				>
					<FiHelpCircle size={16} />
				</button>
			</div>

			{showGuidance && !selectedGuidance && (
				<div
					style={{
						background: '#f0f9ff',
						border: '1px solid #bae6fd',
						borderRadius: '6px',
						padding: '12px',
						marginBottom: '12px',
						fontSize: '13px',
						color: '#1e40af',
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
						<strong style={{ color: '#1e40af' }}>📚 Choosing a Specification Version</strong>
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
								color: '#1e40af',
							}}
						>
							<FiX size={16} />
						</button>
					</div>
					<ul style={{ margin: '0', paddingLeft: '20px', color: '#1e40af' }}>
						<li>
							<strong>OpenID Connect:</strong> Use when you need user authentication and identity
							information (ID tokens, user claims)
						</li>
						<li>
							<strong>OAuth 2.0:</strong> Use for maximum compatibility and flexibility (supports all
							flow types)
						</li>
						<li>
							<strong>OAuth 2.1:</strong> Use for new applications requiring highest security (PKCE
							required, HTTPS enforced)
						</li>
					</ul>
					<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#1e40af' }}>
						Click the <FiHelpCircle size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
						icon next to each option for detailed guidance.
					</p>
				</div>
			)}

			{showGuidance && selectedGuidance && currentGuidance && (
				<div
					style={{
						background: '#fef3c7',
						border: '1px solid #fbbf24',
						borderRadius: '6px',
						padding: '12px',
						marginBottom: '12px',
						fontSize: '13px',
						color: '#92400e',
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
						<strong style={{ color: '#92400e' }}>
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
								color: '#92400e',
							}}
						>
							<FiX size={16} />
						</button>
					</div>
					<p style={{ margin: '0 0 8px 0', color: '#92400e' }}>{currentGuidance.description}</p>
					<div style={{ marginBottom: '8px' }}>
						<strong style={{ color: '#92400e', fontSize: '12px' }}>When to use:</strong>
						<ul style={{ margin: '4px 0 0 20px', padding: 0, color: '#92400e' }}>
							{currentGuidance.whenToUse.map((use, idx) => (
								<li key={idx} style={{ fontSize: '12px' }}>
									{use}
								</li>
							))}
						</ul>
					</div>
					<div>
						<strong style={{ color: '#92400e', fontSize: '12px' }}>Available flows:</strong>
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
					const label = SpecVersionServiceV8.getSpecLabel(spec);
					const isSelected = specVersion === spec;

					return (
						<div key={spec} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
							<label
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: '6px',
									cursor: 'pointer',
									fontSize: '14px',
									color: '#374151',
								}}
							>
								<input
									type="radio"
									name="specVersion"
									value={spec}
									checked={isSelected}
									onChange={handleChange}
									style={{
										cursor: 'pointer',
									}}
								/>
								<span>{label}</span>
							</label>
							<button
								type="button"
								onClick={(e) => handleGuidanceClick(spec, e)}
								style={{
									background: 'none',
									border: 'none',
									cursor: 'pointer',
									padding: '2px',
									display: 'flex',
									alignItems: 'center',
									color: '#6b7280',
								}}
								title={`Get guidance for ${label}`}
							>
								<FiHelpCircle size={14} />
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
};
