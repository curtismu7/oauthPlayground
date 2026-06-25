// src/flows2/framework/SpecToggle.tsx
//
// The shared OAuth 2.0 / 2.1 (+ optional OIDC) pill toggle shown on every flow's
// Configure step. Extracted so flows stop re-declaring the same three <Pill>s.
// Pass `oidc`/`onOidcToggle` to also show the OIDC on/off pill (omit for
// machine-to-machine flows with no id_token).

import React from 'react';
import { Pill, Toggle } from './primitives';
import type { OAuthSpec } from './types';

export interface SpecToggleProps {
	spec: OAuthSpec;
	onSpecChange: (spec: OAuthSpec) => void;
	/** When provided, renders an OIDC on/off pill. */
	oidc?: boolean;
	onOidcToggle?: () => void;
}

export const SpecToggle: React.FC<SpecToggleProps> = ({
	spec,
	onSpecChange,
	oidc,
	onOidcToggle,
}) => (
	<Toggle>
		<Pill $active={spec === '2.0'} onClick={() => onSpecChange('2.0')}>
			OAuth 2.0
		</Pill>
		<Pill $active={spec === '2.1'} onClick={() => onSpecChange('2.1')}>
			OAuth 2.1
		</Pill>
		{onOidcToggle && (
			<Pill $active={Boolean(oidc)} onClick={onOidcToggle}>
				OIDC {oidc ? 'on' : 'off'}
			</Pill>
		)}
	</Toggle>
);
