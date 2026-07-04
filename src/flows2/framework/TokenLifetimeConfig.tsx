// src/flows2/framework/TokenLifetimeConfig.tsx
//
// PingOne token lifetime configuration component. Teaches learners how
// access_token, id_token, and refresh_token validity periods affect the flow.
// Integrated into all flows' Configure steps.

import React from 'react';
import { FieldGroup } from './FieldGroup';
import { Grid } from './primitives';

export interface TokenLifetimes {
	accessTokenSeconds?: number;
	idTokenSeconds?: number;
	refreshTokenSeconds?: number;
}

export interface TokenLifetimeConfigProps {
	lifetimes: TokenLifetimes;
	/** Curried: onChange('accessTokenSeconds')(3600) → updates state */
	onChange: (key: keyof TokenLifetimes) => (value: number | string) => void;
	/** Show the ID token lifetime field (OIDC flows only). */
	showIdToken?: boolean;
	/** Show the refresh token lifetime field (flows that yield refresh_token). */
	showRefreshToken?: boolean;
}

export const TokenLifetimeConfig: React.FC<TokenLifetimeConfigProps> = ({
	lifetimes,
	onChange,
	showIdToken = false,
	showRefreshToken = false,
}) => (
	<Grid>
		<FieldGroup
			label="Access Token Lifetime (seconds)"
			type="number"
			value={lifetimes.accessTokenSeconds ?? 3600}
			onChange={(e) => onChange('accessTokenSeconds')(e.target.value)}
			placeholder="3600"
			hint="How long the access token remains valid"
		/>
		{showIdToken && (
			<FieldGroup
				label="ID Token Lifetime (seconds)"
				type="number"
				value={lifetimes.idTokenSeconds ?? 3600}
				onChange={(e) => onChange('idTokenSeconds')(e.target.value)}
				placeholder="3600"
				hint="OIDC: how long the id_token remains valid"
			/>
		)}
		{showRefreshToken && (
			<FieldGroup
				label="Refresh Token Lifetime (seconds)"
				type="number"
				value={lifetimes.refreshTokenSeconds ?? 86400}
				onChange={(e) => onChange('refreshTokenSeconds')(e.target.value)}
				placeholder="86400"
				hint="How long before the refresh token expires"
			/>
		)}
	</Grid>
);
