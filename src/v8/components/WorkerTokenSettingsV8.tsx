/**
 * @file WorkerTokenSettingsV8.tsx
 * @module v8/components
 * @description Worker Token Settings Component - checkboxes for silent API retrieval and show token at end
 * @version 8.0.0
 * @since 2025-01-25
 */

import React from 'react';
import styled from 'styled-components';
import { WorkerTokenStatusServiceV8 } from '../services/workerTokenStatusServiceV8';

const SettingsContainer = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 1rem;
	margin-bottom: 1rem;
`;

const SettingsTitle = styled.h4`
	margin: 0 0 0.75rem 0;
	color: #1e293b;
	font-size: 0.875rem;
	font-weight: 600;
`;

const CheckboxContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`;

const CheckboxLabel = styled.label`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	cursor: pointer;
	font-size: 0.875rem;
	color: #475569;
	line-height: 1.4;

	&:hover {
		color: #1e293b;
	}
`;

const CheckboxInput = styled.input`
	margin-top: 0.125rem;
	flex-shrink: 0;
`;

const CheckboxText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;

const CheckboxDescription = styled.span`
	font-size: 0.75rem;
	color: #64748b;
	line-height: 1.3;
`;

interface WorkerTokenSettingsProps {
	settings: {
		silentApiRetrieval: boolean;
		showTokenAtEnd: boolean;
	};
	onSettingsChange: (settings: { silentApiRetrieval: boolean; showTokenAtEnd: boolean }) => void;
}

export const WorkerTokenSettingsV8: React.FC<WorkerTokenSettingsProps> = ({
	settings,
	onSettingsChange,
}) => {
	const handleSilentApiRetrievalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onSettingsChange({
			...settings,
			silentApiRetrieval: e.target.checked,
		});
	};

	const handleShowTokenAtEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onSettingsChange({
			...settings,
			showTokenAtEnd: e.target.checked,
		});
	};

	return (
		<SettingsContainer>
			<SettingsTitle>Worker Token Settings</SettingsTitle>
			<CheckboxContainer>
				<CheckboxLabel>
					<CheckboxInput
						type="checkbox"
						checked={settings.silentApiRetrieval}
						onChange={handleSilentApiRetrievalChange}
					/>
					<CheckboxText>
						<strong>Silent API Retrieval</strong>
						<CheckboxDescription>
							Automatically fetch worker token via API without showing modals or prompts
						</CheckboxDescription>
					</CheckboxText>
				</CheckboxLabel>

				<CheckboxLabel>
					<CheckboxInput
						type="checkbox"
						checked={settings.showTokenAtEnd}
						onChange={handleShowTokenAtEndChange}
					/>
					<CheckboxText>
						<strong>Show Token at End</strong>
						<CheckboxDescription>
							Display the worker token after successful generation for easy copying
						</CheckboxDescription>
					</CheckboxText>
				</CheckboxLabel>
			</CheckboxContainer>
		</SettingsContainer>
	);
};

export default WorkerTokenSettingsV8;
