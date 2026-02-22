/**
 * @file UnifiedAuthMethodDropdown.tsx
 * @module shared/components
 * @description Unified authentication method dropdown using unifiedAuthenticationService
 * @version 1.0.0
 * @since 2025-02-19
 *
 * @example
 * <UnifiedAuthMethodDropdown
 *   value={authMethod}
 *   onChange={handleAuthMethodChange}
 *   flowType="oauth-authz"
 *   specVersion="oauth2.0"
 *   usePKCE={true}
 *   clientType="public"
 * />
 */

import React from 'react';
import { FiChevronDown, FiInfo } from 'react-icons/fi';
import {
	type FlowType,
	type SpecVersion,
	type UnifiedAuthMethod,
	unifiedAuthenticationService,
} from '@/shared/services/unifiedAuthenticationService';

const _MODULE_TAG = '[🔐 UNIFIED-AUTH-METHOD-DROPDOWN]';

export interface UnifiedAuthMethodDropdownProps {
	value: UnifiedAuthMethod;
	onChange: (method: UnifiedAuthMethod) => void;
	flowType: FlowType;
	specVersion: SpecVersion;
	usePKCE?: boolean;
	clientType: 'public' | 'confidential';
	disabled?: boolean;
	className?: string;
	id?: string;
	'aria-label'?: string;
}

export const UnifiedAuthMethodDropdown: React.FC<UnifiedAuthMethodDropdownProps> = ({
	value,
	onChange,
	flowType,
	specVersion,
	usePKCE = false,
	clientType,
	disabled = false,
	className = '',
	id = 'authMethod',
	'aria-label': ariaLabel = 'Token Endpoint Authentication Method',
}) => {
	// Get valid authentication methods for the current flow configuration
	const validMethods = React.useMemo(() => {
		return unifiedAuthenticationService.getValidAuthMethods(
			flowType,
			specVersion,
			usePKCE,
			clientType
		);
	}, [flowType, specVersion, usePKCE, clientType]);

	// Get all methods with status for display
	const allMethodsWithStatus = React.useMemo(() => {
		return unifiedAuthenticationService.getAllAuthMethodsWithStatus(flowType, specVersion, usePKCE);
	}, [flowType, specVersion, usePKCE]);

	const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const newMethod = event.target.value as UnifiedAuthMethod;
		onChange(newMethod);
	};

	// Get current method configuration
	const currentMethodConfig = React.useMemo(() => {
		return unifiedAuthenticationService.getAuthMethodConfig(value);
	}, [value]);

	return (
		<div className={`unified-auth-method-dropdown ${className}`}>
			<label
				htmlFor={id}
				style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px' }}
				htmlFor="tokenendpointauthentication"
			>
				Token Endpoint Authentication
			</label>

			<div style={{ position: 'relative' }}>
				<select
					id={id}
					value={value}
					onChange={handleChange}
					disabled={disabled}
					aria-label={ariaLabel}
					style={{
						width: '100%',
						padding: '10px 12px',
						paddingRight: '40px',
						border: '1px solid #d1d5db',
						borderRadius: '4px',
						fontSize: '14px',
						backgroundColor: disabled ? '#f9fafb' : '#ffffff',
						color: disabled ? '#9ca3af' : '#111827',
						cursor: disabled ? 'not-allowed' : 'pointer',
						appearance: 'none',
					}}
				>
					{allMethodsWithStatus.map((methodStatus) => {
						const isValid = validMethods.some((v) => v.method === methodStatus.method);
						return (
							<option
								key={methodStatus.method}
								value={methodStatus.method}
								disabled={!methodStatus.enabled || !isValid}
							>
								{methodStatus.enabled && isValid
									? methodStatus.label
									: `${methodStatus.label} (${methodStatus.disabledReason || 'Not available'})`}
							</option>
						);
					})}
				</select>

				<FiChevronDown
					style={{
						position: 'absolute',
						right: '12px',
						top: '50%',
						transform: 'translateY(-50%)',
						pointerEvents: 'none',
						color: disabled ? '#9ca3af' : '#6b7280',
					}}
				/>
			</div>

			{currentMethodConfig && (
				<div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
					<div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
						<FiInfo style={{ marginTop: '2px', flexShrink: 0 }} />
						<span>{currentMethodConfig.description}</span>
					</div>

					{currentMethodConfig.requiresClientSecret && (
						<div style={{ marginTop: '4px', fontStyle: 'italic' }}>Requires client secret</div>
					)}

					{currentMethodConfig.securityLevel && (
						<div style={{ marginTop: '4px' }}>
							Security Level: <strong>{currentMethodConfig.securityLevel.toUpperCase()}</strong>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default UnifiedAuthMethodDropdown;
