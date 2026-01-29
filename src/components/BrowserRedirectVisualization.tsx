import React, { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiClock, FiExternalLink } from 'react-icons/fi';

interface BrowserRedirectVisualizationProps {
	authorizationUrl: string;
	isRedirecting?: boolean;
	onRedirectComplete?: () => void;
}

interface RedirectStep {
	id: string;
	title: string;
	description: string;
	status: 'pending' | 'active' | 'completed' | 'error';
	icon: React.ReactNode;
	duration?: number;
}

export const BrowserRedirectVisualization: React.FC<BrowserRedirectVisualizationProps> = ({
	authorizationUrl,
	isRedirecting = false,
	onRedirectComplete,
}) => {
	const [steps, setSteps] = useState<RedirectStep[]>([
		{
			id: 'prepare',
			title: 'Prepare Authorization Request',
			description: 'Building authorization URL with required parameters',
			status: 'pending',
			icon: <FiClock />,
		},
		{
			id: 'redirect',
			title: 'Browser Redirect to PingOne',
			description: 'Redirecting user to PingOne authorization server',
			status: 'pending',
			icon: <FiExternalLink />,
		},
		{
			id: 'authenticate',
			title: 'User Authentication',
			description: 'User authenticates with PingOne (login, consent, etc.)',
			status: 'pending',
			icon: <FiCheckCircle />,
		},
		{
			id: 'callback',
			title: 'Return to Application',
			description: 'PingOne redirects back with authorization code',
			status: 'pending',
			icon: <FiCheckCircle />,
		},
	]);

	useEffect(() => {
		if (isRedirecting) {
			// Simulate the redirect process
			const timers: NodeJS.Timeout[] = [];

			// Step 1: Prepare
			timers.push(
				setTimeout(() => {
					setSteps((prev) =>
						prev.map((step, stepIndex) =>
							stepIndex === 0
								? { ...step, status: 'completed', duration: 500 }
								: stepIndex === 1
									? { ...step, status: 'active' }
									: step
						)
					);
				}, 500)
			);

			// Step 2: Redirect (show browser opening)
			timers.push(
				setTimeout(() => {
					setSteps((prev) =>
						prev.map((step, stepIndex) =>
							stepIndex === 1
								? { ...step, status: 'completed', duration: 1000 }
								: stepIndex === 2
									? { ...step, status: 'active' }
									: step
						)
					);

					// Actually open the URL in a new window for demonstration
					if (authorizationUrl) {
						window.open(authorizationUrl, '_blank', 'width=800,height=600');
					}
				}, 1500)
			);

			// Step 3: Authenticate (user action required)
			timers.push(
				setTimeout(() => {
					setSteps((prev) =>
						prev.map((step, stepIndex) =>
							stepIndex === 2
								? { ...step, status: 'completed', duration: 3000 }
								: stepIndex === 3
									? { ...step, status: 'active' }
									: step
						)
					);
				}, 3000)
			);

			// Step 4: Complete
			timers.push(
				setTimeout(() => {
					setSteps((prev) =>
						prev.map((step, stepIndex) =>
							stepIndex === 3 ? { ...step, status: 'completed', duration: 500 } : step
						)
					);
					onRedirectComplete?.();
				}, 4000)
			);

			return () => {
				timers.forEach(clearTimeout);
			};
		} else {
			// Reset when not redirecting
			setSteps((prev) =>
				prev.map((step, stepIndex) => ({
					...step,
					status: stepIndex === 0 ? 'pending' : 'pending',
				}))
			);
		}
	}, [isRedirecting, authorizationUrl, onRedirectComplete]);

	const getStepColor = (status: RedirectStep['status']) => {
		switch (status) {
			case 'completed':
				return '#10b981';
			case 'active':
				return '#3b82f6';
			case 'error':
				return '#ef4444';
			default:
				return '#9ca3af';
		}
	};

	const parseAuthorizationUrl = (url: string) => {
		try {
			const urlObj = new URL(url);
			const params = new URLSearchParams(urlObj.search);

			return {
				baseUrl: `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`,
				params: Array.from(params.entries()).map(([key, value]) => ({
					key,
					value: key === 'client_secret' ? '***REDACTED***' : value,
				})),
			};
		} catch {
			return { baseUrl: url, params: [] };
		}
	};

	const { baseUrl, params } = parseAuthorizationUrl(authorizationUrl);

	return (
		<div
			style={{
				padding: '1rem',
				backgroundColor: '#f8fafc',
				borderRadius: '8px',
				border: '1px solid #e2e8f0',
			}}
		>
			<div style={{ marginBottom: '1rem' }}>
				<h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
					Browser Redirect to PingOne
				</h3>
				<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
					Visualizing the OAuth 2.0 authorization flow redirect process
				</p>
			</div>

			{/* Authorization URL Display */}
			{authorizationUrl && (
				<div
					style={{
						marginBottom: '1.5rem',
						padding: '1rem',
						backgroundColor: 'white',
						borderRadius: '6px',
						border: '1px solid #e2e8f0',
					}}
				>
					<div
						style={{
							marginBottom: '0.5rem',
							fontSize: '0.85rem',
							fontWeight: '500',
							color: '#374151',
						}}
					>
						Authorization URL:
					</div>
					<div
						style={{
							wordBreak: 'break-all',
							fontSize: '0.8rem',
							fontFamily: 'monospace',
							color: '#1f2937',
						}}
					>
						{baseUrl}
					</div>
					{params.length > 0 && (
						<div style={{ marginTop: '0.75rem' }}>
							<div
								style={{
									fontSize: '0.8rem',
									fontWeight: '500',
									color: '#374151',
									marginBottom: '0.25rem',
								}}
							>
								Query Parameters:
							</div>
							{params.map(({ key, value }) => (
								<div
									key={key}
									style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#6b7280' }}
								>
									{key}={value}
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Redirect Steps */}
			<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
				{steps.map((step, _index) => (
					<div
						key={step.id}
						style={{
							display: 'flex',
							alignItems: 'flex-start',
							gap: '0.75rem',
							padding: '0.75rem',
							backgroundColor: step.status === 'active' ? '#eff6ff' : 'white',
							borderRadius: '6px',
							border: `1px solid ${getStepColor(step.status)}20`,
							transition: 'all 0.3s ease',
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: '24px',
								height: '24px',
								borderRadius: '50%',
								backgroundColor: getStepColor(step.status),
								color: 'white',
								fontSize: '0.75rem',
								flexShrink: 0,
							}}
						>
							{step.icon}
						</div>
						<div style={{ flex: 1, minWidth: 0 }}>
							<div style={{ fontWeight: '500', fontSize: '0.9rem', color: '#1f2937' }}>
								{step.title}
							</div>
							<div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
								{step.description}
							</div>
							{step.duration && (
								<div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
									Duration: {step.duration}ms
								</div>
							)}
						</div>
						{step.status === 'active' && (
							<div
								style={{
									width: '16px',
									height: '16px',
									border: '2px solid #3b82f6',
									borderTopColor: 'transparent',
									borderRadius: '50%',
									animation: 'spin 1s linear infinite',
								}}
							/>
						)}
						{step.status === 'completed' && (
							<FiCheckCircle style={{ color: '#10b981', fontSize: '1rem' }} />
						)}
						{step.status === 'error' && (
							<FiAlertCircle style={{ color: '#ef4444', fontSize: '1rem' }} />
						)}
					</div>
				))}
			</div>

			{/* Progress Indicator */}
			{isRedirecting && (
				<div
					style={{
						marginTop: '1rem',
						padding: '0.75rem',
						backgroundColor: '#fef3c7',
						borderRadius: '6px',
						border: '1px solid #f59e0b',
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							fontSize: '0.85rem',
							color: '#92400e',
						}}
					>
						<FiClock />
						<span>
							Redirect in progress... Please complete authentication in the opened window.
						</span>
					</div>
				</div>
			)}

			<style>{`
				@keyframes spin {
					to {
						transform: rotate(360deg);
					}
				}
			`}</style>
		</div>
	);
};
