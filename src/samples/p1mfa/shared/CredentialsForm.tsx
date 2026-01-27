/**
 * @file CredentialsForm.tsx
 * @module samples/p1mfa/shared
 * @description Reusable form for PingOne credentials
 * @version 1.0.0
 */

import React, { useState } from 'react';
import type { P1MFAConfig } from '@/sdk/p1mfa';

interface CredentialsFormProps {
	onSubmit: (config: P1MFAConfig) => void;
	initialValues?: Partial<P1MFAConfig>;
	showPhone?: boolean;
}

export const CredentialsForm: React.FC<CredentialsFormProps> = ({
	onSubmit,
	initialValues,
	showPhone = false,
}) => {
	const [formData, setFormData] = useState<P1MFAConfig>({
		environmentId: initialValues?.environmentId || '',
		clientId: initialValues?.clientId || '',
		clientSecret: initialValues?.clientSecret || '',
		region: initialValues?.region || 'us',
		tokenEndpointAuthMethod: initialValues?.tokenEndpointAuthMethod || 'client_secret_post',
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	const handleChange = (field: keyof P1MFAConfig, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[field];
				return newErrors;
			});
		}
	};

	const validate = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.environmentId.trim()) {
			newErrors.environmentId = 'Environment ID is required';
		}

		if (!formData.clientId.trim()) {
			newErrors.clientId = 'Client ID is required';
		}

		if (!formData.clientSecret.trim()) {
			newErrors.clientSecret = 'Client Secret is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (validate()) {
			onSubmit(formData);
		}
	};

	return (
		<form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
			<div style={{ marginBottom: '1rem' }}>
				<label htmlFor="environmentId" style={{ display: 'block', marginBottom: '0.5rem' }}>
					Environment ID *
				</label>
				<input
					id="environmentId"
					type="text"
					value={formData.environmentId}
					onChange={(e) => handleChange('environmentId', e.target.value)}
					style={{
						width: '100%',
						padding: '0.5rem',
						border: errors.environmentId ? '1px solid red' : '1px solid #ccc',
						borderRadius: '4px',
					}}
				/>
				{errors.environmentId && (
					<span style={{ color: 'red', fontSize: '0.875rem' }}>{errors.environmentId}</span>
				)}
			</div>

			<div style={{ marginBottom: '1rem' }}>
				<label htmlFor="clientId" style={{ display: 'block', marginBottom: '0.5rem' }}>
					Client ID *
				</label>
				<input
					id="clientId"
					type="text"
					value={formData.clientId}
					onChange={(e) => handleChange('clientId', e.target.value)}
					style={{
						width: '100%',
						padding: '0.5rem',
						border: errors.clientId ? '1px solid red' : '1px solid #ccc',
						borderRadius: '4px',
					}}
				/>
				{errors.clientId && (
					<span style={{ color: 'red', fontSize: '0.875rem' }}>{errors.clientId}</span>
				)}
			</div>

			<div style={{ marginBottom: '1rem' }}>
				<label htmlFor="clientSecret" style={{ display: 'block', marginBottom: '0.5rem' }}>
					Client Secret *
				</label>
				<input
					id="clientSecret"
					type="password"
					value={formData.clientSecret}
					onChange={(e) => handleChange('clientSecret', e.target.value)}
					style={{
						width: '100%',
						padding: '0.5rem',
						border: errors.clientSecret ? '1px solid red' : '1px solid #ccc',
						borderRadius: '4px',
					}}
				/>
				{errors.clientSecret && (
					<span style={{ color: 'red', fontSize: '0.875rem' }}>{errors.clientSecret}</span>
				)}
			</div>

			<div style={{ marginBottom: '1rem' }}>
				<label htmlFor="region" style={{ display: 'block', marginBottom: '0.5rem' }}>
					Region
				</label>
				<select
					id="region"
					value={formData.region}
					onChange={(e) => handleChange('region', e.target.value)}
					style={{
						width: '100%',
						padding: '0.5rem',
						border: '1px solid #ccc',
						borderRadius: '4px',
					}}
				>
					<option value="us">US (North America)</option>
					<option value="eu">EU (Europe)</option>
					<option value="ap">AP (Asia Pacific)</option>
					<option value="ca">CA (Canada)</option>
				</select>
			</div>

			<button
				type="submit"
				style={{
					width: '100%',
					padding: '0.75rem',
					backgroundColor: '#007bff',
					color: 'white',
					border: 'none',
					borderRadius: '4px',
					cursor: 'pointer',
					fontSize: '1rem',
				}}
			>
				Initialize SDK
			</button>
		</form>
	);
};
