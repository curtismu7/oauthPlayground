// Simple test component for debugging
import React from 'react';

const UnifiedMFAV8_Simple: React.FC = () => {
	return (
		<div style={{ padding: '2rem', textAlign: 'center', background: '#f0f9ff', minHeight: '100vh' }}>
			<h1 style={{ color: '#1e40af', marginBottom: '1rem' }}>🎯 Unified MFA V8</h1>
			<p style={{ fontSize: '1.1rem', color: '#64748b' }}>
				This is a simple test component to verify the route works.
			</p>
			<div style={{ marginTop: '2rem', padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
				<h3>✅ Component Loading Successfully!</h3>
				<p>The Unified MFA V8 route is working.</p>
				<p>Next step: Replace with the full component.</p>
			</div>
		</div>
	);
};

export default UnifiedMFAV8_Simple;
