// src/pages/flows/v9/DeviceAuthorizationVerifyPage.tsx
// Simulates the "verification device" page where the user enters their code and approves (RFC 8628).
// In a real flow this would be served by the auth server; here it completes the mock device flow.

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { showGlobalSuccess } from '../../../contexts/NotificationSystem';
import { V9MockStateStore } from '../../../services/v9/mock/V9MockStateStore';
import {
	getSectionBodyStyle,
	getSectionHeaderStyle,
	MOCK_FLOW_CONTAINER_STYLE,
	MOCK_INPUT_STYLE,
	MOCK_PRIMARY_BTN,
	MOCK_SECTION_STYLE,
} from '../../../v7/styles/mockFlowStyles';

export const DeviceAuthorizationVerifyPage: React.FC = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const userCodeFromUrl = searchParams.get('user_code') ?? '';
	const [userCode, setUserCode] = useState(userCodeFromUrl);
	const [approved, setApproved] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/** Normalize user code for lookup (store keeps without dashes). */
	const normalizedCode = userCode.replace(/-/g, '').trim().toUpperCase();

	function handleApprove() {
		setError(null);
		if (!normalizedCode) {
			setError('Enter your user code.');
			return;
		}
		const record = V9MockStateStore.getDeviceCodeByUserCode(normalizedCode);
		if (!record) {
			setError('Invalid or expired user code. Request a new device authorization from the device.');
			return;
		}
		const ok = V9MockStateStore.approveDeviceCode(record.deviceCode);
		if (ok) {
			setApproved(true);
			showGlobalSuccess('Device approved! You can return to the device to poll for tokens.');
		} else {
			setError('Approval failed. The code may have expired.');
		}
	}

	return (
		<div style={MOCK_FLOW_CONTAINER_STYLE}>
			<section style={MOCK_SECTION_STYLE}>
				<header style={getSectionHeaderStyle('info')}>
					<span>📱</span> Device Authorization — Simulate User Approval
				</header>
				<div style={getSectionBodyStyle()}>
					<p style={{ marginBottom: 12, color: '#374151' }}>
						In a real flow you would open this page on your phone or another browser after the
						device showed you the user code. Enter the code and approve to authorize the device.
					</p>
					{!approved ? (
						<>
							<label style={{ display: 'block', marginBottom: 8 }}>
								User code
								<input
									type="text"
									value={userCode}
									onChange={(e) => setUserCode(e.target.value)}
									placeholder="e.g. XXXX-XXXX"
									style={MOCK_INPUT_STYLE}
								/>
							</label>
							{error && (
								<div
									style={{
										marginBottom: 12,
										padding: 8,
										background: '#fee2e2',
										border: '1px solid #f87171',
										borderRadius: 6,
										color: '#b91c1c',
									}}
								>
									{error}
								</div>
							)}
							<button type="button" onClick={handleApprove} style={MOCK_PRIMARY_BTN}>
								📱 Simulate User Approval (Approve this device)
							</button>
						</>
					) : (
						<div
							style={{
								padding: 12,
								background: '#f0fdf4',
								border: '1px solid #86efac',
								borderRadius: 6,
								marginBottom: 12,
							}}
						>
							<strong>✅ Device approved.</strong> Return to the device flow and click &quot;Poll
							for Tokens&quot; to complete the flow.
						</div>
					)}
					<div style={{ marginTop: 16 }}>
						<button
							type="button"
							onClick={() => navigate('/flows/device-authorization-v9')}
							style={{ ...MOCK_PRIMARY_BTN, background: '#6b7280' }}
						>
							← Back to Device Authorization flow
						</button>
					</div>
				</div>
			</section>
		</div>
	);
};

export default DeviceAuthorizationVerifyPage;
