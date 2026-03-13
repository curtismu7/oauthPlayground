import React, { useEffect, useState } from 'react';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { WorkerTokenVsClientCredentialsEducationModalV8 } from '@/v8/components/WorkerTokenVsClientCredentialsEducationModalV8';
import { checkWorkerTokenStatus } from '@/v8/services/workerTokenStatusServiceV8';

export const DemoWorkerTokenUI: React.FC = () => {
	const [showTokenModal, setShowTokenModal] = useState(false);
	const [showEducationModal, setShowEducationModal] = useState(false);
	const [tokenStatus, setTokenStatus] = useState<any>(null);

	useEffect(() => {
		checkWorkerTokenStatus().then(setTokenStatus);
	}, [showTokenModal]);

	return (
		<div style={{ padding: 24 }}>
			<h4
				style={{
					marginBottom: 12,
					background: '#d32f2f',
					color: '#fff',
					padding: '8px 16px',
					borderRadius: 4,
				}}
			>
				Worker Token UI Demo
			</h4>
			<div style={{ marginBottom: 12 }}>
				<button onClick={() => setShowTokenModal(true)} style={{ marginRight: 8 }}>
					Show Worker Token Modal
				</button>
				<button onClick={() => setShowEducationModal(true)}>Show Education Modal</button>
			</div>
			<div style={{ marginBottom: 12 }}>
				<strong>Worker Token Status:</strong>
				<pre style={{ background: '#f6f8fa', padding: 8, borderRadius: 4, fontSize: 13 }}>
					{tokenStatus ? JSON.stringify(tokenStatus, null, 2) : 'Loading...'}
				</pre>
			</div>
			<WorkerTokenModalV8 isOpen={showTokenModal} onClose={() => setShowTokenModal(false)} />
			<WorkerTokenVsClientCredentialsEducationModalV8
				isOpen={showEducationModal}
				onClose={() => setShowEducationModal(false)}
			/>
		</div>
	);
};
