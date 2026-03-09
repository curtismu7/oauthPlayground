import { V9_COLORS } from '../../services/v9/V9ColorStandards';

const OIDCOverviewTest = () => {
	return (
		<div
			style={{
				padding: '2rem',
				background: '#f8fafc',
				minHeight: '100vh',
				textAlign: 'center',
			}}
		>
			<h1
				style={{
					fontSize: '3rem',
					color: '#2563eb',
					marginBottom: '2rem',
					fontWeight: 'bold',
				}}
			>
				🧪 OIDC OVERVIEW TEST PAGE 🧪
			</h1>
			<div
				style={{
					background: '#ecfdf5',
					border: '3px solid V9_COLORS.PRIMARY.GREEN',
					borderRadius: '1rem',
					padding: '2rem',
					margin: '2rem auto',
					maxWidth: '600px',
					boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
				}}
			>
				<h2 style={{ color: '#10b981', marginBottom: '1rem' }}>✅ Route is Working! ✅</h2>
				<p style={{ color: '#10b981', fontSize: '1.25rem', marginBottom: '1rem' }}>
					This test page confirms that the /documentation/oidc-overview route is functioning
					correctly.
				</p>
				<div
					style={{
						background: '#10b981',
						color: 'white',
						padding: '1rem',
						borderRadius: '0.5rem',
						fontWeight: 'bold',
						fontSize: '1.1rem',
					}}
				>
					🎉 ENHANCED OIDC OVERVIEW IS READY TO LOAD! 🎉
				</div>
			</div>
		</div>
	);
};

export default OIDCOverviewTest;
