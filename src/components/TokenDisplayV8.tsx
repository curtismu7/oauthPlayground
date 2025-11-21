import React, { useState } from 'react';
import { FiCopy, FiEye, FiEyeOff } from 'react-icons/fi';

interface TokenDisplayV8Props {
	idToken?: string;
	accessToken?: string;
	expiresIn?: string;
	tokenType?: string;
}

export const TokenDisplayV8: React.FC<TokenDisplayV8Props> = ({
	idToken,
	accessToken,
	expiresIn,
	tokenType,
}) => {
	const [showIdToken, setShowIdToken] = useState(false);
	const [showAccessToken, setShowAccessToken] = useState(false);

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	};

	const formatToken = (token: string, maxLength = 50) => {
		if (token.length <= maxLength) return token;
		return `${token.substring(0, maxLength)}...`;
	};

	const formatExpiry = (expiresIn: string) => {
		const seconds = parseInt(expiresIn, 10);
		if (Number.isNaN(seconds)) return expiresIn;

		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds}s`;
	};

	return (
		<div className="space-y-4">
			{/* ID Token Section */}
			{idToken && (
				<div className="border rounded-md p-4 bg-gray-50">
					<div className="flex items-center justify-between mb-2">
						<h4 className="text-sm font-semibold text-gray-800">ID Token (OIDC)</h4>
						<div className="flex gap-2">
							<button
								onClick={() => setShowIdToken(!showIdToken)}
								className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
							>
								{showIdToken ? <FiEyeOff size={14} /> : <FiEye size={14} />}
								{showIdToken ? 'Hide' : 'Show'}
							</button>
							<button
								onClick={() => copyToClipboard(idToken)}
								className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
							>
								<FiCopy size={14} />
								Copy
							</button>
						</div>
					</div>
					<div className="text-xs font-mono bg-white p-2 rounded border break-all">
						{showIdToken ? idToken : formatToken(idToken)}
					</div>
					<div className="mt-2 text-xs text-gray-600">
						JWT containing user identity claims. Can be decoded to view user information.
					</div>
				</div>
			)}

			{/* Access Token Section */}
			{accessToken && (
				<div className="border rounded-md p-4 bg-gray-50">
					<div className="flex items-center justify-between mb-2">
						<h4 className="text-sm font-semibold text-gray-800">Access Token</h4>
						<div className="flex gap-2">
							<button
								onClick={() => setShowAccessToken(!showAccessToken)}
								className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
							>
								{showAccessToken ? <FiEyeOff size={14} /> : <FiEye size={14} />}
								{showAccessToken ? 'Hide' : 'Show'}
							</button>
							<button
								onClick={() => copyToClipboard(accessToken)}
								className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
							>
								<FiCopy size={14} />
								Copy
							</button>
						</div>
					</div>
					<div className="text-xs font-mono bg-white p-2 rounded border break-all">
						{showAccessToken ? accessToken : formatToken(accessToken)}
					</div>
					<div className="mt-2 text-xs text-gray-600">
						Token for accessing protected resources. Typically opaque or JWT format.
					</div>
				</div>
			)}

			{/* Token Metadata */}
			{(expiresIn || tokenType) && (
				<div className="border rounded-md p-4 bg-blue-50">
					<h4 className="text-sm font-semibold text-gray-800 mb-3">Token Metadata</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
						{expiresIn && (
							<div>
								<span className="font-medium text-gray-700">Expires In:</span>
								<div className="text-xs text-gray-600 mt-1">
									{formatExpiry(expiresIn)} ({expiresIn} seconds)
								</div>
							</div>
						)}
						{tokenType && (
							<div>
								<span className="font-medium text-gray-700">Token Type:</span>
								<div className="text-xs text-gray-600 mt-1">{tokenType}</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* No tokens message */}
			{!idToken && !accessToken && (
				<div className="border rounded-md p-4 bg-yellow-50 text-center">
					<p className="text-sm text-gray-600">
						No tokens received. Complete the authorization flow to see tokens here.
					</p>
				</div>
			)}
		</div>
	);
};
