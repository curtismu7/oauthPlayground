// src/pages/flows/WorkerTokenFlowV6.tsx
// V6 PingOne Worker Token Flow now reuses the fully featured V5 component

import React from 'react';
import { WorkerTokenFlowV5 } from '../../components/WorkerTokenFlowV5';
import { usePageScroll } from '../../hooks/usePageScroll';

const WorkerTokenFlowV6: React.FC = () => {
	usePageScroll({ pageName: 'WorkerTokenFlowV6', force: true });

	return (
		<WorkerTokenFlowV5
			flowName="PingOne Worker Token Flow"
			flowVersion="V6"
			completionMessage="Great job! You completed the PingOne Worker Token flow using the updated V6 experience."
			nextSteps={[
				'Run token introspection to confirm the worker token permissions.',
				'Explore the security demonstrations to see how to protect worker tokens.',
				'Head to Token Management to reuse or revoke the issued worker token.',
			]}
		/>
	);
};

export default WorkerTokenFlowV6;
