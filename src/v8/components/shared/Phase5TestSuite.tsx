import React, { useState, useEffect } from 'react';
import { FlowProgressTrackerV8 } from './FlowProgressTrackerV8';
import { LazyLoadWrapperV8, ComponentPreloader } from './LazyLoadWrapperV8';
import { ComponentTestSuiteV8 } from './ComponentTestSuiteV8';

// Test component for lazy loading
const TestComponent: React.FC<{ message: string; delay?: number }> = ({ 
	message, 
	delay = 1000 
}) => {
	const [loaded, setLoaded] = useState(false);
	
	useEffect(() => {
		const timer = setTimeout(() => setLoaded(true), delay);
		return () => clearTimeout(timer);
	}, [delay]);

	return (
		<div style={{
			padding: '20px',
			background: loaded ? '#e8f5e8' : '#fff3cd',
			border: `2px solid ${loaded ? '#28a745' : '#ffc107'}`,
			borderRadius: '8px',
			margin: '10px 0'
		}}>
			<h3>Test Component</h3>
			<p>{message}</p>
			<p>Status: {loaded ? '✅ Loaded' : '⏳ Loading...'}</p>
		</div>
	);
};

// Lazy loaded test component
const LazyTestComponent = React.lazy(() => 
	new Promise<{ default: typeof TestComponent }>((resolve) => {
		setTimeout(() => {
			resolve({ default: TestComponent });
		}, 1500);
	})
);

export const Phase5TestSuite: React.FC = () => {
	const [testResults, setTestResults] = useState<any[]>([]);
	const [lazyLoadTest, setLazyLoadTest] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
	const [preloadTest, setPreloadTest] = useState<'idle' | 'loading' | 'loaded'>('idle');

	// Test FlowProgressTrackerV8
	const flowSteps = [
		{ id: 1, label: 'Configure', status: 'completed' as const, description: 'Set up credentials', estimatedTime: '2 min' },
		{ id: 2, label: 'Select Device', status: 'active' as const, description: 'Choose your device', estimatedTime: '1 min' },
		{ id: 3, label: 'Register', status: 'pending' as const, description: 'Register new device', estimatedTime: '3 min' },
		{ id: 4, label: 'Validate', status: 'pending' as const, description: 'Complete validation', estimatedTime: '2 min' },
	];

	// Test Lazy Loading
	const testLazyLoading = () => {
		setLazyLoadTest('loading');
		
		// Test immediate load
		setTimeout(() => {
			setLazyLoadTest('loaded');
		}, 2000);
	};

	// Test Preloading
	const testPreloading = async () => {
		setPreloadTest('loading');
		
		try {
			// Test component preloading
			await ComponentPreloader.preload('test-component', () => 
				new Promise<{ default: typeof TestComponent }>((resolve) => {
					setTimeout(() => {
						resolve({ default: TestComponent });
					}, 1000);
				})
			);
			
			setPreloadTest('loaded');
		} catch (error) {
			console.error('Preload test failed:', error);
			setPreloadTest('idle');
		}
	};

	// Test Component Suite
	const components = ['FlowProgressTrackerV8', 'LazyLoadWrapperV8', 'ComponentTestSuiteV8'];

	const handleTestComplete = (results: any[]) => {
		setTestResults(results);
		console.log('Test Results:', results);
	};

	// Manual lazy loading test
	const [manualLazyLoaded, setManualLazyLoaded] = useState(false);

	return (
		<div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
			<h1>🧪 Phase 5 Component Test Suite</h1>
			
			{/* FlowProgressTrackerV8 Test */}
			<section style={{ marginBottom: '40px' }}>
				<h2>📊 FlowProgressTrackerV8 Test</h2>
				<div style={{ marginBottom: '20px' }}>
					<FlowProgressTrackerV8
						steps={flowSteps}
						currentStep={2}
						showProgress={true}
						showTimeEstimates={true}
						variant="horizontal"
						onStepClick={(stepId) => console.log('Step clicked:', stepId)}
					/>
				</div>
				
				<div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
					<div style={{ flex: 1, minWidth: '300px' }}>
						<h3>Vertical Variant</h3>
						<FlowProgressTrackerV8
							steps={flowSteps}
							currentStep={2}
							variant="vertical"
							showProgress={false}
						/>
					</div>
					
					<div style={{ flex: 1, minWidth: '300px' }}>
						<h3>Compact Variant</h3>
						<FlowProgressTrackerV8
							steps={flowSteps}
							currentStep={2}
							variant="compact"
							showProgress={false}
						/>
					</div>
				</div>
			</section>

			{/* LazyLoadWrapperV8 Test */}
			<section style={{ marginBottom: '40px' }}>
				<h2>⚡ LazyLoadWrapperV8 Test</h2>
				
				<div style={{ marginBottom: '20px' }}>
					<button 
						onClick={testLazyLoading}
						style={{
							padding: '10px 20px',
							background: '#007bff',
							color: 'white',
							border: 'none',
							borderRadius: '5px',
							cursor: 'pointer',
							marginRight: '10px'
						}}
					>
						Test Lazy Loading
					</button>
					
					<button 
						onClick={testPreloading}
						style={{
							padding: '10px 20px',
							background: '#28a745',
							color: 'white',
							border: 'none',
							borderRadius: '5px',
							cursor: 'pointer',
							marginRight: '10px'
						}}
					>
						Test Preloading
					</button>
					
					<button 
						onClick={() => setManualLazyLoaded(!manualLazyLoaded)}
						style={{
							padding: '10px 20px',
							background: '#ffc107',
							color: 'black',
							border: 'none',
							borderRadius: '5px',
							cursor: 'pointer'
						}}
					>
						Toggle Manual Lazy Load
					</button>
				</div>
				
				<div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
					<div style={{ flex: 1, minWidth: '300px' }}>
						<h3>Immediate Load Test</h3>
						<TestComponent message="This component loads immediately" delay={0} />
					</div>
					
					<div style={{ flex: 1, minWidth: '300px' }}>
						<h3>Delayed Load Test</h3>
						<TestComponent message="This component has a 2-second delay" delay={2000} />
					</div>
					
					<div style={{ flex: 1, minWidth: '300px' }}>
						<h3>Lazy Load Test Status: {lazyLoadTest}</h3>
						{lazyLoadTest === 'loading' && (
							<div style={{ padding: '20px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px' }}>
								⏳ Simulating lazy load...
							</div>
						)}
						{lazyLoadTest === 'loaded' && (
							<TestComponent message="Successfully lazy loaded!" delay={0} />
						)}
					</div>
				</div>
				
				<div style={{ marginTop: '20px' }}>
					<h3>React.lazy() Test</h3>
					{manualLazyLoaded && (
						<React.Suspense fallback={
							<div style={{ padding: '20px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px' }}>
								⏳ Loading lazy component...
							</div>
						}>
							<LazyTestComponent message="This is a React.lazy() component" />
						</React.Suspense>
					)}
				</div>
				
				<div style={{ marginTop: '20px' }}>
					<h3>Preload Test Status: {preloadTest}</h3>
					{preloadTest === 'loading' && (
						<div style={{ padding: '20px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px' }}>
							⏳ Preloading component...
						</div>
					)}
					{preloadTest === 'loaded' && (
						<div style={{ padding: '20px', background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '5px' }}>
							✅ Component preloaded successfully!
						</div>
					)}
				</div>
			</section>

			{/* ComponentTestSuiteV8 Test */}
			<section style={{ marginBottom: '40px' }}>
				<h2>🧪 ComponentTestSuiteV8 Test</h2>
				<ComponentTestSuiteV8
					components={components}
					onTestComplete={handleTestComplete}
					autoRun={false}
					showDetails={true}
				/>
				
				{testResults.length > 0 && (
					<div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
						<h3>Test Results Summary:</h3>
						<pre style={{ fontSize: '12px', overflow: 'auto' }}>
							{JSON.stringify(testResults, null, 2)}
						</pre>
					</div>
				)}
			</section>

			{/* Performance Monitor */}
			<section style={{ marginBottom: '40px' }}>
				<h2>📈 Performance Monitor</h2>
				<div style={{ padding: '15px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px' }}>
					<p><strong>Memory Usage:</strong> Check browser dev tools</p>
					<p><strong>Network Requests:</strong> Check browser dev tools</p>
					<p><strong>Render Performance:</strong> Check browser dev tools</p>
					<p><strong>Lazy Loading:</strong> Scroll down to test intersection observer</p>
				</div>
			</section>

			{/* Intersection Observer Test Area */}
			<section style={{ marginBottom: '40px' }}>
				<h2>👁️ Intersection Observer Test</h2>
				<p>Scroll down to trigger lazy loading tests:</p>
				
				<div style={{ height: '200px', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0' }}>
					<p>Scroll down →</p>
				</div>
				
				<div style={{ height: '300px' }}>
					<LazyLoadWrapperV8
						loader={() => import('./FlowProgressTrackerV8').then(module => ({ default: module.FlowProgressTrackerV8 }))}
						threshold={0.1}
						delay={500}
						onLoad={() => console.log('Lazy component loaded!')}
						onError={(error) => console.error('Lazy load error:', error)}
					>
						<div style={{ height: '300px', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
							<p>Scroll into view to load component...</p>
						</div>
					</LazyLoadWrapperV8>
				</div>
				
				<div style={{ height: '200px', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0' }}>
					<p>↑ Scroll up to test again</p>
				</div>
			</section>

			{/* Console Output */}
			<section>
				<h2>📝 Console Output</h2>
				<div style={{ padding: '15px', background: '#2d3748', color: '#e2e8f0', borderRadius: '5px', fontFamily: 'monospace', fontSize: '12px' }}>
					<p>Check browser console for detailed test output...</p>
					<p>• FlowProgressTrackerV8: Step clicks and interactions</p>
					<p>• LazyLoadWrapperV8: Load events and errors</p>
					<p>• ComponentTestSuiteV8: Test execution logs</p>
					<p>• Performance: Memory and network metrics</p>
				</div>
			</section>
		</div>
	);
};

export default Phase5TestSuite;
