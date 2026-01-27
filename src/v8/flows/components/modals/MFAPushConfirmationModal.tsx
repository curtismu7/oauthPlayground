import React from 'react';
import { FiLoader, FiX } from 'react-icons/fi';
import { PingIdentityLogo } from '@/v8/components/shared/PingIdentityLogo';

export interface MFAPushConfirmationModalProps {
	show: boolean;
	onClose: () => void;
}

export const MFAPushConfirmationModal: React.FC<MFAPushConfirmationModalProps> = ({
	show,
	onClose,
}) => {
	if (!show) return null;

	return (
		<div
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
		>
			<div
				style={{
					background: 'white',
					borderRadius: '16px',
					padding: '0',
					maxWidth: '500px',
					width: '90%',
					boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
					overflow: 'hidden',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header with Logo */}
				<div
					style={{
						background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
						padding: '32px 32px 24px 32px',
						textAlign: 'center',
						position: 'relative',
					}}
				>
					<button
						type="button"
						onClick={onClose}
						style={{
							position: 'absolute',
							top: '16px',
							right: '16px',
							background: 'rgba(255, 255, 255, 0.2)',
							border: 'none',
							borderRadius: '50%',
							width: '32px',
							height: '32px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							cursor: 'pointer',
							color: 'white',
						}}
					>
						<FiX size={18} />
					</button>
					<PingIdentityLogo size={48} />
					<h3
						style={{
							margin: '0',
							fontSize: '22px',
							fontWeight: '600',
							color: 'white',
							textAlign: 'center',
						}}
					>
						Approve sign-in on your phone
					</h3>
				</div>
				<div style={{ padding: '32px' }}>
					<div style={{ textAlign: 'center', marginBottom: '24px' }}>
						<div
							style={{
								width: '80px',
								height: '80px',
								borderRadius: '50%',
								background: '#eff6ff',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								margin: '0 auto 16px',
								fontSize: '40px',
							}}
						>
							📱
						</div>
						<p
							style={{
								margin: '0 0 8px 0',
								fontSize: '16px',
								fontWeight: '500',
								color: '#1f2937',
							}}
						>
							Push notification sent
						</p>
						<p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
							Please check your mobile device and approve the sign-in request.
						</p>
					</div>

					<div
						style={{
							padding: '12px',
							background: '#f0fdf4',
							border: '1px solid #bbf7d0',
							borderRadius: '6px',
							marginBottom: '20px',
							fontSize: '14px',
							color: '#166534',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
							<FiLoader style={{ animation: 'spin 1s linear infinite' }} />
							<strong>Waiting for approval...</strong>
						</div>
						<p style={{ margin: 0, fontSize: '13px' }}>
							We're checking your device for approval. This modal will close automatically when you
							approve.
						</p>
					</div>

					<button
						type="button"
						onClick={onClose}
						style={{
							width: '100%',
							padding: '12px 24px',
							border: '1px solid #d1d5db',
							borderRadius: '8px',
							background: 'white',
							color: '#6b7280',
							fontSize: '16px',
							fontWeight: '500',
							cursor: 'pointer',
						}}
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
};
