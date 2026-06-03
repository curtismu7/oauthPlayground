// src/flows2/framework/FlowResult.tsx
//
// Renders a token result or an OAuth error. Decodes a JWT access token's claims
// inline (no signature verification) so the learner sees what PingOne returned.

import React from 'react';
import styled from 'styled-components';
import type { FlowError, TokenResult } from './types';

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`;

const Box = styled.pre<{ $tone?: 'ok' | 'error' }>`
	margin: 0;
	background: ${({ $tone }) => ($tone === 'error' ? '#fef2f2' : '#0f172a')};
	color: ${({ $tone }) => ($tone === 'error' ? '#991b1b' : '#e2e8f0')};
	border: 1px solid ${({ $tone }) => ($tone === 'error' ? '#fecaca' : '#1e293b')};
	border-radius: 10px;
	padding: 1rem;
	font-size: 0.8rem;
	line-height: 1.5;
	overflow-x: auto;
	white-space: pre-wrap;
	word-break: break-word;
`;

const Row = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
`;

const Pill = styled.span`
	font-size: 0.75rem;
	font-weight: 600;
	padding: 0.25rem 0.6rem;
	border-radius: 999px;
	background: #eff6ff;
	color: #1e3a8a;
	border: 1px solid #bfdbfe;
`;

const Label = styled.div`
	font-size: 0.8rem;
	font-weight: 700;
	color: #334155;
	text-transform: uppercase;
	letter-spacing: 0.03em;
`;

function decodeJwtPayload(token?: string): Record<string, unknown> | null {
	if (!token) return null;
	const parts = token.split('.');
	if (parts.length < 2) return null;
	try {
		const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		const json = decodeURIComponent(
			atob(b64)
				.split('')
				.map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
				.join('')
		);
		return JSON.parse(json);
	} catch {
		return null;
	}
}

export const FlowResult: React.FC<{ result?: TokenResult | null; error?: FlowError | null }> = ({
	result,
	error,
}) => {
	if (error) {
		return (
			<Wrap>
				<Label>Error</Label>
				<Box $tone="error">{JSON.stringify(error, null, 2)}</Box>
			</Wrap>
		);
	}
	if (!result) return null;

	const claims = decodeJwtPayload(result.accessToken);
	return (
		<Wrap>
			<Label>Token Response</Label>
			<Row>
				{result.tokenType && <Pill>type: {result.tokenType}</Pill>}
				{typeof result.expiresIn === 'number' && <Pill>expires_in: {result.expiresIn}s</Pill>}
				{result.scope && <Pill>scope: {result.scope}</Pill>}
			</Row>
			<Box>{JSON.stringify(result.raw, null, 2)}</Box>
			{claims && (
				<>
					<Label>Decoded access-token claims (no signature verification)</Label>
					<Box>{JSON.stringify(claims, null, 2)}</Box>
				</>
			)}
		</Wrap>
	);
};
