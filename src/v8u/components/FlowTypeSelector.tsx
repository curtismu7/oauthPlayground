/**
 * @file FlowTypeSelector.tsx
 * @module v8u/components
 * @description Flow type selector dropdown that adapts to spec version
 * @version 8.0.0
 * @since 2024-11-16
 */

import React from 'react';
import {
	type FlowType,
	type SpecVersion,
	SpecVersionServiceV8,
} from '@/v8/services/specVersionServiceV8';

const MODULE_TAG = '[🔄 FLOW-TYPE-SELECTOR-V8U]';

export interface FlowTypeSelectorProps {
	specVersion: SpecVersion;
	flowType: FlowType;
	onChange: (flowType: FlowType) => void;
}

const FLOW_LABELS: Record<FlowType, string> = {
	'oauth-authz': 'Authorization Code',
	implicit: 'Implicit',
	'client-credentials': 'Client Credentials',
	ropc: 'Resource Owner Password Credentials',
	'device-code': 'Device Authorization',
	hybrid: 'Hybrid',
};

export const FlowTypeSelector: React.FC<FlowTypeSelectorProps> = ({
	specVersion,
	flowType,
	onChange,
}) => {
	const availableFlows = SpecVersionServiceV8.getAvailableFlows(specVersion);

	const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const newFlowType = event.target.value as FlowType;
		console.log(`${MODULE_TAG} Flow type changed`, {
			specVersion,
			from: flowType,
			to: newFlowType,
		});
		onChange(newFlowType);
	};

	// If current flow type is not available, select first available
	const effectiveFlowType = availableFlows.includes(flowType)
		? flowType
		: availableFlows[0] || 'oauth-authz';

	if (effectiveFlowType !== flowType) {
		onChange(effectiveFlowType);
	}

	return (
		<div
			style={{
				marginBottom: '16px',
			}}
		>
			<label
				htmlFor="flowTypeSelect"
				style={{
					display: 'block',
					fontSize: '13px',
					fontWeight: '600',
					color: '#374151',
					marginBottom: '6px',
				}}
			>
				Flow Type
			</label>
			<select
				id="flowTypeSelect"
				value={effectiveFlowType}
				onChange={handleChange}
				style={{
					padding: '8px 10px',
					borderRadius: '4px',
					border: '1px solid #d1d5db',
					fontSize: '14px',
					color: '#374151',
					background: '#ffffff',
					cursor: 'pointer',
					minWidth: '250px',
				}}
			>
				{availableFlows.map((flow) => (
					<option key={flow} value={flow}>
						{FLOW_LABELS[flow]}
					</option>
				))}
			</select>
			{availableFlows.length === 0 && (
				<div
					style={{
						marginTop: '6px',
						fontSize: '12px',
						color: '#dc2626',
					}}
				>
					⚠️ No flows available for this spec version
				</div>
			)}
		</div>
	);
};
