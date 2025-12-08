// src/v8/pages/MFADeviceCreateDemoV8.tsx
/**
 * @module v8/pages
 * @description Interactive page for crafting PingOne Create Device requests with editable JSON.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiMail, FiPhone, FiRefreshCw, FiUser } from 'react-icons/fi';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import SimplePingOneApiDisplayV8 from '@/v8/components/SimplePingOneApiDisplayV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import deviceCreateDemoServiceV8 from '@/v8/services/deviceCreateDemoServiceV8';
import workerTokenServiceV8 from '@/v8/services/workerTokenServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const DEFAULT_SMS_BODY = JSON.stringify(
	{
		type: 'SMS',
		phone: '+15555550123',
		nickname: 'SMS Device',
		status: 'ACTIVATION_REQUIRED',
		notification: {
			channels: [{ type: 'SMS' }],
			message: 'Your PingOne verification code is on the way.',
		},
	},
	null,
	2
);

const DEFAULT_EMAIL_BODY = JSON.stringify(
	{
		type: 'EMAIL',
		email: 'user@example.com',
		nickname: 'Email Device',
		status: 'ACTIVATION_REQUIRED',
		notification: {
			channels: [{ type: 'EMAIL' }],
			message: 'Finish your PingOne MFA setup.',
		},
	},
	null,
	2
);

const buildJsonHtml = (input: unknown): string => {
	const jsonString = JSON.stringify(input, null, 2);
	if (!jsonString) {
		return '';
	}
	const escaped = jsonString
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');

	return escaped
		.replace(/"([^"]+)"(?=\s*:)/g, '<span class="json-key">"$1"</span>')
		.replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
		.replace(/: (\d+(?:\.\d+)?)/g, ': <span class="json-number">$1</span>')
		.replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
		.replace(/: null/g, ': <span class="json-value">null</span>');
};

/**
 * Renders an editable JSON card for Create Device requests.
 */
export const MFADeviceCreateDemoV8: React.FC = () => {
	const [environmentId, setEnvironmentId] = useState('');
	const [username, setUsername] = useState('');
	const [userId, setUserId] = useState('');
	const [savedWorkerToken, setSavedWorkerToken] = useState('');
	const [workerTokenOverride, setWorkerTokenOverride] = useState('');
	const [smsBody, setSmsBody] = useState(DEFAULT_SMS_BODY);
	const [emailBody, setEmailBody] = useState(DEFAULT_EMAIL_BODY);
	const [isLookingUpUser, setIsLookingUpUser] = useState(false);
	const [smsSubmitting, setSmsSubmitting] = useState(false);
	const [emailSubmitting, setEmailSubmitting] = useState(false);
	const [lookupError, setLookupError] = useState<string | null>(null);
	const [requestError, setRequestError] = useState<string | null>(null);
	const [lastResponse, setLastResponse] = useState<Record<string, unknown> | null>(null);
	const [lastResponseType, setLastResponseType] = useState<'SMS' | 'EMAIL' | null>(null);

	useEffect(() => {
		let isMounted = true;
		const loadDefaults = async () => {
			try {
				const credentials = await workerTokenServiceV8.loadCredentials();
				const token = await workerTokenServiceV8.getToken();
				if (!isMounted) {
					return;
				}
				if (credentials?.environmentId && !environmentId) {
					setEnvironmentId(credentials.environmentId);
				}
				if (token) {
					setSavedWorkerToken(token);
				}
			} catch (error) {
				console.warn('[MFA Device Create Demo] Unable to preload worker token info', error);
			}
		};
		void loadDefaults();
		return () => {
			isMounted = false;
		};
	}, [environmentId]);

	const requestUrl = useMemo(() => {
		const envPart = environmentId?.trim() || '{environmentId}';
		const userPart = userId?.trim() || '{userId}';
		return `https://api.pingone.com/v1/environments/${envPart}/users/${userPart}/devices`;
	}, [environmentId, userId]);

	const jsonDisplay = useCallback((data: unknown) => {
		if (!data) {
			return <p style={{ margin: 0 }}>No response captured yet.</p>;
		}
		const html = buildJsonHtml(data);
		return (
			<pre
				className="json-display"
				style={{
					marginTop: '12px',
					background: 'white',
					borderRadius: '8px',
					border: '1px solid #e5e7eb',
					padding: '12px',
					maxHeight: '360px',
					overflow: 'auto',
				}}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: highlight rendering needs pre tag
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		);
	}, []);

	const resolveToken = useCallback(() => {
		if (workerTokenOverride.trim()) {
			return workerTokenOverride.trim();
		}
		return savedWorkerToken.trim();
	}, [savedWorkerToken, workerTokenOverride]);

	const handleLookupUser = useCallback(async () => {
		if (!environmentId.trim() || !username.trim()) {
			setLookupError('Environment ID and Username are required.');
			return;
		}
		setLookupError(null);
		setIsLookingUpUser(true);
		try {
			const user = await MFAServiceV8.lookupUserByUsername(environmentId.trim(), username.trim());
			setUserId(user.id);
			toastV8.success(`User found: ${user.username}`);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to lookup user';
			setLookupError(message);
			toastV8.error(message);
		} finally {
			setIsLookingUpUser(false);
		}
	}, [environmentId, username]);

	const handleSubmit = useCallback(
		async (type: 'SMS' | 'EMAIL') => {
			setRequestError(null);
			const token = resolveToken();
			if (!environmentId.trim() || !userId.trim() || !token) {
				setRequestError('Environment ID, User ID, and Worker Token are required.');
				toastV8.error('Missing environment ID, user ID, or worker token.');
				return;
			}

			const isSms = type === 'SMS';
			const setLoading = isSms ? setSmsSubmitting : setEmailSubmitting;
			const bodyText = isSms ? smsBody : emailBody;

			let parsed: Record<string, unknown>;
			try {
				const draft = JSON.parse(bodyText) as Record<string, unknown>;
				parsed = {
					...draft,
					type,
				};
				if (isSms && !parsed.phone) {
					throw new Error('SMS payload must include a "phone" value.');
				}
				if (!isSms && !parsed.email) {
					throw new Error('Email payload must include an "email" value.');
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Invalid JSON payload.';
				setRequestError(message);
				toastV8.error(message);
				return;
			}

			setLoading(true);
			try {
				const response = await deviceCreateDemoServiceV8.sendCreateDeviceRequest({
					environmentId: environmentId.trim(),
					userId: userId.trim(),
					workerToken: token,
					payload: parsed,
					description: `${type}-Create-Device`,
				});
				setLastResponse(response);
				setLastResponseType(type);
				toastV8.success(`${type} device created successfully.`);
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Create Device failed.';
				setRequestError(message);
				toastV8.error(message);
			} finally {
				setLoading(false);
			}
		},
		[environmentId, userId, resolveToken, smsBody, emailBody]
	);

	return (
		<div style={{ minHeight: '100vh', background: '#f3f4f6', paddingBottom: '80px' }}>
			<MFAHeaderV8
				title="Create Device Playground"
				description="Craft custom PingOne Create Device requests for SMS and Email with editable JSON bodies."
				currentPage="management"
				headerColor="orange"
				showRestartFlow={false}
			/>

			<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 40px' }}>
				<section
					style={{
						background: 'white',
						borderRadius: '12px',
						border: '1px solid #e5e7eb',
						padding: '20px',
						marginBottom: '24px',
						boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
					}}
				>
					<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
						<div>
							<h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>Device Context</h2>
							<p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: '14px' }}>
								Provide the environment, user, and optional worker token override. The JSON cards reuse these values.
							</p>
						</div>
						<div
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '6px',
								fontSize: '13px',
								color: savedWorkerToken ? '#047857' : '#991b1b',
							}}
						>
							{savedWorkerToken ? <FiCheckCircle /> : <FiAlertTriangle />}
							<span>{savedWorkerToken ? 'Saved worker token detected' : 'No saved worker token'}</span>
						</div>
					</header>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
							gap: '16px',
						}}
					>
						<label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#374151' }}>
							Environment ID
							<input
								type="text"
								value={environmentId}
								onChange={(event) => setEnvironmentId(event.target.value)}
								placeholder="e.g., 12345678-90ab-cdef-1234-567890abcdef"
								style={{
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '8px',
									fontSize: '14px',
								}}
							/>
						</label>

						<label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#374151' }}>
							Username (for lookup)
							<div style={{ display: 'flex', gap: '8px' }}>
								<input
									type="text"
									value={username}
									onChange={(event) => setUsername(event.target.value)}
									placeholder="user@example.com"
									style={{
										flex: 1,
										padding: '10px 12px',
										border: '1px solid #d1d5db',
										borderRadius: '8px',
										fontSize: '14px',
									}}
								/>
								<button
									type="button"
									onClick={() => {
										void handleLookupUser();
									}}
									disabled={isLookingUpUser}
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										justifyContent: 'center',
										padding: '0 12px',
										borderRadius: '8px',
										border: 'none',
										background: '#2563eb',
										color: 'white',
										fontWeight: 600,
										cursor: isLookingUpUser ? 'not-allowed' : 'pointer',
										minWidth: '120px',
									}}
								>
									{isLookingUpUser ? (
										<>
											<FiRefreshCw className="spin" />
											<span style={{ marginLeft: '6px' }}>Looking up</span>
										</>
									) : (
										<>
											<FiUser />
											<span style={{ marginLeft: '6px' }}>Lookup</span>
										</>
									)}
								</button>
							</div>
						</label>

						<label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#374151' }}>
							User ID (required)
							<input
								type="text"
								value={userId}
								onChange={(event) => setUserId(event.target.value)}
								placeholder="PingOne user ID"
								style={{
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '8px',
									fontSize: '14px',
								}}
							/>
						</label>

						<label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#374151' }}>
							Worker Token (optional override)
							<textarea
								value={workerTokenOverride}
								onChange={(event) => setWorkerTokenOverride(event.target.value)}
								placeholder="Paste a worker token to override the saved token"
								rows={3}
								style={{
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '8px',
									fontSize: '13px',
									fontFamily: 'monospace',
								}}
							/>
							<small style={{ color: '#6b7280' }}>Leave blank to use the saved worker token.</small>
						</label>
					</div>

					{lookupError && (
						<div
							style={{
								marginTop: '16px',
								padding: '12px',
								borderRadius: '8px',
								border: '1px solid #fecaca',
								background: '#fef2f2',
								color: '#b91c1c',
								display: 'flex',
								gap: '8px',
							}}
						>
							<FiAlertTriangle style={{ flexShrink: 0 }} />
							<span>{lookupError}</span>
						</div>
					)}
				</section>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
						gap: '20px',
					}}
				>
					{[
						{
							title: 'Create SMS Device',
							icon: <FiPhone />,
							body: smsBody,
							setBody: setSmsBody,
							type: 'SMS' as const,
							isLoading: smsSubmitting,
						},
						{
							title: 'Create Email Device',
							icon: <FiMail />,
							body: emailBody,
							setBody: setEmailBody,
							type: 'EMAIL' as const,
							isLoading: emailSubmitting,
						},
					].map((card) => (
						<section
							key={card.type}
							style={{
								background: 'white',
								borderRadius: '12px',
								border: '1px solid #e5e7eb',
								padding: '20px',
								boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
								display: 'flex',
								flexDirection: 'column',
							}}
						>
							<header style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
								<div
									style={{
										width: '40px',
										height: '40px',
										borderRadius: '10px',
										background: '#eef2ff',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '20px',
										color: '#4338ca',
									}}
								>
									{card.icon}
								</div>
								<div>
									<h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>{card.title}</h3>
									<p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
										Method: <strong>POST</strong> • URL: <code>{requestUrl}</code>
									</p>
								</div>
							</header>

							<label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#374151', flex: 1 }}>
								Request Body (editable JSON)
								<textarea
									value={card.body}
									onChange={(event) => card.setBody(event.target.value)}
									rows={18}
									style={{
										height: '100%',
										padding: '12px',
										border: '1px solid #d1d5db',
										borderRadius: '8px',
										fontFamily: 'monospace',
										fontSize: '13px',
										background: '#f9fafb',
									}}
								/>
							</label>

							<button
								type="button"
								onClick={() => {
									void handleSubmit(card.type);
								}}
								disabled={card.isLoading}
								style={{
									marginTop: '16px',
									padding: '12px 16px',
									borderRadius: '8px',
									border: 'none',
									background: card.type === 'SMS' ? '#059669' : '#2563eb',
									color: 'white',
									fontWeight: 600,
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '8px',
									cursor: card.isLoading ? 'not-allowed' : 'pointer',
								}}
							>
								{card.isLoading ? (
									<>
										<FiRefreshCw className="spin" />
										Sending…
									</>
								) : (
									<>
										{card.icon}
										Send {card.type} Request
									</>
								)}
							</button>
						</section>
					))}
				</div>

				{requestError && (
					<div
						style={{
							marginTop: '24px',
							padding: '14px',
							borderRadius: '8px',
							background: '#fef2f2',
							border: '1px solid #fecaca',
							color: '#b91c1c',
							display: 'flex',
							gap: '8px',
						}}
					>
						<FiAlertTriangle style={{ flexShrink: 0 }} />
						<span>{requestError}</span>
					</div>
				)}

				<section
					style={{
						marginTop: '24px',
						background: 'white',
						borderRadius: '12px',
						border: '1px solid #e5e7eb',
						padding: '20px',
						boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
					}}
				>
					<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<div>
							<h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>Latest Response</h2>
							<p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
								Responses render with the same white JSON treatment used across the playground.
							</p>
						</div>
						{lastResponseType && (
							<span
								style={{
									padding: '4px 10px',
									borderRadius: '999px',
									background: lastResponseType === 'SMS' ? '#ecfdf5' : '#dbeafe',
									color: lastResponseType === 'SMS' ? '#047857' : '#1d4ed8',
									fontWeight: 600,
									fontSize: '13px',
								}}
							>
								Last Call: {lastResponseType}
							</span>
						)}
					</header>
					{jsonDisplay(lastResponse)}
				</section>
			</div>

			<SimplePingOneApiDisplayV8 />
		</div>
	);
};

export default MFADeviceCreateDemoV8;


