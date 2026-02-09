// New 6-Step Device Authentication Flow
import React from 'react';
import UnifiedMFARegistrationFlowV8 from '../../../v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy';

const UnifiedMFAV8_Simple: React.FC = () => {
	return (
		<div style={{ padding: '0', margin: '0', minHeight: '100vh' }}>
			<UnifiedMFARegistrationFlowV8 />
		</div>
	);
};

export default UnifiedMFAV8_Simple;
