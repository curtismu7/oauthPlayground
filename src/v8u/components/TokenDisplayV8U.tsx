/**
 * @file TokenDisplayV8U.tsx
 * @module v8u/components
 * @description Token display component for V8U with JWT decoding
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Features:
 * - Displays access, ID, and refresh tokens
 * - JWT decoding with expandable sections
 * - Copy to clipboard functionality
 * - Token masking/unmasking
 * - Expiry time formatting
 */

import React, { useState } from 'react';
import { FiCheck, FiCode, FiCopy, FiKey } from 'react-icons/fi';
import { type DecodedJWT, TokenDisplayServiceV8 } from '@/v8/services/tokenDisplayServiceV8';

const _MODULE_TAG = '[🎫 TOKEN-DISPLAY-V8U]';

export interface TokenDisplayV8UProps {
	tokens: {
		accessToken: string;
		idToken?: string;
		refreshToken?: string;
		expiresIn?: number;
	};
	showDecodeButtons?: boolean;
	showCopyButtons?: boolean;
	showMaskToggle?: boolean;
	className?: string;
}

export const TokenDisplayV8U: React.FC<TokenDisplayV8UProps> = ({
	tokens,
	showDecodeButtons = true,
	showCopyButtons = true,
	showMaskToggle = true,
	className = '',
}) => {
	// Tokens always visible (no masking)
	const [decodedStates, setDecodedStates] = useState<Record<string, DecodedJWT | null>>({});
	const [isDecodedStates, setIsDecodedStates] = useState<Record<string, boolean>>({});
	const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

	const handleToggleDecode = (tokenType: string, token: string) => {
		const key = `${tokenType}-${token.substring(0, 20)}`;
		const isDecoded = isDecodedStates[key] || false;

		if (!isDecoded) {
			// Decode the token
			if (TokenDisplayServiceV8.isJWT(token)) {
				const decoded = TokenDisplayServiceV8.decodeJWT(token);
				if (decoded) {
					setDecodedStates((prev) => ({ ...prev, [key]: decoded }));
					setIsDecodedStates((prev) => ({ ...prev, [key]: true }));
				}
			}
		} else {
			// Hide decoded content
			setDecodedStates((prev) => ({ ...prev, [key]: null }));
			setIsDecodedStates((prev) => ({ ...prev, [key]: false }));
		}
	};

	const handleCopy = async (tokenType: string, token: string) => {
		const label = TokenDisplayServiceV8.getTokenLabel(
			tokenType as 'access' | 'id' | 'refresh',
			!!tokens.idToken
		);
		const success = await TokenDisplayServiceV8.copyToClipboard(token, label);

		if (success) {
			setCopiedStates((prev) => ({ ...prev, [tokenType]: true }));
			setTimeout(() => {
				setCopiedStates((prev) => ({ ...prev, [tokenType]: false }));
			}, 2000);
		}
	};

	const renderToken = (
		tokenType: 'access' | 'id' | 'refresh',
		token: string,
		expiresIn?: number
	) => {
		if (!token) return null;

		const key = `${tokenType}-${token.substring(0, 20)}`;
		const isMasked = false; // Tokens always visible
		const isDecoded = isDecodedStates[key] || false;
		const decoded = decodedStates[key] || null;
		const isCopied = copiedStates[tokenType] || false;
		const isJWT = TokenDisplayServiceV8.isJWT(token);
		const label = TokenDisplayServiceV8.getTokenLabel(tokenType, !!tokens.idToken);

		return (
			<div
				key={tokenType}
				style={{
					background: '#ffffff',
					border: '1px solid #e2e8f0',
					borderRadius: '8px',
					padding: '16px',
					marginBottom: '16px',
				}}
			>
				{/* Token Header */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginBottom: '12px',
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							fontSize: '14px',
							fontWeight: '600',
							color: '#1e40af',
						}}
					>
						<FiKey size={16} />
						<span>{label}</span>
						{isJWT && (
							<span
								style={{
									padding: '2px 8px',
									background: '#dbeafe',
									borderRadius: '4px',
									fontSize: '11px',
									fontWeight: '500',
									color: '#1e40af',
								}}
							>
								JWT
							</span>
						)}
					</div>

					{/* Action Buttons */}
					<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
						{showDecodeButtons && isJWT && (
							<button
								type="button"
								onClick={() => handleToggleDecode(tokenType, token)}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '4px',
									padding: '6px 12px',
									background: isDecoded ? '#fef3c7' : '#fbbf24',
									border: '1px solid #f59e0b',
									borderRadius: '6px',
									fontSize: '12px',
									cursor: 'pointer',
									transition: 'all 0.2s ease',
									fontWeight: '500',
								}}
								onMouseEnter={(e) => {
									if (!isDecoded) {
										e.currentTarget.style.background = '#f59e0b';
									}
								}}
								onMouseLeave={(e) => {
									if (!isDecoded) {
										e.currentTarget.style.background = '#fbbf24';
									}
								}}
							>
								<FiCode size={14} />
								{isDecoded ? 'Hide Decode' : 'Decode JWT'}
							</button>
						)}

						{showCopyButtons && (
							<button
								type="button"
								onClick={() => handleCopy(tokenType, token)}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '4px',
									padding: '6px 12px',
									background: isCopied ? '#10b981' : '#3b82f6',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '12px',
									cursor: 'pointer',
									transition: 'all 0.2s ease',
									fontWeight: '500',
								}}
								onMouseEnter={(e) => {
									if (!isCopied) {
										e.currentTarget.style.background = '#2563eb';
									}
								}}
								onMouseLeave={(e) => {
									if (!isCopied) {
										e.currentTarget.style.background = '#3b82f6';
									}
								}}
							>
								{isCopied ? <FiCheck size={14} /> : <FiCopy size={14} />}
								{isCopied ? 'Copied!' : 'Copy'}
							</button>
						)}
					</div>
				</div>

				{/* Token Value */}
				{!isDecoded ? (
					<div
						style={{
							padding: '12px',
							background: '#f0fdf4',
							border: '1px solid #16a34a',
							borderRadius: '6px',
							fontFamily: 'monospace',
							fontSize: '12px',
							wordBreak: 'break-all',
							whiteSpace: 'pre-wrap',
							lineHeight: '1.5',
							color: '#166534',
						}}
					>
						{isMasked ? TokenDisplayServiceV8.maskToken(token) : token}
					</div>
				) : decoded ? (
					<div style={{ marginTop: '8px' }}>
						{/* Header Section */}
						<div style={{ marginBottom: '12px' }}>
							<div
								style={{
									fontSize: '12px',
									fontWeight: '600',
									color: '#1e40af',
									marginBottom: '4px',
								}}
							>
								Header
							</div>
							<div
								style={{
									padding: '12px',
									background: '#eff6ff',
									border: '1px solid #93c5fd',
									borderRadius: '6px',
									fontFamily: 'monospace',
									fontSize: '11px',
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-all',
									color: '#1e3a8a',
								}}
							>
								{JSON.stringify(decoded.header, null, 2)}
							</div>
						</div>

						{/* Payload Section */}
						<div>
							<div
								style={{
									fontSize: '12px',
									fontWeight: '600',
									color: '#1e40af',
									marginBottom: '4px',
								}}
							>
								Payload
							</div>
							<div
								style={{
									padding: '12px',
									background: '#eff6ff',
									border: '1px solid #93c5fd',
									borderRadius: '6px',
									fontFamily: 'monospace',
									fontSize: '11px',
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-all',
									color: '#1e3a8a',
								}}
							>
								{JSON.stringify(decoded.payload, null, 2)}
							</div>
						</div>
					</div>
				) : null}

				{/* Token Metadata */}
				{(expiresIn || !isJWT) && (
					<div
						style={{
							marginTop: '12px',
							paddingTop: '12px',
							borderTop: '1px solid #e2e8f0',
							display: 'flex',
							gap: '16px',
							fontSize: '12px',
							color: '#6b7280',
						}}
					>
						{expiresIn && (
							<div>
								<strong>Expires In:</strong> {TokenDisplayServiceV8.formatExpiry(expiresIn)}
							</div>
						)}
						{!isJWT && (
							<div style={{ color: '#f59e0b' }}>
								⚠️ {TokenDisplayServiceV8.getOpaqueTokenMessage(tokenType)}
							</div>
						)}
					</div>
				)}
			</div>
		);
	};

	return (
		<div className={className} style={{ marginTop: '24px' }}>
			<h2
				style={{
					fontSize: '18px',
					fontWeight: '600',
					marginBottom: '16px',
					color: '#1f2937',
				}}
			>
				🎫 Tokens Received
			</h2>
			<p
				style={{
					fontSize: '14px',
					color: '#6b7280',
					marginBottom: '20px',
				}}
			>
				Successfully received tokens from the authorization server.
			</p>

			{/* Access Token */}
			{renderToken('access', tokens.accessToken, tokens.expiresIn)}

			{/* ID Token */}
			{tokens.idToken && renderToken('id', tokens.idToken)}

			{/* Refresh Token */}
			{tokens.refreshToken && renderToken('refresh', tokens.refreshToken)}
		</div>
	);
};

export default TokenDisplayV8U;
