// Example: Replace the Configuration page worker token section with standardized button

// In src/pages/Configuration.tsx, replace the existing Worker Token section:

import { WorkerTokenButton } from '../components/WorkerTokenButton';

// Replace the entire Worker Token Credentials section (around lines 694-800) with:

{
	/* Worker Token Section - Standardized */
}
<CollapsibleHeader
	title="Worker Token Credentials"
	subtitle="Obtain a PingOne Management API worker token to enable Config Checker functionality across all flows"
	icon={<FiKey />}
	defaultCollapsed={false}
>
	<Card style={{ border: 'none', boxShadow: 'none', marginBottom: 0 }}>
		{workerTokenError && (
			<InfoBox $type="error">
				<FiAlertCircle size={16} />
				<strong>Error:</strong> {workerTokenError}
			</InfoBox>
		)}

		{/* Standardized Worker Token Button - matching MFA flow */}
		<WorkerTokenButton
			onTokenObtained={(token) => {
				console.log('Worker token obtained:', token);
				// Update any local state if needed
				const currentStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
				setTokenStatus(currentStatus);
			}}
			onModalClose={() => {
				console.log('Worker token modal closed');
				// Refresh status when modal closes
				const currentStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
				setTokenStatus(currentStatus);
			}}
			showRefresh={true}
		/>

		{/* Token Status Display (if you want to keep it) */}
		{tokenStatus.isValid && tokenStatus.token && (
			<WorkerTokenDetectedBanner
				token={tokenStatus.token}
				tokenExpiryKey="worker_token_expires_at"
				message={
					tokenStatus.expiresAt
						? `Worker token obtained! Config Checker is now available in all flows. Token expires at ${new Date(tokenStatus.expiresAt).toLocaleString()}.`
						: 'Worker token obtained! Config Checker is now available in all flows.'
				}
			/>
		)}
	</Card>
</CollapsibleHeader>;

// This provides:
// 1. Same UI/UX as MFA flow
// 2. Same modal behavior
// 3. Same loading states
// 4. Same token status integration
// 5. Standardized implementation across all pages
