// src/flows2/framework/CredentialsForm.tsx
//
// The shared credentials grid for a flow's Configure step: Environment ID, Region,
// Client ID, Client Secret, (optional) Redirect URI, and Scope. If onSave is provided
// (via useFlowCredentials), a Save button appears so the user can persist credentials
// to the central LMDB store and have them restored automatically on next page load.

import React from 'react';
import styled from 'styled-components';
import { FieldGroup } from './FieldGroup';
import { Grid } from './primitives';
import { tokens } from './tokens';
import type { FlowCredentials } from './types';

const MONO = "'IBM Plex Mono', monospace";

const SaveRow = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-top: 0.25rem;
`;

const SaveBtn = styled.button<{ $saved: boolean }>`
	font-family: ${MONO};
	font-size: 0.78rem;
	font-weight: 700;
	letter-spacing: 0.04em;
	padding: 0.45rem 1rem;
	border-radius: 6px;
	border: 1px solid
		${({ $saved }) => ($saved ? tokens.color.successBorder : tokens.color.accent)};
	background: ${({ $saved }) => ($saved ? tokens.color.successBg : tokens.color.accentBg)};
	color: ${({ $saved }) => ($saved ? tokens.color.success : tokens.color.accent)};
	cursor: pointer;
	transition: all 150ms ease;
	&:hover:not(:disabled) {
		background: ${tokens.color.accent};
		color: #fff;
		border-color: ${tokens.color.accent};
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const SaveHint = styled.span`
	font-size: 0.75rem;
	color: ${tokens.color.textMuted};
`;

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
	/** Wire up a save button — pass the save fn from useFlowCredentials(). */
	onSave?: () => void;
	saving?: boolean;
	saved?: boolean;
}

export const CredentialsForm: React.FC<CredentialsFormProps> = ({
	creds,
	set,
	redirectUri,
	onRedirectUriChange,
	scopePlaceholder,
	showSecret = true,
	showScope = true,
	onSave,
	saving = false,
	saved = false,
}) => (
	<>
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
		{onSave && (
			<SaveRow>
				<SaveBtn $saved={saved} disabled={saving} onClick={onSave}>
					{saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save credentials'}
				</SaveBtn>
				<SaveHint>Restored automatically on next visit</SaveHint>
			</SaveRow>
		)}
	</>
);
