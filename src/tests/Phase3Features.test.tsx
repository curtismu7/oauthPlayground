import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CachingDashboard } from '../components/CachingDashboard';
import { FlowComparisonTools } from '../components/FlowComparisonTools';
import { MobileResponsiveness } from '../components/MobileResponsiveness';
import { PerformanceMonitor } from '../components/PerformanceMonitor';
import { UXEnhancements } from '../components/UXEnhancements';
import { useAccessibility } from '../hooks/useAccessibility';
import { useFlowAnalysis } from '../hooks/useFlowAnalysis';
import { useServiceWorker } from '../hooks/useServiceWorker';
import { theme } from '../styles/global';
import { flowAnalyzer } from '../utils/flowAnalysis';

// Mock the logger
vi.mock('../utils/logger', () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	},
}));

// Mock browser APIs
const mockMatchMedia = vi.fn(() => ({
	matches: false,
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: mockMatchMedia,
});

// Mock service worker APIs
Object.defineProperty(navigator, 'serviceWorker', {
	writable: true,
	value: {
		register: vi.fn(),
		ready: Promise.resolve({
			register: vi.fn(),
		}),
		controller: null,
	},
});

// Mock caches API
Object.defineProperty(window, 'caches', {
	writable: true,
	value: {
		open: vi.fn(),
		keys: vi.fn(),
		delete: vi.fn(),
	},
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
	writable: true,
	value: {
		writeText: vi.fn(),
	},
});

// Mock share API
Object.defineProperty(navigator, 'share', {
	writable: true,
	value: vi.fn(),
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<BrowserRouter>
		<ThemeProvider theme={theme}>{children}</ThemeProvider>
	</BrowserRouter>
);

describe('Phase 3 Features', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Flow Comparison Tools', () => {
		it('should render flow comparison interface', () => {
			render(
				<TestWrapper>
					<FlowComparisonTools />
				</TestWrapper>
			);

			expect(screen.getByText('OAuth Flow Comparison Tools')).toBeInTheDocument();
			expect(screen.getByText('Authorization Code')).toBeInTheDocument();
			expect(screen.getByText('Implicit Grant')).toBeInTheDocument();
		});

		it('should allow selecting flows for comparison', async () => {
			render(
				<TestWrapper>
					<FlowComparisonTools />
				</TestWrapper>
			);

			const authCodeButton = screen.getByText('Authorization Code');
			fireEvent.click(authCodeButton);

			await waitFor(() => {
				expect(authCodeButton).toHaveAttribute('aria-pressed', 'true');
			});
		});

		it('should limit selection to 4 flows maximum', async () => {
			render(
				<TestWrapper>
					<FlowComparisonTools />
				</TestWrapper>
			);

			const flowButtons = screen.getAllByRole('button');
			const flowChips = flowButtons.filter(
				(button) =>
					button.textContent?.includes('Code') ||
					button.textContent?.includes('Implicit') ||
					button.textContent?.includes('Client') ||
					button.textContent?.includes('Device') ||
					button.textContent?.includes('Password')
			);

			// Select 4 flows
			fireEvent.click(flowChips[0]);
			fireEvent.click(flowChips[1]);
			fireEvent.click(flowChips[2]);
			fireEvent.click(flowChips[3]);

			// Try to select a 5th flow
			fireEvent.click(flowChips[4]);

			// Should not be selected
			expect(flowChips[4]).toHaveAttribute('aria-pressed', 'false');
		});

		it('should switch between side-by-side and table views', async () => {
			render(
				<TestWrapper>
					<FlowComparisonTools />
				</TestWrapper>
			);

			// Select a flow first
			const authCodeButton = screen.getByText('Authorization Code');
			fireEvent.click(authCodeButton);

			await waitFor(() => {
				const viewButton = screen.getByText('Table View');
				fireEvent.click(viewButton);
			});

			expect(screen.getByText('Side-by-Side View')).toBeInTheDocument();
		});
	});

	describe('Performance Monitor', () => {
		it('should render performance monitoring interface', () => {
			render(
				<TestWrapper>
					<PerformanceMonitor />
				</TestWrapper>
			);

			expect(screen.getByText('Performance Monitor')).toBeInTheDocument();
		});

		it('should display performance metrics', async () => {
			render(
				<TestWrapper>
					<PerformanceMonitor />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByText(/Load Time/)).toBeInTheDocument();
				expect(screen.getByText(/Render Time/)).toBeInTheDocument();
			});
		});
	});

	describe('Caching Dashboard', () => {
		it('should render caching dashboard', () => {
			render(
				<TestWrapper>
					<CachingDashboard />
				</TestWrapper>
			);

			expect(screen.getByText('Caching Dashboard')).toBeInTheDocument();
		});

		it('should display service worker status', async () => {
			render(
				<TestWrapper>
					<CachingDashboard />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByText(/Service Worker/)).toBeInTheDocument();
				expect(screen.getByText(/Cache Storage/)).toBeInTheDocument();
			});
		});
	});

	describe('UX Enhancements', () => {
		it('should render loading spinner component', () => {
			const { LoadingSpinnerComponent } = UXEnhancements;

			render(
				<TestWrapper>
					<LoadingSpinnerComponent message="Loading..." />
				</TestWrapper>
			);

			expect(screen.getByText('Loading...')).toBeInTheDocument();
		});

		it('should render status message component', () => {
			const { StatusMessage } = UXEnhancements;

			render(
				<TestWrapper>
					<StatusMessage status="success" title="Success" message="Operation completed" />
				</TestWrapper>
			);

			expect(screen.getByText('Success')).toBeInTheDocument();
			expect(screen.getByText('Operation completed')).toBeInTheDocument();
		});

		it('should render progress indicator', () => {
			const { ProgressIndicator } = UXEnhancements;

			const steps = [
				{ id: '1', title: 'Step 1', description: 'First step', status: 'completed' as const },
				{ id: '2', title: 'Step 2', description: 'Second step', status: 'active' as const },
			];

			render(
				<TestWrapper>
					<ProgressIndicator steps={steps} />
				</TestWrapper>
			);

			expect(screen.getByText('Step 1')).toBeInTheDocument();
			expect(screen.getByText('Step 2')).toBeInTheDocument();
		});
	});

	describe('Mobile Responsiveness', () => {
		it('should render mobile responsive components', () => {
			const { MobileResponsiveContainer } = MobileResponsiveness;

			render(
				<TestWrapper>
					<MobileResponsiveContainer>
						<div>Test Content</div>
					</MobileResponsiveContainer>
				</TestWrapper>
			);

			expect(screen.getByText('Test Content')).toBeInTheDocument();
		});

		it('should render mobile responsive button', () => {
			const { MobileResponsiveButton } = MobileResponsiveness;

			render(
				<TestWrapper>
					<MobileResponsiveButton onClick={() => {}}>Test Button</MobileResponsiveButton>
				</TestWrapper>
			);

			expect(screen.getByText('Test Button')).toBeInTheDocument();
		});
	});

	describe('Accessibility Hook', () => {
		it('should provide accessibility functionality', () => {
			const TestComponent = () => {
				const { announceToScreenReader, setFocus } = useAccessibility();

				return (
					<div>
						<button type="button" onClick={() => announceToScreenReader('Test message')}>
							Announce
						</button>
						<button type="button" onClick={() => setFocus('test-element')}>
							Set Focus
						</button>
					</div>
				);
			};

			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>
			);

			expect(screen.getByText('Announce')).toBeInTheDocument();
			expect(screen.getByText('Set Focus')).toBeInTheDocument();
		});
	});

	describe('Service Worker Hook', () => {
		it('should provide service worker functionality', () => {
			const TestComponent = () => {
				const { isSupported, isRegistered, register } = useServiceWorker();

				return (
					<div>
						<span>Supported: {isSupported.toString()}</span>
						<span>Registered: {isRegistered.toString()}</span>
						<button type="button" onClick={register}>
							Register
						</button>
					</div>
				);
			};

			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>
			);

			expect(screen.getByText(/Supported:/)).toBeInTheDocument();
			expect(screen.getByText(/Registered:/)).toBeInTheDocument();
			expect(screen.getByText('Register')).toBeInTheDocument();
		});
	});

	describe('Flow Analysis Hook', () => {
		it('should provide flow analysis functionality', () => {
			const TestComponent = () => {
				const { selectedFlows, toggleFlow, analyzeFlows } = useFlowAnalysis();

				return (
					<div>
						<span>Flows: {selectedFlows.join(', ')}</span>
						<button type="button" onClick={() => toggleFlow('authorization-code')}>
							Toggle Auth Code
						</button>
						<button type="button" onClick={() => analyzeFlows(['authorization-code'])}>
							Analyze
						</button>
					</div>
				);
			};

			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>
			);

			expect(screen.getByText(/Flows:/)).toBeInTheDocument();
			expect(screen.getByText('Toggle Auth Code')).toBeInTheDocument();
			expect(screen.getByText('Analyze')).toBeInTheDocument();
		});
	});

	describe('Flow Analysis Utility', () => {
		it('should analyze individual flows', () => {
			const recommendation = flowAnalyzer.analyzeFlow('authorization-code');

			expect(recommendation.flowType).toBe('authorization-code');
			expect(recommendation.score).toBeGreaterThan(0);
			expect(recommendation.reasons).toBeInstanceOf(Array);
			expect(recommendation.useCases).toBeInstanceOf(Array);
		});

		it('should compare multiple flows', () => {
			const result = flowAnalyzer.compareFlows(['authorization-code', 'implicit']);

			expect(result.flows).toHaveLength(2);
			expect(result.bestOverall).toBeDefined();
			expect(result.bestSecurity).toBeDefined();
			expect(result.bestPerformance).toBeDefined();
			expect(result.summary).toBeDefined();
		});

		it('should provide flow recommendations', () => {
			const recommendations = flowAnalyzer.getRecommendations({
				securityLevel: 'high',
				backendAvailable: true,
				deviceType: 'web',
			});

			expect(recommendations).toBeInstanceOf(Array);
			expect(recommendations.length).toBeGreaterThan(0);
			expect(recommendations[0].score).toBeGreaterThan(0);
		});

		it('should get all available flows', () => {
			const flows = flowAnalyzer.getAllFlows();

			expect(flows).toContain('authorization-code');
			expect(flows).toContain('implicit');
			expect(flows).toContain('client-credentials');
			expect(flows).toContain('device-code');
			expect(flows).toContain('password');
		});

		it('should get flow details', () => {
			const details = flowAnalyzer.getFlowDetails('authorization-code');

			expect(details).toBeDefined();
			expect(details.name).toBe('Authorization Code');
			expect(details.metrics).toBeDefined();
			expect(details.features).toBeDefined();
			expect(details.useCases).toBeInstanceOf(Array);
		});
	});

	describe('Integration Tests', () => {
		it('should integrate flow comparison with analysis', async () => {
			render(
				<TestWrapper>
					<FlowComparisonTools />
				</TestWrapper>
			);

			// Select flows
			const authCodeButton = screen.getByText('Authorization Code');
			const implicitButton = screen.getByText('Implicit Grant');

			fireEvent.click(authCodeButton);
			fireEvent.click(implicitButton);

			await waitFor(() => {
				// Should show comparison
				expect(screen.getByText(/Security/)).toBeInTheDocument();
				expect(screen.getByText(/Complexity/)).toBeInTheDocument();
				expect(screen.getByText(/Performance/)).toBeInTheDocument();
			});
		});

		it('should handle export functionality', async () => {
			render(
				<TestWrapper>
					<FlowComparisonTools />
				</TestWrapper>
			);

			// Select a flow
			const authCodeButton = screen.getByText('Authorization Code');
			fireEvent.click(authCodeButton);

			await waitFor(() => {
				const exportButton = screen.getByText('Export Data');
				fireEvent.click(exportButton);
			});

			// Should trigger download (mocked)
			expect(navigator.clipboard.writeText).toHaveBeenCalled();
		});

		it('should handle share functionality', async () => {
			render(
				<TestWrapper>
					<FlowComparisonTools />
				</TestWrapper>
			);

			// Select a flow
			const authCodeButton = screen.getByText('Authorization Code');
			fireEvent.click(authCodeButton);

			await waitFor(() => {
				const shareButton = screen.getByText('Share Comparison');
				fireEvent.click(shareButton);
			});

			// Should trigger share (mocked)
			expect(navigator.share).toHaveBeenCalled();
		});
	});
});
