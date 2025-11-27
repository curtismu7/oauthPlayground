// src/v8/pages/DeviceAuthenticationDetailsV8.tsx
/**
 * @module v8/pages
 * @description Displays PingOne MFA device authentication status after initialization
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
	FiAlertTriangle,
	FiArrowLeft,
	FiCheckCircle,
	FiClock,
	FiExternalLink,
	FiRefreshCw,
	FiShield,
} from 'react-icons/fi';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import workerTokenServiceV8 from '@/v8/services/workerTokenServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

interface DeviceAuthenticationRecord {
	success?: boolean;
	environmentId?: string;
	authenticationId?: string;
	region?: string;
	response?: Record<string, unknown>;
	[key: string]: unknown;
}

const MODULE_TAG = '[📱 MFA-DEVICE-AUTH-DETAILS-V8]';
const DEFAULT_REGION = 'na';

const escapeHtml = (value: string): string =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');

const buildJsonHtml = (input: unknown): string => {
	const jsonString = JSON.stringify(input, null, 2);
	if (!jsonString) {
		return '';
	}

	const escaped = escapeHtml(jsonString);

	return escaped
		.replace(/"([^"]+)"(?=\s*:)/g, '<span class="json-key">"$1"</span>')
		.replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
		.replace(/: (\d+(?:\.\d+)?)/g, ': <span class="json-number">$1</span>')
		.replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
		.replace(/: null/g, ': <span class="json-value">null</span>');
};

const formatDate = (input?: string | number): string => {
	if (!input) {
		return 'N/A';
	}
	const date = typeof input === 'number' ? new Date(input) : new Date(input);
	if (Number.isNaN(date.getTime())) {
		return String(input);
	}
	return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

const getStatusBadge = (status?: string): { label: string; color: string; background: string; icon: React.ReactNode } => {
	if (!status) {
		return {
			label: 'Unknown',
			color: '#374151',
			background: '#e5e7eb',
			icon: <FiAlertTriangle />,
		};
	}

	const normalized = status.toUpperCase();
	switch (normalized) {
		case 'COMPLETED':
			return {
				label: 'Completed',
				color: '#047857',
				background: '#dcfce7',
				icon: <FiCheckCircle />,
			};
		case 'OTP_REQUIRED':
		case 'PASSCODE_REQUIRED':
			return {
				label: 'OTP Required',
				color: '#1d4ed8',
				background: '#dbeafe',
				icon: <FiShield />,
			};
		case 'SELECTION_REQUIRED':
			return {
				label: 'Selection Required',
				color: '#92400e',
				background: '#fef3c7',
				icon: <FiAlertTriangle />,
			};
		default:
			return {
				label: normalized,
				color: '#0f172a',
				background: '#e2e8f0',
				icon: <FiShield />,
			};
	}
};

export const DeviceAuthenticationDetailsV8: React.FC = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const location = useLocation();

	const initialEnvironmentId = useMemo(() => searchParams.get('environmentId') || '', [searchParams]);
	const initialAuthId = useMemo(() => searchParams.get('authenticationId') || '', [searchParams]);
	const initialRegion = useMemo(() => searchParams.get('region') || DEFAULT_REGION, [searchParams]);

	const [environmentId, setEnvironmentId] = useState(initialEnvironmentId);
	const [authenticationId, setAuthenticationId] = useState(initialAuthId);
	const [region, setRegion] = useState(initialRegion);
	const [isLoading, setIsLoading] = useState(false);
	const [result, setResult] = useState<DeviceAuthenticationRecord | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [hasWorkerToken, setHasWorkerToken] = useState(false);

	useEffect(() => {
		let isMounted = true;
		workerTokenServiceV8
			.hasValidToken()
			.then((value) => {
				if (isMounted) {
					setHasWorkerToken(Boolean(value));
				}
			})
			.catch((err) => {
				console.warn(`${MODULE_TAG} Unable to determine worker token status`, err);
				if (isMounted) {
					setHasWorkerToken(false);
				}
			});
		return () => {
			isMounted = false;
		};
	}, []);

	const runLookup = useCallback(
		async (options?: { suppressToast?: boolean }) => {
			const trimmedEnv = environmentId.trim();
			const trimmedAuth = authenticationId.trim();

			if (!trimmedEnv || !trimmedAuth) {
				setError('Environment ID and Device Authentication ID are required.');
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				const response = await MFAServiceV8.readDeviceAuthentication({
					environmentId: trimmedEnv,
					authenticationId: trimmedAuth,
					region: region.trim() || undefined,
				});

				setResult(response);
				if (!options?.suppressToast) {
					toastV8.success('Device authentication record retrieved successfully.');
				}
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Unknown error';
				console.error(`${MODULE_TAG} Failed to read device authentication`, err);
				setError(message);
				toastV8.error(`Failed to fetch device authentication: ${message}`);
			} finally {
				setIsLoading(false);
			}
		},
		[environmentId, authenticationId, region]
	);

	useEffect(() => {
		const fromNav = (location.state as { autoFetch?: boolean } | null)?.autoFetch;
		if (initialEnvironmentId && initialAuthId && fromNav) {
			void runLookup({ suppressToast: true });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const summary = useMemo(() => {
		const record = result?.response as Record<string, unknown> | undefined;
		const status = (record?.status as string) || (record?.state as string) || '';
		const device = record?.device as Record<string, unknown> | undefined;
		const deviceType = (device?.type as string) || (record?.authenticationType as string) || '';
		const channel = (record?.channel as string) || '';
		const step = (record?.nextStep as string) || (record?.next?.status as string) || '';
		const updated = (record?.updatedAt as string) || (record?.lastUpdated as string) || (record?.modifiedAt as string);
		const created = (record?.createdAt as string) || '';

		return {
			status,
			deviceId: (device?.id as string) || (record?.deviceId as string) || '',
			deviceType,
			channel,
			nextStep: step,
			createdAt: created,
			updatedAt: updated,
		};
	}, [result]);

	const renderJson = (data: unknown) => {
		if (!data) {
			return <p style={{ margin: 0 }}>No response body received.</p>;
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
				}}
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		);
	};

	return (
		<div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: '80px' }}>
			<MFAHeaderV8
				title="Device Authentication Record"
				description="Inspect the PingOne MFA device authentication immediately after initialization."
				currentPage="management"
				headerColor="blue"
				showRestartFlow={false}
			/>

			<div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px 40px' }}>
				<button
					type="button"
					onClick={() => navigate(-1)}
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: '6px',
						border: 'none',
						background: 'transparent',
						color: '#2563eb',
						fontWeight: 600,
						cursor: 'pointer',
						marginBottom: '16px',
					}}
				>
					<FiArrowLeft />
					Back
				</button>

				<section
					style={{
						background: 'white',
						borderRadius: '12px',
						border: '1px solid #e5e7eb',
						padding: '20px',
						marginBottom: '20px',
						boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
					}}
				>
					<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
						<div>
							<h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>Lookup Parameters</h2>
							<p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
								Provide the environment ID and device authentication ID returned from the initialization step.
							</p>
						</div>
						{!hasWorkerToken && (
							<div
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: '8px',
									padding: '8px 12px',
									background: '#fef3c7',
									border: '1px solid #fbbf24',
									color: '#92400e',
									borderRadius: '999px',
									fontSize: '13px',
								}}
							>
								<FiAlertTriangle />
								<span>Worker token required</span>
							</div>
						)}
					</header>

					<form
						onSubmit={(event) => {
							event.preventDefault();
							void runLookup();
						}}
					>
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
										color: '#111827',
										background: '#ffffff',
									}}
								/>
							</label>

							<label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#374151' }}>
								Device Authentication ID
								<input
									type="text"
									value={authenticationId}
									onChange={(event) => setAuthenticationId(event.target.value)}
									placeholder="Returned from Initialize Device Authentication"
									style={{
										padding: '10px 12px',
										border: '1px solid #d1d5db',
										borderRadius: '8px',
										fontSize: '14px',
										color: '#111827',
										background: '#ffffff',
									}}
								/>
							</label>

							<label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#374151' }}>
								Region (optional)
								<select
									value={region}
									onChange={(event) => setRegion(event.target.value)}
									style={{
										padding: '10px 12px',
										border: '1px solid #d1d5db',
										borderRadius: '8px',
										fontSize: '14px',
										color: '#111827',
										background: '#ffffff',
									}}
								>
									<option value="na">North America (.com)</option>
									<option value="eu">Europe (.eu)</option>
									<option value="asia">Asia (.asia)</option>
								</select>
							</label>
						</div>

						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								marginTop: '20px',
							}}
						>
							<button
								type="submit"
								disabled={isLoading || !environmentId.trim() || !authenticationId.trim()}
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: '8px',
									padding: '10px 16px',
									borderRadius: '8px',
									background: '#2563eb',
									border: 'none',
									color: 'white',
									fontWeight: 600,
									cursor: 'pointer',
									opacity: isLoading ? 0.7 : 1,
								}}
							>
								{isLoading ? (
									<>
										<span className="loading-spinner" />
										Fetching…
									</>
								) : (
									<>
										<FiRefreshCw />
										Fetch Record
									</>
								)}
							</button>

							{result?.response && (
								<a
									href={`https://apidocs.pingidentity.com/pingone/mfa/v1/api/#get-read-device-authentication`}
									target="_blank"
									rel="noreferrer"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '6px',
										color: '#1f2937',
										fontSize: '13px',
										textDecoration: 'none',
									}}
								>
									<FiExternalLink />
									Reference: Read Device Authentication
								</a>
							)}
						</div>

						{error && (
							<div
								style={{
									display: 'flex',
									gap: '10px',
									marginTop: '16px',
									padding: '12px',
									borderRadius: '8px',
									background: '#fef2f2',
									border: '1px solid #fecaca',
									color: '#991b1b',
								}}
							>
								<FiAlertTriangle style={{ marginTop: '2px' }} />
								<div>
									<strong style={{ display: 'block', marginBottom: '4px' }}>Lookup failed</strong>
									<span>{error}</span>
								</div>
							</div>
						)}
					</form>
				</section>

				<section
					style={{
						background: 'white',
						borderRadius: '12px',
						border: '1px solid #e5e7eb',
						padding: '20px',
						marginBottom: '20px',
						boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
					}}
				>
					<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
						<div>
							<h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>Authentication Summary</h2>
							<p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
								Quick view of the authentication session returned by PingOne.
							</p>
						</div>
					</header>

					{result?.response ? (
						<>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
									gap: '16px',
								}}
							>
								<div
									style={{
										padding: '16px',
										borderRadius: '10px',
										background: '#f9fafb',
										border: '1px solid #e5e7eb',
									}}
								>
									<span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>
										Environment ID
									</span>
									<p style={{ margin: '6px 0 0', fontFamily: 'monospace', color: '#111827' }}>
										{result.environmentId ?? environmentId.trim() || '—'}
									</p>
								</div>
								<div
									style={{
										padding: '16px',
										borderRadius: '10px',
										background: '#f9fafb',
										border: '1px solid #e5e7eb',
									}}
								>
									<span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>
										Authentication ID
									</span>
									<p style={{ margin: '6px 0 0', fontFamily: 'monospace', color: '#111827' }}>
										{result.authenticationId ?? authenticationId.trim() || '—'}
									</p>
								</div>
								<div
									style={{
										padding: '16px',
										borderRadius: '10px',
										background: '#f9fafb',
										border: '1px solid #e5e7eb',
									}}
								>
									<span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>
										Status
									</span>
									{(() => {
										const badge = getStatusBadge(summary.status);
										return (
											<div
												style={{
													marginTop: '8px',
													display: 'inline-flex',
													alignItems: 'center',
													gap: '6px',
													padding: '6px 10px',
													borderRadius: '999px',
													background: badge.background,
													color: badge.color,
													fontWeight: 600,
													fontSize: '13px',
												}}
											>
												{badge.icon}
												<span>{badge.label}</span>
											</div>
										);
									})()}
								</div>
								<div
									style={{
										padding: '16px',
										borderRadius: '10px',
										background: '#f9fafb',
										border: '1px solid #e5e7eb',
									}}
								>
									<span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>
										Device
									</span>
									<p style={{ margin: '6px 0 0', fontFamily: 'monospace', color: '#111827' }}>
										{summary.deviceId || '—'}
									</p>
									{summary.deviceType && (
										<p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>{summary.deviceType}</p>
									)}
								</div>
								<div
									style={{
										padding: '16px',
										borderRadius: '10px',
										background: '#f9fafb',
										border: '1px solid #e5e7eb',
									}}
								>
									<span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>
										Next Step
									</span>
									<p style={{ margin: '6px 0 0', color: '#111827', fontWeight: 600 }}>
										{summary.nextStep || '—'}
									</p>
								</div>
								<div
									style={{
										padding: '16px',
										borderRadius: '10px',
										background: '#f9fafb',
										border: '1px solid #e5e7eb',
									}}
								>
									<span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>
										Last Updated
									</span>
									<p style={{ margin: '6px 0 0', color: '#111827' }}>
										{summary.updatedAt ? formatDate(summary.updatedAt) : '—'}
									</p>
									{summary.createdAt && (
										<p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
											Created {formatDate(summary.createdAt)}
										</p>
									)}
								</div>
							</div>

							<div
								style={{
									marginTop: '24px',
									padding: '16px',
									borderRadius: '10px',
									background: '#eff6ff',
									border: '1px solid #bfdbfe',
									display: 'flex',
									gap: '12px',
									alignItems: 'flex-start',
								}}
							>
								<FiClock style={{ color: '#1d4ed8', marginTop: '2px' }} />
								<div style={{ fontSize: '14px', color: '#1d4ed8' }}>
									<strong style={{ display: 'block', marginBottom: '4px' }}>Why this matters</strong>
									<span>
										The <code>Read Device Authentication</code> endpoint provides the authoritative status of the MFA step after
										you call initialize. Use it to confirm whether PingOne sent an OTP, requires device selection, or has already
										completed the authentication.
									</span>
								</div>
							</div>
						</>
					) : (
						<div
							style={{
								display: 'flex',
								gap: '12px',
								alignItems: 'center',
								padding: '16px',
								borderRadius: '10px',
								background: '#f3f4f6',
								border: '1px dashed #d1d5db',
								color: '#4b5563',
							}}
						>
							<FiShield />
							<span>Run a lookup to view the current device authentication status.</span>
						</div>
					)}
				</section>

				<section
					style={{
						background: 'white',
						borderRadius: '12px',
						border: '1px solid #e5e7eb',
						padding: '20px',
						boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
					}}
				>
					<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
						<div>
							<h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>Full Response Body</h2>
							<p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
								Inspect the raw PingOne MFA response with JSON highlighting.
							</p>
						</div>
					</header>
					{renderJson(result?.response)}
				</section>
			</div>
		</div>
	);
};

export default DeviceAuthenticationDetailsV8;

