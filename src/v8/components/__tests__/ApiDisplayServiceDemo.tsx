/**
 * @file ApiDisplayServiceDemo.tsx
 * @module v8/components/__tests__
 * @description Interactive demo showing how API Display Service V8 works
 * @version 8.0.0
 * @since 2024-11-23
 *
 * This demo shows:
 * - How to control API display visibility from anywhere
 * - How multiple components stay in sync
 * - How state persists across navigation
 * - How to subscribe to visibility changes
 */

import React, { useEffect, useState } from 'react';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';

const MODULE_TAG = '[🎨 API-DISPLAY-DEMO]';

/**
 * Control Panel Component - Shows how to control the API display
 */
const ControlPanel: React.FC = () => {
	const [isVisible, setIsVisible] = useState(apiDisplayServiceV8.isVisible());
	const [updateCount, setUpdateCount] = useState(0);

	useEffect(() => {
		console.log(`${MODULE_TAG} ControlPanel mounted`);

		// Subscribe to visibility changes
		const unsubscribe = apiDisplayServiceV8.subscribe((visible) => {
			console.log(`${MODULE_TAG} ControlPanel received update:`, visible);
			setIsVisible(visible);
			setUpdateCount((prev) => prev + 1);
		});

		return () => {
			console.log(`${MODULE_TAG} ControlPanel unmounted`);
			unsubscribe();
		};
	}, []);

	return (
		<div
			style={{
				padding: '20px',
				background: '#f9fafb', // Light grey background
				border: '2px solid #e5e7eb',
				borderRadius: '8px',
				marginBottom: '20px',
			}}
		>
			<h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>🎛️ Control Panel</h3>

			<div style={{ marginBottom: '16px' }}>
				<strong style={{ color: '#374151' }}>Current State:</strong>{' '}
				<span
					style={{
						padding: '4px 8px',
						background: isVisible ? '#10b981' : '#ef4444',
						color: 'white', // White text on colored background
						borderRadius: '4px',
						fontWeight: 'bold',
						fontSize: '12px',
					}}
				>
					{isVisible ? '✓ VISIBLE' : '✕ HIDDEN'}
				</span>
				<span style={{ marginLeft: '12px', color: '#6b7280', fontSize: '12px' }}>
					(Updates received: {updateCount})
				</span>
			</div>

			<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
				<button
					type="button"
					onClick={() => {
						console.log(`${MODULE_TAG} Show button clicked`);
						apiDisplayServiceV8.show();
					}}
					style={{
						padding: '8px 16px',
						background: '#10b981',
						color: 'white', // White text on green background
						border: 'none',
						borderRadius: '6px',
						cursor: 'pointer',
						fontWeight: '600',
						fontSize: '14px',
					}}
				>
					📖 Show API Display
				</button>

				<button
					type="button"
					onClick={() => {
						console.log(`${MODULE_TAG} Hide button clicked`);
						apiDisplayServiceV8.hide();
					}}
					style={{
						padding: '8px 16px',
						background: '#ef4444',
						color: 'white', // White text on red background
						border: 'none',
						borderRadius: '6px',
						cursor: 'pointer',
						fontWeight: '600',
						fontSize: '14px',
					}}
				>
					✕ Hide API Display
				</button>

				<button
					type="button"
					onClick={() => {
						console.log(`${MODULE_TAG} Toggle button clicked`);
						apiDisplayServiceV8.toggle();
					}}
					style={{
						padding: '8px 16px',
						background: '#3b82f6',
						color: 'white', // White text on blue background
						border: 'none',
						borderRadius: '6px',
						cursor: 'pointer',
						fontWeight: '600',
						fontSize: '14px',
					}}
				>
					🔄 Toggle
				</button>
			</div>
		</div>
	);
};

/**
 * Status Monitor Component - Shows how multiple components can subscribe
 */
const StatusMonitor: React.FC<{ id: number }> = ({ id }) => {
	const [isVisible, setIsVisible] = useState(apiDisplayServiceV8.isVisible());
	const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

	useEffect(() => {
		console.log(`${MODULE_TAG} StatusMonitor #${id} mounted`);

		const unsubscribe = apiDisplayServiceV8.subscribe((visible) => {
			console.log(`${MODULE_TAG} StatusMonitor #${id} received update:`, visible);
			setIsVisible(visible);
			setLastUpdate(new Date());
		});

		return () => {
			console.log(`${MODULE_TAG} StatusMonitor #${id} unmounted`);
			unsubscribe();
		};
	}, [id]);

	return (
		<div
			style={{
				padding: '12px',
				background: isVisible ? '#d1fae5' : '#fee2e2', // Light green or light red
				border: `2px solid ${isVisible ? '#10b981' : '#ef4444'}`,
				borderRadius: '6px',
				fontSize: '13px',
			}}
		>
			<div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#1f2937' }}>Monitor #{id}</div>
			<div style={{ color: '#374151' }}>
				Status: <strong>{isVisible ? 'Visible' : 'Hidden'}</strong>
			</div>
			<div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
				Last update: {lastUpdate.toLocaleTimeString()}
			</div>
		</div>
	);
};

/**
 * API Call Generator - Creates sample API calls for testing
 */
const ApiCallGenerator: React.FC = () => {
	const [callCount, setCallCount] = useState(0);

	const generateApiCall = (type: 'success' | 'error') => {
		const timestamp = new Date();
		const id = `demo-${Date.now()}-${Math.random()}`;

		const call = {
			id,
			method: 'POST',
			url: `https://api.pingone.com/v1/environments/demo-env/users/${id}/devices`,
			body: {
				type: 'SMS',
				phone: '+1234567890',
			},
			response: {
				status: type === 'success' ? 200 : 400,
				data:
					type === 'success'
						? { id, status: 'ACTIVE', type: 'SMS' }
						: { code: 'INVALID_REQUEST', message: 'Invalid phone number' },
			},
			timestamp,
		};

		apiCallTrackerService.trackApiCall(call);
		setCallCount((prev) => prev + 1);
		console.log(`${MODULE_TAG} Generated ${type} API call:`, call);
	};

	return (
		<div
			style={{
				padding: '20px',
				background: '#f9fafb', // Light grey background
				border: '2px solid #e5e7eb',
				borderRadius: '8px',
				marginBottom: '20px',
			}}
		>
			<h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>🧪 API Call Generator</h3>

			<div style={{ marginBottom: '12px', color: '#374151' }}>
				Generate sample API calls to see them in the display below.
				<br />
				<span style={{ fontSize: '12px', color: '#6b7280' }}>Calls generated: {callCount}</span>
			</div>

			<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
				<button
					type="button"
					onClick={() => generateApiCall('success')}
					style={{
						padding: '8px 16px',
						background: '#10b981',
						color: 'white', // White text on green background
						border: 'none',
						borderRadius: '6px',
						cursor: 'pointer',
						fontWeight: '600',
						fontSize: '14px',
					}}
				>
					✓ Generate Success Call
				</button>

				<button
					type="button"
					onClick={() => generateApiCall('error')}
					style={{
						padding: '8px 16px',
						background: '#ef4444',
						color: 'white', // White text on red background
						border: 'none',
						borderRadius: '6px',
						cursor: 'pointer',
						fontWeight: '600',
						fontSize: '14px',
					}}
				>
					✕ Generate Error Call
				</button>

				<button
					type="button"
					onClick={() => {
						apiCallTrackerService.clearApiCalls();
						setCallCount(0);
						console.log(`${MODULE_TAG} Cleared all API calls`);
					}}
					style={{
						padding: '8px 16px',
						background: '#6b7280',
						color: 'white', // White text on grey background
						border: 'none',
						borderRadius: '6px',
						cursor: 'pointer',
						fontWeight: '600',
						fontSize: '14px',
					}}
				>
					🗑️ Clear All
				</button>
			</div>
		</div>
	);
};

/**
 * Main Demo Component
 */
export const ApiDisplayServiceDemo: React.FC = () => {
	const [showMonitors, setShowMonitors] = useState(true);

	return (
		<div
			style={{
				padding: '40px',
				maxWidth: '1200px',
				margin: '0 auto',
				fontFamily: 'system-ui, -apple-system, sans-serif',
			}}
		>
			{/* Header */}
			<div
				style={{
					marginBottom: '32px',
					padding: '24px',
					background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
					borderRadius: '12px',
					color: 'white', // White text on gradient background
				}}
			>
				<h1 style={{ margin: '0 0 8px 0', fontSize: '28px' }}>🎛️ API Display Service Demo</h1>
				<p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
					Interactive demonstration of the centralized API display visibility service
				</p>
			</div>

			{/* Instructions */}
			<div
				style={{
					padding: '20px',
					background: '#dbeafe', // Light blue background
					border: '2px solid #3b82f6',
					borderRadius: '8px',
					marginBottom: '24px',
				}}
			>
				<h3 style={{ margin: '0 0 12px 0', color: '#1e40af' }}>📖 How to Use This Demo</h3>
				<ol style={{ margin: 0, paddingLeft: '20px', color: '#1f2937' }}>
					<li style={{ marginBottom: '8px' }}>
						Use the <strong>Control Panel</strong> to show/hide the API display
					</li>
					<li style={{ marginBottom: '8px' }}>
						Watch the <strong>Status Monitors</strong> update in real-time
					</li>
					<li style={{ marginBottom: '8px' }}>
						Generate sample API calls to see them in the display
					</li>
					<li style={{ marginBottom: '8px' }}>
						Try the <strong>✕ Close</strong> button in the API display header
					</li>
					<li>Check the browser console for detailed logging</li>
				</ol>
			</div>

			{/* Control Panel */}
			<ControlPanel />

			{/* API Call Generator */}
			<ApiCallGenerator />

			{/* Status Monitors */}
			<div
				style={{
					marginBottom: '20px',
				}}
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '12px',
					}}
				>
					<h3 style={{ margin: 0, color: '#1f2937' }}>📊 Status Monitors (Multiple Subscribers)</h3>
					<button
						type="button"
						onClick={() => setShowMonitors(!showMonitors)}
						style={{
							padding: '6px 12px',
							background: '#6b7280',
							color: 'white', // White text on grey background
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							fontSize: '12px',
							fontWeight: '600',
						}}
					>
						{showMonitors ? 'Hide' : 'Show'} Monitors
					</button>
				</div>

				{showMonitors && (
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
							gap: '12px',
						}}
					>
						<StatusMonitor id={1} />
						<StatusMonitor id={2} />
						<StatusMonitor id={3} />
						<StatusMonitor id={4} />
					</div>
				)}
			</div>

			{/* Key Features */}
			<div
				style={{
					padding: '20px',
					background: '#f9fafb', // Light grey background
					border: '2px solid #e5e7eb',
					borderRadius: '8px',
					marginBottom: '20px',
				}}
			>
				<h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>✨ Key Features</h3>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
						gap: '16px',
					}}
				>
					<div>
						<div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
						<strong style={{ color: '#374151' }}>Centralized Control</strong>
						<p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
							Single service manages state across all components
						</p>
					</div>
					<div>
						<div style={{ fontSize: '24px', marginBottom: '8px' }}>🔄</div>
						<strong style={{ color: '#374151' }}>Real-time Sync</strong>
						<p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
							All subscribers update automatically when state changes
						</p>
					</div>
					<div>
						<div style={{ fontSize: '24px', marginBottom: '8px' }}>💾</div>
						<strong style={{ color: '#374151' }}>Persistent State</strong>
						<p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
							State saved to localStorage and survives page reloads
						</p>
					</div>
					<div>
						<div style={{ fontSize: '24px', marginBottom: '8px' }}>✕</div>
						<strong style={{ color: '#374151' }}>Close Button</strong>
						<p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
							Users can close the display from any page
						</p>
					</div>
				</div>
			</div>

			{/* Code Example */}
			<div
				style={{
					padding: '20px',
					background: '#1f2937', // Dark background
					border: '2px solid #374151',
					borderRadius: '8px',
					marginBottom: '100px',
				}}
			>
				<h3 style={{ margin: '0 0 16px 0', color: '#f9fafb' }}>💻 Code Example</h3>
				<pre
					style={{
						margin: 0,
						padding: '16px',
						background: '#111827',
						borderRadius: '6px',
						color: '#10b981', // Green text on dark background
						fontSize: '12px',
						overflow: 'auto',
						fontFamily: 'monospace',
					}}
				>
					{`import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';

// Show/hide the API display
apiDisplayServiceV8.show();
apiDisplayServiceV8.hide();
apiDisplayServiceV8.toggle();

// Check current state
const isVisible = apiDisplayServiceV8.isVisible();

// Subscribe to changes
const unsubscribe = apiDisplayServiceV8.subscribe((visible) => {
  console.log('Visibility changed:', visible);
});

// Clean up when component unmounts
return () => unsubscribe();`}
				</pre>
			</div>

			{/* The actual API Display component */}
			<SuperSimpleApiDisplayV8 />
		</div>
	);
};

export default ApiDisplayServiceDemo;
