/**
 * @file PollingStep.tsx
 * @description Polling Step for token polling functionality
 * @author OAuth Playground Team
 * @version 1.0.0
 * @since 2026-01-25
 */

import React, { useState, useEffect } from 'react';
import { BaseUnifiedStep } from './BaseUnifiedStep';
import { logger } from '../../../utils/logger';

export const PollingStep: React.FC<{ 
	isCompleted?: boolean; 
	isActive?: boolean;
	onComplete?: () => void;
}> = ({
	isCompleted = false,
	isActive = false,
	onComplete,
}) => {
	const [isPolling, setIsPolling] = useState(false);
	const [pollCount, setPollCount] = useState(0);
	const [lastResult, setLastResult] = useState<string>('');

	const startPolling = () => {
		setIsPolling(true);
		setPollCount(0);
		logger.info('PollingStep', 'Starting token polling');
		
		// Simulate polling process
		const pollInterval = setInterval(() => {
			setPollCount(prev => {
				const newCount = prev + 1;
				
				// Simulate finding a token after 5 polls
				if (newCount >= 5) {
					clearInterval(pollInterval);
					setIsPolling(false);
					setLastResult('Token found successfully!');
					logger.success('PollingStep', 'Token polling completed successfully');
					onComplete?.();
				} else {
					logger.info('PollingStep', `Poll attempt ${newCount}/5`);
				}
				
				return newCount;
			});
		}, 1000);
	};

	const stopPolling = () => {
		setIsPolling(false);
		setLastResult('Polling stopped by user');
		logger.info('PollingStep', 'Token polling stopped by user');
	};

	useEffect(() => {
		if (isActive && !isCompleted && !isPolling) {
			// Auto-start when step becomes active
			startPolling();
		}
	}, [isActive, isCompleted, isPolling]);

	return (
		<BaseUnifiedStep
			title="Token Polling"
			description="Poll for token authorization"
			stepNumber={1}
			isCompleted={isCompleted}
			isActive={isActive}
		>
			<div>
				<h4>Token Polling</h4>
				<p>This step continuously polls the token endpoint to check for authorization completion.</p>
				
				<div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', marginBottom: '1rem' }}>
					<div style={{ marginBottom: '1rem' }}>
						<strong>Status:</strong> {isPolling ? 'Polling...' : isCompleted ? 'Completed' : 'Ready'}
					</div>
					
					{isPolling && (
						<div>
							<div style={{ marginBottom: '0.5rem' }}>
								<strong>Poll Attempts:</strong> {pollCount}/5
							</div>
							<div style={{ 
								width: '100%', 
								height: '8px', 
								background: '#e2e8f0', 
								borderRadius: '4px',
								overflow: 'hidden'
							}}>
								<div style={{
									width: `${(pollCount / 5) * 100}%`,
									height: '100%',
									background: '#3b82f6',
									transition: 'width 0.3s ease'
								}} />
							</div>
						</div>
					)}
					
					{lastResult && (
						<div style={{ 
							marginTop: '0.5rem',
							padding: '0.5rem',
							background: isCompleted ? '#10b98120' : '#ef444420',
							borderRadius: '4px',
							color: isCompleted ? '#059669' : '#dc2626'
						}}>
							{lastResult}
						</div>
					)}
				</div>

				<div style={{ display: 'flex', gap: '0.5rem' }}>
					{!isPolling && !isCompleted && (
						<button
							onClick={startPolling}
							style={{
								padding: '0.5rem 1rem',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer'
							}}
						>
							Start Polling
						</button>
					)}
					
					{isPolling && (
						<button
							onClick={stopPolling}
							style={{
								padding: '0.5rem 1rem',
								background: '#ef4444',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer'
							}}
						>
							Stop Polling
						</button>
					)}
				</div>
			</div>
		</BaseUnifiedStep>
	);
};
