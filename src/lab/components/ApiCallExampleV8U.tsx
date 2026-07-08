import React from 'react';

interface ApiCallExampleProps {
	method: 'GET' | 'POST';
	url: string;
	headers?: Record<string, string>;
	body?: string | Record<string, any>;
	response?: {
		status: number;
		statusText: string;
		data?: any;
	};
	note?: string;
	title: string;
}

export const ApiCallExampleV8U: React.FC<ApiCallExampleProps> = ({
	method,
	url,
	headers,
	body,
	response,
	note,
	title,
}) => {
	const formatHeaders = (headers: Record<string, string>) => {
		return Object.entries(headers)
			.map(([key, value]) => `${key}: ${value}`)
			.join('\n');
	};

	const formatBody = (body: string | Record<string, any>) => {
		if (typeof body === 'string') {
			return body;
		}
		return new URLSearchParams(body).toString();
	};

	const formatResponse = (response: any) => {
		return JSON.stringify(response, null, 2);
	};

	return (
		<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
			<h4 className="text-lg font-semibold text-gray-800 mb-3">{title}</h4>

			{note && (
				<div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
					<p className="text-sm text-blue-800">
						<strong>Note:</strong> {note}
					</p>
				</div>
			)}

			<div className="space-y-3">
				{/* Request Line */}
				<div className="bg-gray-100 rounded p-3">
					<div className="flex items-center space-x-2 mb-2">
						<span
							className={`px-2 py-1 rounded text-xs font-bold ${
								method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
							}`}
						>
							{method}
						</span>
						<span className="font-mono text-sm">{url}</span>
					</div>
				</div>

				{/* Headers */}
				{headers && Object.keys(headers).length > 0 && (
					<div className="bg-gray-100 rounded p-3">
						<h5 className="text-sm font-semibold text-gray-700 mb-2">Headers:</h5>
						<pre className="text-xs font-mono bg-white p-2 rounded border overflow-x-auto">
							{formatHeaders(headers)}
						</pre>
					</div>
				)}

				{/* Body */}
				{body && (
					<div className="bg-gray-100 rounded p-3">
						<h5 className="text-sm font-semibold text-gray-700 mb-2">Body:</h5>
						<pre className="text-xs font-mono bg-white p-2 rounded border overflow-x-auto">
							{formatBody(body)}
						</pre>
					</div>
				)}

				{/* Response */}
				{response && (
					<div className="bg-gray-100 rounded p-3">
						<div className="flex items-center space-x-2 mb-2">
							<span
								className={`px-2 py-1 rounded text-xs font-bold ${
									response.status >= 200 && response.status < 300
										? 'bg-green-100 text-green-800'
										: 'bg-red-100 text-red-800'
								}`}
							>
								{response.status} {response.statusText}
							</span>
						</div>
						{response.data && (
							<pre className="text-xs font-mono bg-white p-2 rounded border overflow-x-auto">
								{formatResponse(response.data)}
							</pre>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
