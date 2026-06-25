// src/flows2/framework/UseTokensStep.tsx
//
// The shared "Use Tokens" extension point (see docs/flows2-standardization.md §7.3).
// Drop this into any flow's final step to give it a consistent set of token tools —
// UserInfo (OIDC), Introspection (RFC 7662), Revocation (RFC 7009), and client-side
// JWT decode (RFC 7519). To add a NEW idea, add one entry to the TOOLS registry below;
// every flow that lists it in `tools` gains it. No flow file is restructured.

import React, { useState } from 'react';
import { tokenIntrospectionService } from '../services/tokenIntrospectionService';
import { tokenRevocationService } from '../services/tokenRevocationService';
import { userInfoService } from '../services/userInfoService';
import { JsonView } from './CodeBlock';
import { ExplanationPanel } from './ExplanationPanel';
import { FlowResult } from './FlowResult';
import { Action, Toggle } from './primitives';
import { ResultCard } from './ResultCard';
import type { FlowCredentials, FlowError, FlowMode, TokenResult } from './types';

export type TokenTool = 'userinfo' | 'introspect' | 'revoke' | 'decode';

// Decode a JWT's payload client-side (no signature verification — display only).
function decodeJwt(token: string): Record<string, unknown> | null {
	const parts = token.split('.');
	if (parts.length < 2) return null;
	try {
		const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
		return JSON.parse(json) as Record<string, unknown>;
	} catch {
		return null;
	}
}

interface ToolDef {
	label: string;
	title: string;
	tone: 'ok' | 'info' | 'error';
	available: (r: TokenResult) => boolean;
	run: (r: TokenResult, creds: FlowCredentials, mode: FlowMode) => Promise<unknown>;
}

const TOOLS: Record<TokenTool, ToolDef> = {
	userinfo: {
		label: 'Call UserInfo',
		title: 'UserInfo (OIDC Core §5.3)',
		tone: 'info',
		available: (r) => Boolean(r.accessToken),
		run: (r, creds, mode) =>
			userInfoService.run(
				{
					environmentId: creds.environmentId,
					region: creds.region,
					accessToken: r.accessToken ?? '',
				},
				mode
			),
	},
	introspect: {
		label: 'Introspect token',
		title: 'Introspection (RFC 7662)',
		tone: 'info',
		available: (r) => Boolean(r.accessToken),
		run: (r, creds, mode) =>
			tokenIntrospectionService.run({ credentials: creds, token: r.accessToken ?? '' }, mode),
	},
	revoke: {
		label: 'Revoke token',
		title: 'Revocation (RFC 7009)',
		tone: 'ok',
		available: (r) => Boolean(r.accessToken || r.refreshToken),
		run: (r, creds, mode) =>
			tokenRevocationService.run(
				{
					credentials: creds,
					token: r.refreshToken ?? r.accessToken ?? '',
					tokenTypeHint: r.refreshToken ? 'refresh_token' : 'access_token',
				},
				mode
			),
	},
	decode: {
		label: 'Decode JWT',
		title: 'Decoded claims (RFC 7519)',
		tone: 'info',
		available: (r) => Boolean(r.idToken || r.accessToken),
		run: async (r) => {
			const out: Record<string, unknown> = {};
			if (r.idToken) out.id_token = decodeJwt(r.idToken) ?? '(not a JWT)';
			if (r.accessToken) {
				const decoded = decodeJwt(r.accessToken);
				out.access_token = decoded ?? '(opaque — not a JWT)';
			}
			return out;
		},
	},
};

const DEFAULT_TOOLS: TokenTool[] = ['userinfo', 'introspect', 'decode'];

export interface UseTokensStepProps {
	result: TokenResult | null;
	credentials: FlowCredentials;
	mode: FlowMode;
	/** Which tools to expose; order is preserved. Defaults to userinfo + introspect + decode. */
	tools?: TokenTool[];
}

/**
 * Renders the body of a flow's final "Use the tokens" step: a row of token-tool
 * actions plus their results. Wrap it in your own <FlowStep> (keeps the step's nav).
 */
export const UseTokensStep: React.FC<UseTokensStepProps> = ({
	result,
	credentials,
	mode,
	tools = DEFAULT_TOOLS,
}) => {
	const [data, setData] = useState<Partial<Record<TokenTool, unknown>>>({});
	const [error, setError] = useState<FlowError | null>(null);
	const [busy, setBusy] = useState<TokenTool | null>(null);

	if (!result) {
		return (
			<ExplanationPanel title="No tokens yet">
				Complete the previous step to obtain tokens, then use them here.
			</ExplanationPanel>
		);
	}

	const handle = async (tool: TokenTool) => {
		setError(null);
		setBusy(tool);
		try {
			const value = await TOOLS[tool].run(result, credentials, mode);
			setData((d) => ({ ...d, [tool]: value }));
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setBusy(null);
		}
	};

	const active = tools.filter((t) => TOOLS[t].available(result));

	return (
		<>
			<Toggle>
				{active.map((t) => (
					<Action key={t} onClick={() => handle(t)} disabled={busy !== null}>
						{busy === t ? 'Working…' : TOOLS[t].label}
					</Action>
				))}
			</Toggle>
			{active.map((t) =>
				data[t] !== undefined ? (
					<ResultCard key={t} title={TOOLS[t].title} tone={TOOLS[t].tone}>
						<JsonView data={data[t] as Record<string, unknown>} />
					</ResultCard>
				) : null
			)}
			{error && <FlowResult error={error} />}
			<ExplanationPanel title="What the tokens are for">
				The access token authorizes API calls; the ID token (OIDC) carries the user's identity
				claims; introspection lets a resource server check a token's validity and scopes; revocation
				invalidates a token at the AS (RFC 7009).
			</ExplanationPanel>
		</>
	);
};
