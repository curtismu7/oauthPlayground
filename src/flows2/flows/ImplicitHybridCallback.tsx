// src/flows2/flows/ImplicitHybridCallback.tsx
//
// Dedicated callback handler for the Implicit + Hybrid flow.
// Registered at /v2/flows/implicit-hybrid-callback — the redirect_uri the app sends
// to PingOne's /as/authorize with response_mode=fragment.
//
// KEY DIFFERENCE from AuthCallback.tsx (which handles code-in-QUERY for Authorization Code):
// Both implicit and hybrid return their front-channel params in the URL *fragment* (#…).
// The fragment is never sent to the server; this component reads window.location.hash,
// validates state against a dedicated sessionStorage key, stashes the result, then
// navigate()s back to the flow — which picks up the stash on mount.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { tokens } from '../framework/tokens';
import { parseFragment } from '../services/implicitHybridService';

// ── sessionStorage keys ──────────────────────────────────────────────────────

export const IH_PENDING_KEY = 'flows2:implicitHybrid:pending';
export const IH_RESULT_KEY = 'flows2:implicitHybrid:result';

export interface ImplicitHybridPending {
	state: string;
	nonce: string;
	subMode: 'implicit' | 'hybrid';
	oidc: boolean;
	environmentId: string;
	region: string;
	clientId: string;
	redirectUri: string;
	scope?: string;
}

// ── Styled components ────────────────────────────────────────────────────────

const Wrap = styled.div`
	max-width: 560px;
	margin: 4rem auto;
	padding: 2rem;
	text-align: center;
	color: ${tokens.color.text};
`;

const Msg = styled.p<{ $error?: boolean }>`
	font-size: 0.95rem;
	color: ${({ $error }) => ($error ? tokens.color.error : tokens.color.textMuted)};
`;

const BackBtn = styled.button`
	margin-top: 1rem;
	font-size: 0.9rem;
	padding: 0.5rem 1rem;
	border-radius: 8px;
	border: 1px solid ${tokens.color.border};
	background: #fff;
	cursor: pointer;
`;

// ── Component ────────────────────────────────────────────────────────────────

const FLOW_ROUTE = '/v2/flows/implicit-hybrid';

const ImplicitHybridCallback: React.FC = () => {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Read the fragment (everything after '#').
		const hash = window.location.hash;
		const fragment = parseFragment(hash);

		// Check for an error in the fragment (OAuth error response in fragment).
		const err = fragment.error;
		if (err) {
			const desc = fragment.error_description ?? '';
			setError(`${err}${desc ? `: ${desc}` : ''}`);
			const t = setTimeout(() => navigate(FLOW_ROUTE), 1500);
			return () => clearTimeout(t);
		}

		// Load and validate the pending stash.
		let pending: ImplicitHybridPending | null = null;
		try {
			const raw = sessionStorage.getItem(IH_PENDING_KEY);
			pending = raw ? (JSON.parse(raw) as ImplicitHybridPending) : null;
		} catch {
			// sessionStorage unavailable
		}

		if (pending && (!pending.state || !pending.nonce)) {
			setError('Corrupted pending authorization state.');
			return;
		}

		if (!pending) {
			setError(
				'No pending authorization request found (session expired or direct navigation).'
			);
			return;
		}

		// CSRF: the state echoed in the fragment must match what we stashed.
		const returnedState = fragment.state;
		if (!returnedState || returnedState !== pending.state) {
			setError('State mismatch — authorization rejected (possible CSRF).');
			const t = setTimeout(() => navigate(FLOW_ROUTE), 1500);
			return () => clearTimeout(t);
		}

		// Persist the raw fragment params so the flow can read them on mount.
		try {
			sessionStorage.removeItem(IH_PENDING_KEY);
			sessionStorage.setItem(IH_RESULT_KEY, JSON.stringify(fragment));
		} catch {
			// sessionStorage unavailable — the flow will show an empty result
		}

		// Navigate back to the flow. Replace so the callback URL is not in history.
		navigate(FLOW_ROUTE, { replace: true });
	}, [navigate]);

	function handleBack() {
		try {
			sessionStorage.removeItem(IH_PENDING_KEY);
			sessionStorage.removeItem(IH_RESULT_KEY);
		} catch {
			// noop
		}
		navigate(FLOW_ROUTE);
	}

	return (
		<Wrap>
			<h2>Processing authorization…</h2>
			{error ? (
				<>
					<Msg $error>{error}</Msg>
					<BackBtn type="button" onClick={handleBack}>
						Back to flow
					</BackBtn>
				</>
			) : (
				<Msg>Reading the authorization response from the URL fragment.</Msg>
			)}
		</Wrap>
	);
};

export default ImplicitHybridCallback;
