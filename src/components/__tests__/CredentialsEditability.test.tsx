import { render, screen } from '@testing-library/react';
import { CredentialsInput } from '../CredentialsInput';
import { FlowCredentials } from '../FlowCredentials';

describe('Credentials Editability', () => {
	describe('CredentialsInput', () => {
		it('should keep all credential fields editable', () => {
			render(
				<CredentialsInput
					environmentId="test-env"
					clientId="test-client"
					clientSecret="test-secret"
					onEnvironmentIdChange={() => {}}
					onClientIdChange={() => {}}
					onClientSecretChange={() => {}}
				/>
			);

			// Check that all input fields are editable
			const inputs = screen.getAllByRole('textbox');
			inputs.forEach((input) => {
				expect(input).not.toBeDisabled();
				expect(input).not.toHaveAttribute('readonly');
			});
		});

		it('should keep fields editable even with various props', () => {
			render(
				<CredentialsInput
					environmentId="test-env"
					clientId="test-client"
					clientSecret="test-secret"
					onEnvironmentIdChange={() => {}}
					onClientIdChange={() => {}}
					onClientSecretChange={() => {}}
					showRedirectUri={true}
					showLoginHint={true}
					showClientSecret={true}
				/>
			);

			const inputs = screen.getAllByRole('textbox');
			inputs.forEach((input) => {
				expect(input).not.toBeDisabled();
				expect(input).not.toHaveAttribute('readonly');
			});
		});
	});

	describe('FlowCredentials', () => {
		it('should keep all credential fields editable', () => {
			render(<FlowCredentials flowType="authorization_code" onCredentialsChange={() => {}} />);

			const inputs = screen.getAllByRole('textbox');
			inputs.forEach((input) => {
				expect(input).not.toBeDisabled();
				expect(input).not.toHaveAttribute('readonly');
			});
		});

		it('should keep fields editable even with useGlobalDefaults=true', () => {
			render(
				<FlowCredentials
					flowType="authorization_code"
					onCredentialsChange={() => {}}
					useGlobalDefaults={true}
				/>
			);

			const inputs = screen.getAllByRole('textbox');
			inputs.forEach((input) => {
				expect(input).not.toBeDisabled();
				expect(input).not.toHaveAttribute('readonly');
			});
		});
	});
});
