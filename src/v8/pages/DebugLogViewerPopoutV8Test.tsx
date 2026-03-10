import React from 'react';

const DebugLogViewerPopoutV8Test: React.FC = () => {
	return (
		<div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
			<h1>🐛 V8 Debug Log Viewer - Test Version</h1>
			<p>This is a minimal test version to verify the V8 route works.</p>
			<div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
				<h2>✅ V8 Route Working!</h2>
				<p>If you can see this page, the /v8/debug-logs-popout route is properly configured.</p>
				<p>The full V8 component may have dependency issues that need to be resolved.</p>
			</div>
		</div>
	);
};

export { DebugLogViewerPopoutV8Test };
