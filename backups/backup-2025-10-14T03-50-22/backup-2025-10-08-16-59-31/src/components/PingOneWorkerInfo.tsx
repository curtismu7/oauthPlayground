import { AlertCircle, CheckCircle, Key, Lock, RefreshCw, Server, Shield } from 'lucide-react';

// Exportable data service
export const PingOneWorkerData = {
	overview: {
		title: 'PingOne Worker Application & Token Usage',
		description:
			'A Worker application is an admin-level, non-interactive application connection to PingOne that acts on behalf of administrators to interact with PingOne APIs programmatically.',
		definition:
			'Think of it as a service account or machine identity that performs administrative tasks without requiring a human user to be present.',
	},
	keyFunctions: [
		{
			name: 'API Management',
			description:
				'Create, read, update, and delete PingOne resources (users, groups, applications, environments)',
		},
		{
			name: 'Automation',
			description:
				'Enable infrastructure-as-code tools like Terraform to manage PingOne configurations',
		},
		{
			name: 'Integration',
			description:
				'Connect external systems to PingOne for provisioning, authentication flows, and administrative operations',
		},
		{
			name: 'Administrative Tasks',
			description:
				'Perform bulk operations, reporting, and monitoring without manual console access',
		},
	],
	tokenUsage: {
		description:
			'Worker apps obtain access tokens via OAuth 2.0 Client Credentials Flow. Access tokens are JSON Web Tokens (JWTs) that authorize calls to PingOne Platform APIs.',
		validity: 'Access tokens are valid for 1 hour, after which a new token must be requested.',
		flow: [
			'Worker app authenticates using Client Credentials Flow (OAuth 2.0)',
			'Sends client_id and client_secret to PingOne token endpoint',
			'Receives an access token (JWT) with permissions based on assigned roles',
			'Uses bearer token authentication for all API requests',
			'Token expires after 60 minutes - must refresh',
		],
	},
	useCases: [
		{
			category: 'DevOps',
			example: 'Terraform provisioning PingOne environments and applications',
		},
		{
			category: 'CI/CD Pipelines',
			example: 'Automated deployment of authentication configurations',
		},
		{
			category: 'User Provisioning',
			example: 'HR systems syncing employee data to PingOne',
		},
		{
			category: 'Monitoring & Reporting',
			example: 'Automated collection of authentication metrics',
		},
		{
			category: 'Backup & DR',
			example: 'Scheduled exports of configurations',
		},
	],
	roles: {
		description:
			'Worker applications have no roles by default. Roles must be assigned after creation to grant specific permissions.',
		commonRoles: [
			{
				name: 'Organization Admin',
				description: 'Create/manage environments across the organization',
			},
			{
				name: 'Environment Admin',
				description: 'Full control over a specific environment',
			},
			{
				name: 'Identity Data Admin',
				description: 'Manage users, groups, and populations',
			},
			{
				name: 'Application Owner',
				description: 'Manage application configurations',
			},
			{
				name: 'Client Application Developer',
				description: 'Create and configure OAuth/OIDC applications',
			},
		],
	},
	security: {
		bestPractices: [
			'Store client secrets in secure vaults (never in code repositories)',
			"Assign least-privilege roles - only what's needed for the task",
			'Use separate Worker apps for different automation tasks',
			'Rotate client secrets regularly (every 90 days recommended)',
			'Monitor Worker app API usage for anomalies',
			'Implement IP whitelisting when possible',
			'Use certificate-based authentication for enhanced security',
			'Never share Worker app credentials across teams or environments',
		],
		criticalNote:
			'Worker app credentials apply only to the Worker app itself, not to PingOne admin users. Admin users need separate role assignments to perform the same actions.',
	},
};

// Main Component
export default function PingOneWorkerInfo() {
	return (
		<div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
			{/* Header */}
			<div className="bg-white rounded-lg shadow-lg p-8 mb-6">
				<div className="flex items-center gap-4 mb-4">
					<Server className="text-indigo-600" size={48} />
					<div>
						<h1 className="text-3xl font-bold text-gray-800">{PingOneWorkerData.overview.title}</h1>
						<p className="text-gray-600 mt-2">{PingOneWorkerData.overview.description}</p>
					</div>
				</div>
				<div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
					<p className="text-indigo-900">
						<strong>In Simple Terms:</strong> {PingOneWorkerData.overview.definition}
					</p>
				</div>
			</div>

			{/* Key Functions */}
			<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
					<Key className="text-indigo-600" size={28} />
					What Does It Do?
				</h2>
				<div className="grid md:grid-cols-2 gap-4">
					{PingOneWorkerData.keyFunctions.map((func, idx) => (
						<div
							key={idx}
							className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition"
						>
							<h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
								<CheckCircle className="text-green-600" size={20} />
								{func.name}
							</h3>
							<p className="text-sm text-gray-600">{func.description}</p>
						</div>
					))}
				</div>
			</div>

			{/* Token Usage */}
			<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
					<RefreshCw className="text-purple-600" size={28} />
					Worker Token Usage
				</h2>
				<div className="bg-purple-50 rounded-lg p-4 mb-4 border border-purple-200">
					<p className="text-purple-900 mb-2">{PingOneWorkerData.tokenUsage.description}</p>
					<p className="text-purple-800 font-semibold">
						⏱️ Token Validity: {PingOneWorkerData.tokenUsage.validity}
					</p>
				</div>

				<h3 className="font-semibold text-gray-800 mb-3">Token Acquisition Flow:</h3>
				<ol className="space-y-2">
					{PingOneWorkerData.tokenUsage.flow.map((step, idx) => (
						<li key={idx} className="flex gap-3">
							<span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
								{idx + 1}
							</span>
							<span className="text-gray-700 pt-1">{step}</span>
						</li>
					))}
				</ol>
			</div>

			{/* Use Cases */}
			<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-4">Common Use Cases</h2>
				<div className="grid md:grid-cols-2 gap-3">
					{PingOneWorkerData.useCases.map((useCase, idx) => (
						<div
							key={idx}
							className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200"
						>
							<h3 className="font-semibold text-green-900 mb-1">{useCase.category}</h3>
							<p className="text-sm text-green-800">{useCase.example}</p>
						</div>
					))}
				</div>
			</div>

			{/* Roles */}
			<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
					<Shield className="text-orange-600" size={28} />
					Role-Based Permissions
				</h2>
				<div className="bg-orange-50 rounded-lg p-4 mb-4 border border-orange-200">
					<p className="text-orange-900">{PingOneWorkerData.roles.description}</p>
				</div>

				<h3 className="font-semibold text-gray-800 mb-3">Common Roles Assigned to Worker Apps:</h3>
				<div className="space-y-3">
					{PingOneWorkerData.roles.commonRoles.map((role, idx) => (
						<div key={idx} className="border-l-4 border-orange-600 pl-4 py-2 bg-orange-50">
							<h4 className="font-semibold text-gray-800">{role.name}</h4>
							<p className="text-sm text-gray-600">{role.description}</p>
						</div>
					))}
				</div>
			</div>

			{/* Security Best Practices */}
			<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
					<Lock className="text-red-600" size={28} />
					Security Considerations
				</h2>

				<div className="grid md:grid-cols-2 gap-3 mb-6">
					{PingOneWorkerData.security.bestPractices.map((practice, idx) => (
						<div
							key={idx}
							className="flex items-start gap-3 bg-red-50 rounded-lg p-3 border border-red-200"
						>
							<CheckCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
							<p className="text-sm text-red-900">{practice}</p>
						</div>
					))}
				</div>

				<div className="bg-red-100 rounded-lg p-5 border-2 border-red-300">
					<div className="flex items-start gap-3">
						<AlertCircle className="text-red-700 flex-shrink-0 mt-1" size={32} />
						<div>
							<h3 className="font-bold text-red-900 mb-2 text-lg">Critical Security Note</h3>
							<p className="text-red-800">{PingOneWorkerData.security.criticalNote}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Quick Reference Card */}
			<div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
				<h3 className="text-xl font-bold mb-4">Quick Reference</h3>
				<div className="grid md:grid-cols-3 gap-4">
					<div>
						<h4 className="font-semibold mb-2">Authentication</h4>
						<p className="text-sm text-indigo-100">OAuth 2.0 Client Credentials Flow</p>
					</div>
					<div>
						<h4 className="font-semibold mb-2">Token Type</h4>
						<p className="text-sm text-indigo-100">JWT (JSON Web Token)</p>
					</div>
					<div>
						<h4 className="font-semibold mb-2">Token Lifetime</h4>
						<p className="text-sm text-indigo-100">60 minutes (1 hour)</p>
					</div>
				</div>
			</div>
		</div>
	);
}
