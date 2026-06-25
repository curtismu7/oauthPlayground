// src/flows2/flows/AuthCallback.tsx
//
// Receives the PingOne authorization-code redirect for flows2. Validates `state` (CSRF),
// writes the code into the stash, and routes back to the Authorization Code flow at the
// exchange step. Registered at /v2/flows/authz-callback (a PingOne-registered redirect URI).

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { clearStash, loadStash, saveStash } from '../framework/authzStash';
import { tokens } from '../framework/tokens';

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

const FLOW_ROUTE = '/v2/flows/authorization-code';

const AuthCallback: React.FC = () => {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const [returnTo, setReturnTo] = useState<string | undefined>(undefined);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout | null = null;

		const params = new URLSearchParams(window.location.search);
		const code = params.get('code');
		const state = params.get('state');
		const err = params.get('error');
		const errDesc = params.get('error_description');

		let stash: ReturnType<typeof loadStash> | null = null;
		let stashError: string | null = null;
		try {
			stash = loadStash();
		} catch (e) {
			stashError = 'Session storage unavailable — authorization state could not be recovered.';
		}
		const dest = stash?.returnTo || FLOW_ROUTE;

		if (stashError) {
			setError(stashError);
			timeoutId = setTimeout(() => navigate(FLOW_ROUTE), 2000);
			return () => {
				if (timeoutId) clearTimeout(timeoutId);
			};
		}

		if (err) {
			if (stash) {
				stash.error = err;
				stash.errorDescription = errDesc || undefined;
				saveStash(stash);
			}
			setReturnTo(dest);
			setError(`${err}${errDesc ? `: ${errDesc}` : ''}`);
			timeoutId = setTimeout(() => navigate(dest), 1500);
			return () => {
				if (timeoutId) clearTimeout(timeoutId);
			};
		}

		if (!stash) {
			setError('No pending authorization request found (session expired or direct navigation).');
			return;
		}

		// CSRF: the returned state MUST equal the one we stashed before redirecting.
		if (!state || state !== stash.state) {
			stash.error = 'state_mismatch';
			stash.errorDescription = 'Returned state did not match the request state (possible CSRF).';
			saveStash(stash);
			setReturnTo(dest);
			setError('State mismatch — authorization rejected.');
			timeoutId = setTimeout(() => navigate(dest), 1500);
			return () => {
				if (timeoutId) clearTimeout(timeoutId);
			};
		}

		if (!code) {
			setError('No authorization code in the callback.');
			timeoutId = setTimeout(() => navigate(FLOW_ROUTE), 2000);
			return () => {
				if (timeoutId) clearTimeout(timeoutId);
			};
		}

		stash.code = code;
		saveStash(stash);
		navigate(stash.returnTo || FLOW_ROUTE);
	}, [navigate]);

	return (
		<Wrap>
			<h2>Completing authorization…</h2>
			{error ? (
				<Msg $error>{error}</Msg>
			) : (
				<Msg>Validating the authorization code and returning to the flow.</Msg>
			)}
			{error && (
				<button type="button" onClick={() => {
					try { clearStash(); } catch (_e) { /* noop */ }
					navigate(returnTo || FLOW_ROUTE);
				}}>
					Back to flow
				</button>
			)}
		</Wrap>
	);
};

export default AuthCallback;
