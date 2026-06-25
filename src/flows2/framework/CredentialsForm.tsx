// src/flows2/framework/CredentialsForm.tsx
//
// The shared credentials grid for a flow's Configure step: Environment ID, Region,
// Client ID, Client Secret, (optional) Redirect URI, and Scope. Extracted so flows
// stop re-declaring the same six <FieldGroup>s. Flows with extra inputs (audience,
// resource, username/password, …) render those separately alongside this.

import React from 'react';
import { FieldGroup } from './FieldGroup';
import { Grid } from './primitives';
import type { FlowCredentials } from './types';

export interface CredentialsFormProps {
	creds: FlowCredentials;
	/** Curried change handler: `set('clientId')` → input onChange. Flows already define this. */
	set: (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) => void;
	/** Provide both to render the Redirect URI field (redirect-based flows only). */
	redirectUri?: string;
	onRedirectUriChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	/** Placeholder for the Scope field (e.g. 'openid profile email'). */
	scopePlaceholder?: string;
	/** Hide the Client Secret field for public clients. Default: shown. */
	showSecret?: boolean;
	/** Hide the Scope field where it doesn't apply. Default: shown. */
	showScope?: boolean;
}

export const CredentialsForm: React.FC<CredentialsFormProps> = ({
	creds,
	set,
	redirectUri,
	onRedirectUriChange,
	scopePlaceholder,
	showSecret = true,
	showScope = true,
}) => (
	<Grid>
		<FieldGroup
			label="Environment ID"
			value={creds.environmentId}
			onChange={set('environmentId')}
		/>
		<FieldGroup
			label="Region"
			value={creds.region}
			onChange={set('region')}
			placeholder="com | eu | ca | asia"
		/>
		<FieldGroup label="Client ID" value={creds.clientId} onChange={set('clientId')} />
		{showSecret && (
			<FieldGroup
				label="Client Secret"
				type="password"
				value={creds.clientSecret ?? ''}
				onChange={set('clientSecret')}
			/>
		)}
		{onRedirectUriChange && (
			<FieldGroup
				label="Redirect URI"
				value={redirectUri ?? ''}
				onChange={onRedirectUriChange}
				hint="Must be registered on the PingOne app"
			/>
		)}
		{showScope && (
			<FieldGroup
				label="Scope (optional)"
				value={creds.scope ?? ''}
				onChange={set('scope')}
				placeholder={scopePlaceholder ?? 'openid profile email'}
			/>
		)}
	</Grid>
);
