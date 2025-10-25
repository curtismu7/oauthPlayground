import { useState, useCallback } from 'react';
import { CredentialGuardService, type CredentialGuardOptions } from '../services/credentialGuardService';
import { ModalPresentationService } from '../services/modalPresentationService';
import type { StepCredentials } from '../components/steps/CommonSteps';

export interface UseCredentialGuardOptions {
	requiredFields: string[];
	fieldLabels?: Record<string, string>;
	flowName?: string;
}

export interface UseCredentialGuardReturn {
	showMissingCredentialsModal: boolean;
	missingCredentialFields: string[];
	checkCredentialsAndProceed: (credentials: StepCredentials | null | undefined, onProceed: () => void) => void;
	closeModal: () => void;
	CredentialGuardModal: React.FC;
}

/**
 * Hook for credential validation with modal display
 * Prevents users from advancing to step 1+ without required credentials
 */
export const useCredentialGuard = (options: UseCredentialGuardOptions): UseCredentialGuardReturn => {
	const { requiredFields, fieldLabels = {}, flowName = 'this flow' } = options;
	
	const [showMissingCredentialsModal, setShowMissingCredentialsModal] = useState(false);
	const [missingCredentialFields, setMissingCredentialFields] = useState<string[]>([]);

	const checkCredentialsAndProceed = useCallback((
		credentials: StepCredentials | null | undefined,
		onProceed: () => void
	) => {
		const { missingFields, canProceed } = CredentialGuardService.checkMissingFields(credentials, {
			requiredFields,
			fieldLabels,
		});

		if (!canProceed) {
			setMissingCredentialFields(missingFields);
			setShowMissingCredentialsModal(true);
			console.warn(`🚫 [${flowName}] Blocked navigation due to missing required credentials:`, { missingFields });
			return;
		}

		// Credentials are valid, proceed
		onProceed();
	}, [requiredFields, fieldLabels, flowName]);

	const closeModal = useCallback(() => {
		setShowMissingCredentialsModal(false);
		setMissingCredentialFields([]);
	}, []);

	const CredentialGuardModal: React.FC = () => (
		<ModalPresentationService
			isOpen={showMissingCredentialsModal}
			onClose={closeModal}
			title="Credentials Required"
			description={
				missingCredentialFields.length > 0
					? `Please provide the following required credential${missingCredentialFields.length > 1 ? 's' : ''} before continuing:`
					: `Required credentials must be filled in before moving to the next step in ${flowName}.`
			}
			actions={[
				{
					label: 'Back to Credentials',
					onClick: closeModal,
					variant: 'primary',
				},
			]}
		>
			{missingCredentialFields.length > 0 && (
				<div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
					<ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
						{missingCredentialFields.map((field) => (
							<li key={field} style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#ef4444' }}>
								{field}
							</li>
						))}
					</ul>
					<div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem' }}>
						<p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626' }}>
							<strong>Note:</strong> Please fill in all required fields above before proceeding to the next step.
						</p>
					</div>
				</div>
			)}
		</ModalPresentationService>
	);

	return {
		showMissingCredentialsModal,
		missingCredentialFields,
		checkCredentialsAndProceed,
		closeModal,
		CredentialGuardModal,
	};
};
