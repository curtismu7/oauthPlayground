import { FiKey, FiLock, FiShield, FiZap } from '@icons';

export type AuthMethod =
	| 'client_secret_basic'
	| 'client_secret_post'
	| 'client_secret_jwt'
	| 'private_key_jwt';

export interface AuthMethodConfig {
	authMethod: string;
	description: string;
	requiresClientSecret: boolean;
	securityLevel: 'low' | 'medium' | 'high';
	useCases: string[];
	recommended?: boolean;
}

export class AuthMethodService {
	static getAllMethodConfigs(): Record<AuthMethod, AuthMethodConfig> {
		return {
			client_secret_basic: {
				authMethod: 'client_secret_basic',
				description: 'Client credentials sent in HTTP Basic Authorization header',
				requiresClientSecret: true,
				securityLevel: 'high',
				recommended: true,
				useCases: [
					'Recommended for most server-to-server scenarios',
					'Standard OAuth 2.0 client authentication',
					'Backend services with secure credential storage',
					'Server-to-server communication',
				],
			},
			client_secret_post: {
				authMethod: 'client_secret_post',
				description: 'Client credentials sent in request body',
				requiresClientSecret: true,
				securityLevel: 'medium',
				useCases: [
					'When Basic Auth is not supported',
					'Clients that cannot use HTTP Basic authentication',
					'Legacy system integration',
					'Simpler implementation requirements',
				],
			},
			client_secret_jwt: {
				authMethod: 'client_secret_jwt',
				description: 'JWT signed with client secret',
				requiresClientSecret: true,
				securityLevel: 'high',
				useCases: [
					'Enhanced security with JWT assertions',
					'When you need additional claims in the token',
					'Compatibility with JWT-based systems',
				],
			},
			private_key_jwt: {
				authMethod: 'private_key_jwt',
				description: 'JWT signed with client private key',
				requiresClientSecret: false,
				securityLevel: 'high',
				recommended: true,
				useCases: [
					'Enhanced security requirements',
					'Public key infrastructure (PKI) environments',
					'Cryptographic authentication',
				],
			},
		};
	}

	static getMethodConfig(method: AuthMethod): AuthMethodConfig {
		const configs = AuthMethodService.getAllMethodConfigs();
		return configs[method];
	}

	static getSupportedMethods(): AuthMethod[] {
		return Object.keys(AuthMethodService.getAllMethodConfigs()) as AuthMethod[];
	}

	static isValidMethod(method: string): method is AuthMethod {
		return method in AuthMethodService.getAllMethodConfigs();
	}

	static getMethodIcon(method: AuthMethod) {
		switch (method) {
			case 'client_secret_basic':
				return <FiShield />;
			case 'client_secret_post':
				return <FiKey />;
			case 'client_secret_jwt':
				return <FiLock />;
			case 'private_key_jwt':
				return <FiZap />;
			default:
				return null;
		}
	}

	static getDisplayName(method: AuthMethod): string {
		return AuthMethodService.getMethodConfig(method)
			.authMethod.split('_')
			.map((word) =>
				word === 'jwt' ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)
			)
			.join(' ');
	}
}

export interface AuthMethodSelectorProps {
	selectedMethod: AuthMethod;
	onMethodChange: (method: AuthMethod) => void;
	className?: string;
}

export const AuthMethodSelector: React.FC<AuthMethodSelectorProps> = ({
	selectedMethod,
	onMethodChange,
	className = '',
}) => {
	const methods = AuthMethodService.getSupportedMethods();
	const config = AuthMethodService.getMethodConfig(selectedMethod);

	return (
		<div className={className}>
			<div className="mb-4">
				<label
					htmlFor="auth-method-select"
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Authentication Method
				</label>
				<select
					id="auth-method-select"
					value={selectedMethod}
					onChange={(event) => onMethodChange(event.target.value as AuthMethod)}
					className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
					{methods.map((method) => (
						<option key={method} value={method}>
							{AuthMethodService.getDisplayName(method)}
						</option>
					))}
				</select>
			</div>

			<div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
				<div className="flex items-center mb-3">
					<div className="p-2 mr-3 bg-white rounded-lg shadow-sm">
						{AuthMethodService.getMethodIcon(selectedMethod)}
					</div>
					<div>
						<h3 className="font-medium text-gray-900">
							{AuthMethodService.getDisplayName(selectedMethod)}
						</h3>
						<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
							{config.securityLevel} Security
						</span>
						{config.recommended && (
							<span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
								Recommended
							</span>
						)}
					</div>
				</div>

				<p className="text-sm text-gray-600 mb-3">{config.description}</p>

				<div className="space-y-2">
					<h4 className="text-sm font-medium text-gray-700">Use cases:</h4>
					<ul className="space-y-1">
						{config.useCases.map((useCase) => (
							<li key={useCase} className="flex items-start">
								<svg
									className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"
									fill="currentColor"
									viewBox="0 0 20 20"
									aria-hidden="true"
								>
									<title>Check mark</title>
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clipRule="evenodd"
									/>
								</svg>
								<span className="text-sm text-gray-600">{useCase}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
};
