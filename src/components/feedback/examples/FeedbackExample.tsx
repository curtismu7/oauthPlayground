/**
 * @file FeedbackExample.tsx
 * @module components/feedback/examples
 * @description Example component demonstrating new feedback patterns
 * @version 9.3.6
 * @since 2026-02-23
 *
 * Shows how to replace toast notifications with the new feedback system
 * including inline messages, page banners, and snackbars.
 */

import React, { useState } from 'react';
import {
	feedbackService,
	showErrorBanner,
	showInlineError,
	showSuccessSnackbar,
} from '@/services/feedback/feedbackService';

// Example form component using inline messages
const ExampleForm: React.FC = () => {
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [values, setValues] = useState({ email: '', password: '' });

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const newErrors: Record<string, string> = {};

		// Validation logic
		if (!values.email) {
			newErrors.email = 'Email is required';
		}
		if (!values.password) {
			newErrors.password = 'Password is required';
		}

		setErrors(newErrors);

		if (Object.keys(newErrors).length === 0) {
			// Success - show snackbar
			showSuccessSnackbar('Form submitted successfully!');
		}
	};

	const handleChange = (field: string, value: string) => {
		setValues((prev) => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: '' }));
		}
	};

	return (
		<div className="end-user-nano">
			<form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '2rem auto' }}>
				<h2>Example Form</h2>

				<div style={{ marginBottom: '1rem' }}>
					<label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>
						Email
					</label>
					<input
						id="email"
						type="email"
						value={values.email}
						onChange={(e) => handleChange('email', e.target.value)}
						style={{
							width: '100%',
							padding: '0.5rem',
							border: '1px solid var(--ping-border-color, #e5e7eb)',
							borderRadius: '4px',
						}}
					/>
					{errors.email && showInlineError(errors.email, 'email')}
				</div>

				<div style={{ marginBottom: '1rem' }}>
					<label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>
						Password
					</label>
					<input
						id="password"
						type="password"
						value={values.password}
						onChange={(e) => handleChange('password', e.target.value)}
						style={{
							width: '100%',
							padding: '0.5rem',
							border: '1px solid var(--ping-border-color, #e5e7eb)',
							borderRadius: '4px',
						}}
					/>
					{errors.password && showInlineError(errors.password, 'password')}
				</div>

				<button
					type="submit"
					style={{
						padding: '0.75rem 1.5rem',
						background: 'var(--ping-primary-color, #3b82f6)',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
					}}
				>
					Submit
				</button>
			</form>
		</div>
	);
};

// Example page with banner
const ExamplePage: React.FC = () => {
	const [showError, setShowError] = useState(false);

	const handleRetry = () => {
		setShowError(false);
		// Retry logic here
	};

	return (
		<div className="end-user-nano">
			{showError &&
				showErrorBanner(
					'Connection Issues Detected',
					'Unable to connect to the server. Please check your network connection.',
					{ label: 'Retry', onClick: handleRetry }
				)}

			<div style={{ padding: '2rem' }}>
				<h1>Example Page</h1>
				<p>This page demonstrates the new feedback system.</p>

				<button
					type="button"
					onClick={() => setShowError(true)}
					style={{
						padding: '0.5rem 1rem',
						background: 'var(--ping-error-color, #dc2626)',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
						marginRight: '1rem',
					}}
				>
					Show Error Banner
				</button>

				<button
					type="button"
					onClick={() => setShowError(false)}
					style={{
						padding: '0.5rem 1rem',
						background: 'var(--ping-success-color, #059669)',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
					}}
				>
					Clear Banner
				</button>
			</div>

			<ExampleForm />
		</div>
	);
};

// Main example component
export const FeedbackExample: React.FC = () => {
	return <ExamplePage />;
};

export default FeedbackExample;
