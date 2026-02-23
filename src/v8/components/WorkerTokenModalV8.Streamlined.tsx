/**
 * @file WorkerTokenModalV8.Streamlined.tsx
 * @module v8/components
 * @description Streamlined Worker Token modal with simplified UI
 * @version 8.0.0
 * @since 2024-11-16
 */

import React, { useEffect, useState } from 'react';
import { FiEye, FiEyeOff, FiSave, FiX, FiKey } from 'react-icons/fi';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import {
	exportWorkerTokenCredentials,
	importCredentials,
	triggerFileImport,
	type WorkerTokenCredentials,
} from '@/services/credentialExportImportService';
import { environmentService } from '@/services/environmentService';
import { UnifiedTokenDisplayService } from '@/services/unifiedTokenDisplayService';
import {
	type UnifiedWorkerTokenCredentials,
	unifiedWorkerTokenService,
} from '@/services/unifiedWorkerTokenService';
import pingOneFetch from '@/utils/pingOneFetch';
import { PINGONE_WORKER_MFA_SCOPE_STRING } from '@/v8/config/constants';
import { AuthMethodServiceV8, type AuthMethodV8 } from '@/v8/services/authMethodServiceV8';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { workerTokenCacheServiceV8 } from '@/v8/services/workerTokenCacheServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { StandardModalSpinner, useStandardSpinner } from '../../components/ui/StandardSpinner';
import { WorkerTokenRequestModalV8 } from './WorkerTokenRequestModalV8';

const MODULE_TAG = '[🔑 WORKER-TOKEN-MODAL-V8-STREAMLINED]';

interface WorkerTokenModalV8StreamlinedProps {
	isOpen: boolean;
	onClose: () => void;
	onTokenGenerated?: (token: string) => void;
	environmentId?: string;
	showTokenOnly?: boolean;
}

const WorkerTokenModalV8Streamlined: React.FC<WorkerTokenModalV8StreamlinedProps> = ({
	isOpen,
	onClose,
	onTokenGenerated,
	environmentId: propEnvironmentId = '',
	showTokenOnly = false,
}) => {
	// State
	const [environmentId, setEnvironmentId] = useState(propEnvironmentId);
	const [clientId, setClientId] = useState('');
	const [clientSecret, setClientSecret] = useState('');
	const [scopeInput, setScopeInput] = useState(PINGONE_WORKER_MFA_SCOPE_STRING);
	const [region, setRegion] = useState<'us' | 'eu' | 'ap' | 'ca'>('us');
	const [customDomain, setCustomDomain] = useState<string>('');
	const [authMethod, setAuthMethod] = useState<AuthMethodV8>('client_secret_basic');
	const [showSecret, setShowSecret] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [showRequestModal, setShowRequestModal] = useState(false);
	const [requestDetails, setRequestDetails] = useState<{
		tokenEndpoint: string;
		requestParams: {
			grant_type: string;
			client_id: string;
			client_secret: string;
			scope: string;
		};
		authMethod: AuthMethodV8;
		region: 'us' | 'eu' | 'ap' | 'ca';
		resolvedHeaders: Record<string, string>;
		resolvedBody: string;
	} | null>(null);
	const [currentToken, setCurrentToken] = useState<string | null>(null);
	const [showTokenDisplay, setShowTokenDisplay] = useState(false);

	// Spinners
	const generateSpinner = useStandardSpinner(8000);

	// Load saved credentials on mount
	React.useEffect(() => {
		if (isOpen) {
			unifiedWorkerTokenService
				.loadCredentials()
				.then((creds: UnifiedWorkerTokenCredentials | null) => {
					if (creds) {
						setEnvironmentId(creds.environmentId || propEnvironmentId);
						setClientId(creds.clientId || '');
						setClientSecret(creds.clientSecret || '');
						setScopeInput(
							Array.isArray(creds.scopes) && creds.scopes.length ? creds.scopes.join(' ') : ''
						);
						setRegion(creds.region || 'us');
						setCustomDomain(creds.customDomain || '');
						setAuthMethod(creds.tokenEndpointAuthMethod || 'client_secret_basic');
					}
				})
				.catch((error) => {
					console.error(`${MODULE_TAG} Failed to load credentials:`, error);
				});
		}
	}, [isOpen, propEnvironmentId]);

	// Handle ESC key
	React.useEffect(() => {
		if (!isOpen) return undefined;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const handleSaveCredentials = async () => {
		// Validate required fields
		if (!environmentId.trim() || !clientId.trim() || !clientSecret.trim()) {
			toastV8.error('Please fill in all required fields');
			return;
		}

		try {
			// Normalize scopes
			const normalizedScopes = scopeInput
				.split(/\s+/)
				.map((scope) => scope.trim())
				.filter(Boolean);

			if (normalizedScopes.length === 0) {
				toastV8.error('Please provide at least one scope');
				return;
			}

			// Save credentials
			const credentials: UnifiedWorkerTokenCredentials = {
				environmentId: environmentId.trim(),
				clientId: clientId.trim(),
				clientSecret: clientSecret.trim(),
				scopes: normalizedScopes,
				region: region,
				tokenEndpointAuthMethod: authMethod,
				...(customDomain && { customDomain: customDomain.trim() }),
			};

			await unifiedWorkerTokenService.saveCredentials(credentials);

			// Save to environment service
			const options: { region: 'us' | 'eu' | 'ap' | 'ca'; customDomain?: string } = {
				region: region as 'us' | 'eu' | 'ap' | 'ca',
			};
			if (customDomain?.trim()) {
				options.customDomain = customDomain.trim();
			}
			environmentService.setEnvironmentId(environmentId.trim(), options);

			toastV8.success('Credentials saved successfully!');
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save credentials:`, error);
			toastV8.error('Failed to save credentials');
		}
	};

	const handleGenerate = async () => {
		await generateSpinner.executeWithSpinner(
			async () => {
				if (!environmentId.trim() || !clientId.trim() || !clientSecret.trim()) {
					toastV8.error('Please fill in all required fields');
					throw new Error('Please fill in all required fields');
				}

				const normalizedScopes = scopeInput
					.split(/\s+/)
					.map((scope) => scope.trim())
					.filter(Boolean);

				if (normalizedScopes.length === 0) {
					toastV8.error('Please provide at least one scope');
					throw new Error('Please provide at least one scope');
				}

				// Save credentials first
				const credentials: UnifiedWorkerTokenCredentials = {
					environmentId: environmentId.trim(),
					clientId: clientId.trim(),
					clientSecret: clientSecret.trim(),
					scopes: normalizedScopes,
					region: region,
					tokenEndpointAuthMethod: authMethod,
					...(customDomain && { customDomain }),
				};

				await unifiedWorkerTokenService.saveCredentials(credentials);

				// Determine domain
				const domain = (() => {
					const regionDomains = {
						us: 'auth.pingone.com',
						eu: 'auth.pingone.eu',
						ap: 'auth.pingone.asia',
						ca: 'auth.pingone.ca',
					};
					return regionDomains[region];
				})();
				const tokenEndpoint = `https://${domain}/${environmentId.trim()}/as/token`;

				const params = new URLSearchParams({
					grant_type: 'client_credentials',
					client_id: clientId.trim(),
					scope: normalizedScopes.join(' '),
				});

				const headers: Record<string, string> = {
					'Content-Type': 'application/x-www-form-urlencoded',
				};

				if (authMethod === 'client_secret_post') {
					params.set('client_secret', clientSecret.trim());
				} else {
					const basicAuth = btoa(`${clientId.trim()}:${clientSecret.trim()}`);
					headers.Authorization = `Basic ${basicAuth}`;
				}

				const details = {
					tokenEndpoint,
					requestParams: {
						grant_type: 'client_credentials',
						client_id: clientId.trim(),
						client_secret: clientSecret.trim(),
						scope: normalizedScopes.join(' '),
					},
					authMethod,
					region,
					resolvedHeaders: headers,
					resolvedBody: params.toString(),
				};

				setRequestDetails(details);
				setShowRequestModal(true);
			},
			{
				onSuccess: () => {
					// Success handled in request modal
				},
				onError: (error) => {
					console.error(`${MODULE_TAG} Generation error:`, error);
					toastV8.error('Failed to prepare token request');
				},
			}
		);
	};

	const handleExecuteRequest = async (): Promise<string | null> => {
		if (!requestDetails) return null;

		setIsGenerating(true);
		try {
			const response = await pingOneFetch(requestDetails.tokenEndpoint, {
				method: 'POST',
				headers: requestDetails.resolvedHeaders,
				body: requestDetails.resolvedBody,
			});

			if (!response.ok) {
				throw new Error(`Token generation failed (HTTP ${response.status})`);
			}

			const data = await response.json() as { access_token?: string };
			const token = data.access_token;
			if (!token) {
				throw new Error('No access token received');
			}

			// Save token
			await unifiedWorkerTokenService.saveToken(token);
			
			// Dispatch event
			window.dispatchEvent(new Event('workerTokenUpdated'));

			toastV8.success('Worker token generated successfully!');
			onTokenGenerated?.(token);

			return token;
		} catch (error) {
			console.error(`${MODULE_TAG} Token generation error`, error);
			toastV8.error('Failed to generate token');
			return null;
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<>
			{/* Spinner */}
			<StandardModalSpinner show={generateSpinner.isLoading} message="Generating worker token..." theme="blue" />

			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
				onClick={onClose}
			>
				{/* Modal */}
				<div
					className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-auto"
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b border-amber-200">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-lg font-bold text-amber-900">🔑 Worker Token</h2>
								<p className="text-sm text-amber-700">Generate API access token</p>
							</div>
							<button
								onClick={onClose}
								className="text-amber-600 hover:text-amber-800 p-1"
							>
								<FiX size={20} />
							</button>
						</div>
					</div>

					{/* Content */}
					<div className="p-6 space-y-4">
						{/* Token Display */}
						{showTokenDisplay && currentToken && (
							<div className="bg-green-50 border border-green-200 rounded-lg p-4">
								<div className="text-green-800 font-medium mb-2">✅ Current Token</div>
								<div className="mb-2">
									{UnifiedTokenDisplayService.showTokens(
										{ access_token: currentToken },
										'oauth',
										'worker-token-current-v8',
										true
									)}
								</div>
								<button
									onClick={() => setShowTokenDisplay(false)}
									className="text-green-600 text-sm hover:text-green-800"
								>
									Hide
								</button>
							</div>
						)}

						{/* Form */}
						{!showTokenOnly && (
							<div className="space-y-4">
								{/* Environment ID */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Environment ID <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										value={environmentId}
										onChange={(e) => setEnvironmentId(e.target.value)}
										placeholder="12345678-1234-1234-1234-123456789012"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
									/>
								</div>

								{/* Client ID */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Client ID <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										value={clientId}
										onChange={(e) => setClientId(e.target.value)}
										placeholder="abc123def456..."
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
									/>
								</div>

								{/* Client Secret */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Client Secret <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<input
											type={showSecret ? 'text' : 'password'}
											value={clientSecret}
											onChange={(e) => setClientSecret(e.target.value)}
											placeholder="•••••••••••••••••"
											className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
										/>
										<button
											type="button"
											onClick={() => setShowSecret(!showSecret)}
											className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
										>
											{showSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
										</button>
									</div>
								</div>

								{/* Scopes */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Scopes <span className="text-red-500">*</span>
									</label>
									<textarea
										value={scopeInput}
										onChange={(e) => setScopeInput(e.target.value)}
										rows={2}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
									/>
									<p className="text-xs text-gray-500 mt-1">Space-separated list of scopes</p>
								</div>

								{/* Region */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
									<select
										value={region}
										onChange={(e) => setRegion(e.target.value as 'us' | 'eu' | 'ap' | 'ca')}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
									>
										<option value="us">North America (US)</option>
										<option value="eu">Europe (EU)</option>
										<option value="ap">Asia Pacific (AP)</option>
										<option value="ca">Canada (CA)</option>
									</select>
								</div>

								{/* Custom Domain */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain (Optional)</label>
									<input
										type="text"
										value={customDomain}
										onChange={(e) => setCustomDomain(e.target.value)}
										placeholder="auth.yourcompany.com"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
									/>
									<p className="text-xs text-gray-500 mt-1">Overrides region-based domain if set</p>
								</div>

								{/* Auth Method */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Authentication Method</label>
									<select
										value={authMethod}
										onChange={(e) => setAuthMethod(e.target.value as AuthMethodV8)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
									>
										{AuthMethodServiceV8.getAvailableMethodsForFlow('client-credentials').map(
											(method) => (
												<option key={method} value={method}>
													{AuthMethodServiceV8.getDisplayLabel(method)}
												</option>
											)
										)}
									</select>
								</div>
							</div>
						)}

						{/* Action Buttons */}
						<div className="flex gap-3 pt-4 border-t">
							{!showTokenOnly && (
								<>
									<button
										onClick={handleSaveCredentials}
										className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
									>
										<FiSave size={16} />
										Save
									</button>
									<button
										onClick={handleGenerate}
										disabled={isGenerating}
										className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{isGenerating ? (
											<>
												<div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
												Generating...
											</>
										) : (
											<>
												<FiKey size={16} />
												Generate
											</>
										)}
									</button>
								</>
							)}
							<button
								onClick={onClose}
								className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Request Modal */}
			{showRequestModal && requestDetails && (
				<WorkerTokenRequestModalV8
					isOpen={showRequestModal}
					onClose={() => {
						setShowRequestModal(false);
						onClose();
					}}
					onExecute={handleExecuteRequest}
					requestDetails={requestDetails}
					isExecuting={isGenerating}
					setIsExecuting={setIsGenerating}
					showTokenAtEnd={true}
				/>
			)}
		</>
	);
};

export { WorkerTokenModalV8Streamlined };
export default WorkerTokenModalV8Streamlined;
