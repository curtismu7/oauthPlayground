/**
 * @file DynamicFormRenderer.tsx
 * @module v8/flows/unified/components
 * @description Dynamic form renderer based on deviceFlowConfigs
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Render device-specific forms dynamically without hardcoding forms for each device.
 * Maps field names from deviceFlowConfigs to appropriate input components.
 *
 * Supported Fields:
 * - phoneNumber: Phone number input with validation
 * - countryCode: Country code picker dropdown
 * - email: Email input with validation
 * - deviceName: Text input (max 50 chars)
 * - nickname: Text input (max 100 chars, optional)
 *
 * @example
 * <DynamicFormRenderer
 *   config={smsConfig}
 *   values={deviceFields}
 *   onChange={handleFieldChange}
 *   errors={errors}
 * />
 */

import React from 'react';
import { CountryCodePickerV8 } from '@/v8/components/CountryCodePickerV8';
import { EmailInputV8 } from '@/v8/components/EmailInputV8';
import type { DeviceFlowConfig } from '@/v8/config/deviceFlowConfigTypes';

const MODULE_TAG = '[📋 DYNAMIC-FORM-RENDERER]';

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface DynamicFormRendererProps {
	/** Device flow configuration */
	config: DeviceFlowConfig;

	/** Current field values */
	values: Record<string, string>;

	/** Field change callback */
	onChange: (field: string, value: string) => void;

	/** Validation errors (field name → error message) */
	errors?: Record<string, string>;

	/** Touch callback (marks field as touched for validation) */
	onTouch?: (field: string) => void;

	/** Disabled state */
	disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Dynamic Form Renderer
 *
 * Renders form fields dynamically based on deviceFlowConfigs instead of
 * hardcoding forms for each device type.
 */
export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
	config,
	values,
	onChange,
	errors = {},
	onTouch,
	disabled = false,
}) => {
	console.log(`${MODULE_TAG} Rendering form for device:`, config.deviceType);
	console.log(`${MODULE_TAG} Required fields:`, config.requiredFields);
	console.log(`${MODULE_TAG} Optional fields:`, config.optionalFields);

	// ========================================================================
	// FIELD RENDERERS
	// ========================================================================

	/**
	 * Render a single form field based on field name
	 */
	const renderField = (fieldName: string, isRequired: boolean) => {
		const value = values[fieldName] || '';
		const error = errors[fieldName];
		const hasError = !!error;

		console.log(`${MODULE_TAG} Rendering field:`, fieldName, { isRequired, hasError });

		// Handle field blur (mark as touched)
		const handleBlur = () => {
			if (onTouch) {
				onTouch(fieldName);
			}
		};

		// Map field names to input components
		switch (fieldName) {
			case 'phoneNumber':
				return (
					<div key={fieldName} className="form-field phone-number-field">
						<label htmlFor="phoneNumber">
							Phone Number {isRequired && <span className="required">*</span>}
						</label>
						<input
							id="phoneNumber"
							type="tel"
							value={value}
							onChange={(e) => onChange(fieldName, e.target.value)}
							onBlur={handleBlur}
							disabled={disabled}
							placeholder="+1 (512) 520-1234"
							className={hasError ? 'input-error' : ''}
							aria-invalid={hasError}
							aria-describedby={hasError ? `${fieldName}-error` : undefined}
						/>
						{hasError && (
							<span id={`${fieldName}-error`} className="error-message" role="alert">
								{error}
							</span>
						)}
						<span className="field-hint">Enter phone number with country code</span>
					</div>
				);

			case 'countryCode':
				return (
					<div key={fieldName} className="form-field country-code-field">
						<label htmlFor="countryCode">
							Country Code {isRequired && <span className="required">*</span>}
						</label>
						<CountryCodePickerV8
							value={value}
							onChange={(val) => onChange(fieldName, val)}
							onBlur={handleBlur}
							disabled={disabled}
							error={error}
						/>
						{hasError && (
							<span id={`${fieldName}-error`} className="error-message" role="alert">
								{error}
							</span>
						)}
					</div>
				);

			case 'email':
				return (
					<div key={fieldName} className="form-field email-field">
						<EmailInputV8
							value={value}
							onChange={(val) => onChange(fieldName, val)}
							onBlur={handleBlur}
							disabled={disabled}
							error={error}
							required={isRequired}
							placeholder="user@example.com"
						/>
					</div>
				);

			case 'deviceName':
				return (
					<div key={fieldName} className="form-field device-name-field">
						<label htmlFor="deviceName">
							Device Name {isRequired && <span className="required">*</span>}
						</label>
						<input
							id="deviceName"
							type="text"
							value={value}
							onChange={(e) => onChange(fieldName, e.target.value)}
							onBlur={handleBlur}
							disabled={disabled}
							placeholder="My Device"
							maxLength={50}
							className={hasError ? 'input-error' : ''}
							aria-invalid={hasError}
							aria-describedby={hasError ? `${fieldName}-error` : undefined}
						/>
						{hasError && (
							<span id={`${fieldName}-error`} className="error-message" role="alert">
								{error}
							</span>
						)}
						<span className="field-hint">Maximum 50 characters</span>
					</div>
				);

			case 'nickname':
				return (
					<div key={fieldName} className="form-field nickname-field">
						<label htmlFor="nickname">
							Nickname {isRequired && <span className="required">*</span>}
						</label>
						<input
							id="nickname"
							type="text"
							value={value}
							onChange={(e) => onChange(fieldName, e.target.value)}
							onBlur={handleBlur}
							disabled={disabled}
							placeholder="Optional nickname"
							maxLength={100}
							className={hasError ? 'input-error' : ''}
							aria-invalid={hasError}
							aria-describedby={hasError ? `${fieldName}-error` : undefined}
						/>
						{hasError && (
							<span id={`${fieldName}-error`} className="error-message" role="alert">
								{error}
							</span>
						)}
						<span className="field-hint">Maximum 100 characters (optional)</span>
					</div>
				);

			default:
				console.warn(`${MODULE_TAG} Unknown field type:`, fieldName);
				return (
					<div key={fieldName} className="form-field unknown-field">
						<label htmlFor={fieldName}>
							{fieldName} {isRequired && <span className="required">*</span>}
						</label>
						<input
							id={fieldName}
							type="text"
							value={value}
							onChange={(e) => onChange(fieldName, e.target.value)}
							onBlur={handleBlur}
							disabled={disabled}
							className={hasError ? 'input-error' : ''}
							aria-invalid={hasError}
							aria-describedby={hasError ? `${fieldName}-error` : undefined}
						/>
						{hasError && (
							<span id={`${fieldName}-error`} className="error-message" role="alert">
								{error}
							</span>
						)}
					</div>
				);
		}
	};

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div className="dynamic-form-renderer">
			{/* Device Information */}
			<div className="device-info">
				<h3>
					{config.icon} {config.displayName}
				</h3>
				<p className="device-description">{config.description}</p>
			</div>

			{/* Form Fields */}
			<div className="form-fields">
				{/* Required Fields Section */}
				{config.requiredFields.length > 0 && (
					<div className="required-fields-section">
						<h4>Required Information</h4>
						{config.requiredFields.map((field) => renderField(field, true))}
					</div>
				)}

				{/* Optional Fields Section */}
				{config.optionalFields.length > 0 && (
					<div className="optional-fields-section">
						<h4>Optional Information</h4>
						{config.optionalFields.map((field) => renderField(field, false))}
					</div>
				)}

				{/* No fields message (for devices like TOTP, FIDO2) */}
				{config.requiredFields.length === 0 && config.optionalFields.length === 0 && (
					<div className="no-fields-message">
						<p>No additional information required.</p>
						<p>You can optionally provide a device name to identify this device.</p>
					</div>
				)}
			</div>

			{/* Educational Content (if available) */}
			{config.educationalContent && (
				<details
					style={{
						marginTop: '20px',
						padding: '16px',
						background: '#f9fafb',
						border: '1px solid #e5e7eb',
						borderRadius: '8px',
					}}
				>
					<summary
						style={{
							cursor: 'pointer',
							fontWeight: '600',
							fontSize: '14px',
							color: '#374151',
							userSelect: 'none',
						}}
					>
						▼ Learn more about {config.displayName}
					</summary>
					<div
						style={{
							marginTop: '16px',
							fontSize: '14px',
							lineHeight: '1.6',
							color: '#4b5563',
						}}
					>
						{config.educationalContent.split('\n').map((line, index) => {
							// Handle headers
							if (line.startsWith('## ')) {
								return (
									<h3
										key={index}
										style={{
											fontSize: '16px',
											fontWeight: '700',
											color: '#111827',
											marginTop: index === 0 ? '0' : '16px',
											marginBottom: '8px',
										}}
									>
										{line.replace('## ', '')}
									</h3>
								);
							}
							if (line.startsWith('### ')) {
								return (
									<h4
										key={index}
										style={{
											fontSize: '14px',
											fontWeight: '600',
											color: '#1f2937',
											marginTop: '12px',
											marginBottom: '6px',
										}}
									>
										{line.replace('### ', '')}
									</h4>
								);
							}
							// Handle list items
							if (line.trim().startsWith('- ')) {
								return (
									<li
										key={index}
										style={{
											marginLeft: '20px',
											marginBottom: '4px',
										}}
									>
										{line.replace(/^- /, '')}
									</li>
								);
							}
							// Handle numbered lists
							if (/^\d+\.\s/.test(line.trim())) {
								return (
									<li
										key={index}
										style={{
											marginLeft: '20px',
											marginBottom: '4px',
										}}
									>
										{line.replace(/^\d+\.\s/, '')}
									</li>
								);
							}
							// Handle empty lines
							if (line.trim() === '') {
								return <div key={index} style={{ height: '8px' }} />;
							}
							// Regular paragraphs
							return (
								<p
									key={index}
									style={{
										margin: '0 0 8px 0',
									}}
								>
									{line}
								</p>
							);
						})}
					</div>
				</details>
			)}
		</div>
	);
};

export default DynamicFormRenderer;
