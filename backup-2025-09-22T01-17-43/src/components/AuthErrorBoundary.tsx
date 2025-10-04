import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

class AuthErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		// Update state so the next render will show the fallback UI
		return { hasError: true, error };
	}

	override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		logger.error('AuthErrorBoundary', 'Caught error in auth context', { error, errorInfo });
	}

	override render() {
		if (this.state.hasError) {
			// You can render any custom fallback UI
			return (
				<div
					style={{
						padding: '2rem',
						textAlign: 'center',
						backgroundColor: '#fef2f2',
						border: '1px solid #fecaca',
						borderRadius: '0.5rem',
						margin: '1rem',
					}}
				>
					<h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Authentication Error</h2>
					<p style={{ color: '#7f1d1d', marginBottom: '1rem' }}>
						There was an error with the authentication system. Please refresh the page.
					</p>
					<button
						type="button"
						onClick={() => window.location.reload()}
						style={{
							backgroundColor: '#dc2626',
							color: 'white',
							border: 'none',
							padding: '0.5rem 1rem',
							borderRadius: '0.375rem',
							cursor: 'pointer',
						}}
					>
						Refresh Page
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}

export default AuthErrorBoundary;
