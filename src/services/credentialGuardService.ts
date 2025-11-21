import type { StepCredentials } from '../components/steps/CommonSteps';

export interface CredentialGuardResult {
	missingFields: string[];
	canProceed: boolean;
}

export interface CredentialGuardOptions {
	requiredFields: Array<keyof StepCredentials | string>;
	fieldLabels?: Record<string, string>;
}

export const CredentialGuardService = {
	checkMissingFields(
		credentials: StepCredentials | null | undefined,
		{ requiredFields, fieldLabels = {} }: CredentialGuardOptions
	): CredentialGuardResult {
		if (!credentials) {
			return {
				missingFields: requiredFields.map(
					(field) => fieldLabels[field as string] || humanizeFieldName(field as string)
				),
				canProceed: false,
			};
		}

		const missingFields: string[] = [];

		requiredFields.forEach((field) => {
			const credRecord = credentials as unknown as Record<string, unknown>;
			const value = credRecord[field as string];
			if (typeof value === 'string') {
				if (!value.trim()) {
					missingFields.push(fieldLabels[field as string] || humanizeFieldName(field as string));
				}
			} else if (value === null || value === undefined || value === '') {
				missingFields.push(fieldLabels[field as string] || humanizeFieldName(field as string));
			}
		});

		return {
			missingFields,
			canProceed: missingFields.length === 0,
		};
	},
};

function humanizeFieldName(field: string): string {
	return field
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/[_-]/g, ' ')
		.replace(/^./, (s) => s.toUpperCase());
}
