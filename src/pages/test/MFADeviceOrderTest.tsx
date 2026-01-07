import React from 'react';
import MFADeviceOrderManager from '../../components/mfa/MFADeviceOrderManager';

const MFADeviceOrderTest: React.FC = () => {
	// These would normally come from your app state or props
	const testCredentials = {
		accessToken: 'test-access-token',
		environmentId: 'test-env-id',
		userId: 'test-user-id',
	};

	return (
		<div className="container mt-4">
			<h2>MFA Device Order Management Test</h2>
			<p>This is a test page for the MFA Device Order Manager component.</p>

			<MFADeviceOrderManager
				accessToken={testCredentials.accessToken}
				environmentId={testCredentials.environmentId}
				userId={testCredentials.userId}
				onOrderUpdated={() => {
					console.log('Device order updated!');
				}}
			/>
		</div>
	);
};

export default MFADeviceOrderTest;
