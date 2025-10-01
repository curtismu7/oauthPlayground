// src/pages/flows/WorkerTokenFlowV5.tsx
import React from 'react';
import { WorkerTokenFlowV5 } from '../../components/WorkerTokenFlowV5';

const PingOneWorkerTokenFlowV5: React.FC = () => {
	return (
		<WorkerTokenFlowV5
			flowName="PingOne Worker Token Flow"
			flowVersion="V5"
			completionMessage="Nice work! You successfully completed the PingOne Worker Token Flow using reusable V5 components."
			nextSteps={[
				'Inspect or decode tokens using the Token Management tools.',
				'Repeat the flow with different scopes or client credentials.',
				'Explore token introspection and revocation flows.',
			]}
		/>
	);
};

export default PingOneWorkerTokenFlowV5;

