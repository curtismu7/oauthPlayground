/**
 * @file ScopeFixModalV8.tsx
 * @module v8/components
 * @description Modal to help users fix scope configuration issues
 * @version 8.0.0
 * @since 2024-11-16
 */

import React, { useState } from 'react';
import { FiCheck, FiCopy, FiExternalLink, FiX } from 'react-icons/fi';
import {
	ClientCredentialsIntegrationServiceV8,
	type ScopeFixResult,
} from '../services/clientCredentialsIntegrationServiceV8';
import { toastV8 } from '../utils/toastNotificationsV8';

interface ScopeFixModalV8Props {
	isOpen: boolean;
	onClose: () => void;
	currentScopes: string;
	environmentId: string;
	clientId: string;
	onApplyFix?: (fixedScopes: string) => void;
}

export const ScopeFixModalV8: React.FC<ScopeFixModalV8Props> = ({
	isOpen,
	onClose,
	currentScopes,
	environmentId,
	clientId,
	onApplyFix,
}) => {
	const [fixResult, setFixResult] = useState<ScopeFixResult | null>(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);

	// Analyze scopes when modal opens
	React.useEffect(() => {
		if (isOpen && currentScopes) {
			setIsAnalyzing(true);
			try {
				const result = ClientCredentialsIntegrationServiceV8.getScopeFix({
					environmentId,
					clientId,
					clientSecret: '', // Not needed for scope analysis
					scopes: currentScopes,
				});
				setFixResult(result);
			} catch (error) {
				console.error('Error analyzing scopes:', error);
			} finally {
				setIsAnalyzing(false);
			}
		}
	}, [isOpen, currentScopes, environmentId, clientId]);

	const handleApplyFix = () => {
		if (fixResult && onApplyFix) {
			onApplyFix(fixResult.fixedScopes);
			toastV8.success('Scopes updated successfully!');
			onClose();
		}
	};

	const handleCopyScopes = (scopes: string) => {
		navigator.clipboard.writeText(scopes).then(() => {
			toastV8.success('Scopes copied to clipboard!');
		});
	};

	const handleOpenPingOneAdmin = () => {
		window.open('https://admin.pingone.com', '_blank');
	};

	if (!isOpen) return null;

	return (
		<div
			role="button"
			tabIndex={0}
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				background: 'rgba(0, 0, 0, 0.5)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 1000,
			}}
			onClick={onClose}
			onKeyDown={(e) => {
				if (e.key === 'Escape') {
					onClose();
				}
			}}
			role="dialog"
			aria-modal="true"
			aria-labelledby="scope-fix-title"
		>
			<div
				role="button"
				tabIndex={0}
				style={{
					background: 'white',
					borderRadius: '12px',
					padding: '32px',
					maxWidth: '600px',
					width: '90%',
					maxHeight: '80vh',
					overflowY: 'auto',
					boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '24px',
					}}
				>
					<h2
						id="scope-fix-title"
						style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1f2937' }}
					>
						🔧 Scope Configuration Helper
					</h2>
					<button
						type="button"
						onClick={onClose}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								onClose();
							}
						}}
						style={{
							background: 'none',
							border: 'none',
							fontSize: '24px',
							cursor: 'pointer',
							color: '#6b7280',
							padding: '4px',
						}}
						aria-label="Close modal"
					>
						<FiX />
					</button>
				</div>

				{isAnalyzing ? (
					<div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
						<div>Analyzing scope configuration...</div>
					</div>
				) : fixResult ? (
					<>
						{/* Current vs Fixed Scopes */}
						<div style={{ marginBottom: '24px' }}>
							<h3
								style={{
									margin: '0 0 12px 0',
									fontSize: '16px',
									fontWeight: '600',
									color: '#374151',
								}}
							>
								Scope Analysis
							</h3>

							<div style={{ marginBottom: '16px' }}>
								<div
									style={{
										fontSize: '14px',
										fontWeight: '500',
										color: '#6b7280',
										marginBottom: '4px',
									}}
								>
									Current Scopes:
								</div>
								<div
									style={{
										background: '#f3f4f6',
										padding: '12px',
										borderRadius: '6px',
										fontFamily: 'monospace',
										fontSize: '14px',
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}
								>
									<span>{currentScopes || '(none)'}</span>
									<button
										type="button"
										onClick={() => handleCopyScopes(currentScopes)}
										style={{
											background: '#e5e7eb',
											border: 'none',
											padding: '4px 8px',
											borderRadius: '4px',
											cursor: 'pointer',
											fontSize: '12px',
										}}
									>
										<FiCopy />
									</button>
								</div>
							</div>

							{fixResult.fixedScopes !== currentScopes && (
								<div>
									<div
										style={{
											fontSize: '14px',
											fontWeight: '500',
											color: '#6b7280',
											marginBottom: '4px',
										}}
									>
										Recommended Scopes:
									</div>
									<div
										style={{
											background: '#dcfce7',
											border: '1px solid #bbf7d0',
											padding: '12px',
											borderRadius: '6px',
											fontFamily: 'monospace',
											fontSize: '14px',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
										}}
									>
										<span>{fixResult.fixedScopes}</span>
										<button
											type="button"
											onClick={() => handleCopyScopes(fixResult.fixedScopes)}
											style={{
												background: '#bbf7d0',
												border: 'none',
												padding: '4px 8px',
												borderRadius: '4px',
												cursor: 'pointer',
												fontSize: '12px',
											}}
										>
											<FiCopy />
										</button>
									</div>
								</div>
							)}
						</div>

						{/* Analysis Result */}
						<div style={{ marginBottom: '24px' }}>
							<h3
								style={{
									margin: '0 0 12px 0',
									fontSize: '16px',
									fontWeight: '600',
									color: '#374151',
								}}
							>
								Analysis Result
							</h3>
							<div
								style={{
									background: fixResult.requiresPingOneConfig ? '#fef3c7' : '#dcfce7',
									border: `1px solid ${fixResult.requiresPingOneConfig ? '#fde68a' : '#bbf7d0'}`,
									padding: '16px',
									borderRadius: '6px',
								}}
							>
								<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
									<div
										style={{
											color: fixResult.requiresPingOneConfig ? '#d97706' : '#059669',
											marginTop: '2px',
										}}
									>
										{fixResult.requiresPingOneConfig ? '⚠️' : '✅'}
									</div>
									<div>
										<div style={{ fontWeight: '500', marginBottom: '4px' }}>
											{fixResult.requiresPingOneConfig ? 'Action Required' : 'Configuration OK'}
										</div>
										<div style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
											{fixResult.reason}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* PingOne Instructions */}
						{fixResult.requiresPingOneConfig && fixResult.pingOneInstructions && (
							<div style={{ marginBottom: '24px' }}>
								<h3
									style={{
										margin: '0 0 12px 0',
										fontSize: '16px',
										fontWeight: '600',
										color: '#374151',
									}}
								>
									PingOne Configuration Steps
								</h3>
								<div
									style={{
										background: '#f8fafc',
										border: '1px solid #e2e8f0',
										padding: '16px',
										borderRadius: '6px',
										fontSize: '14px',
										lineHeight: '1.6',
										whiteSpace: 'pre-line',
									}}
								>
									{fixResult.pingOneInstructions}
								</div>
							</div>
						)}

						{/* Action Buttons */}
						<div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
							{fixResult.requiresPingOneConfig && (
								<button
									type="button"
									onClick={handleOpenPingOneAdmin}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										padding: '10px 16px',
										background: '#3b82f6',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										cursor: 'pointer',
										fontSize: '14px',
										fontWeight: '500',
									}}
								>
									<FiExternalLink />
									Open PingOne Admin
								</button>
							)}

							{fixResult.fixedScopes !== currentScopes && (
								<button
									type="button"
									onClick={handleApplyFix}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										padding: '10px 16px',
										background: '#10b981',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										cursor: 'pointer',
										fontSize: '14px',
										fontWeight: '500',
									}}
								>
									<FiCheck />
									Apply Fix
								</button>
							)}

							<button
								type="button"
								onClick={onClose}
								style={{
									padding: '10px 16px',
									background: '#f3f4f6',
									color: '#374151',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
									fontSize: '14px',
									fontWeight: '500',
								}}
							>
								Close
							</button>
						</div>
					</>
				) : (
					<div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
						<div>Unable to analyze scopes</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ScopeFixModalV8;
