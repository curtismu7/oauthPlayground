/**
 * @file SpecVersionSelector.tsx
 * @module v8u/components
 * @description Spec version selector component (OAuth 2.0, OAuth 2.1, OIDC)
 * @version 8.0.0
 * @since 2024-11-16
 */

import React from 'react';
import { type SpecVersion, SpecVersionServiceV8 } from '@/v8/services/specVersionServiceV8';

const MODULE_TAG = '[📋 SPEC-VERSION-SELECTOR-V8U]';

export interface SpecVersionSelectorProps {
	specVersion: SpecVersion;
	onChange: (specVersion: SpecVersion) => void;
}

export const SpecVersionSelector: React.FC<SpecVersionSelectorProps> = ({
	specVersion,
	onChange,
}) => {
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newSpec = event.target.value as SpecVersion;
		console.log(`${MODULE_TAG} Spec version changed`, { from: specVersion, to: newSpec });
		onChange(newSpec);
	};

	const specVersions: SpecVersion[] = ['oauth2.0', 'oauth2.1', 'oidc'];

	return (
		<div
			style={{
				marginBottom: '16px',
			}}
		>
			<label
				style={{
					display: 'block',
					fontSize: '13px',
					fontWeight: '600',
					color: '#374151',
					marginBottom: '6px',
				}}
			>
				Specification Version
			</label>
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
						<label
							key={spec}
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
					);
				})}
			</div>
		</div>
	);
};
