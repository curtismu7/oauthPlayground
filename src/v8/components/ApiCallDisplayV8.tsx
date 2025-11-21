import React, { useEffect, useState } from 'react';
import { EnhancedApiCallDisplay } from '@/components/EnhancedApiCallDisplay';
import { ApiCall, apiCallTrackerService } from '@/services/apiCallTrackerService';
import { EnhancedApiCallData } from '@/services/enhancedApiCallDisplayService';

const mapApiCallToEnhancedData = (call: ApiCall): EnhancedApiCallData => {
	return {
		method: call.method as EnhancedApiCallData['method'],
		url: call.url,
		headers: call.headers || {},
		body: call.body || null,
		queryParams: call.queryParams || {},
		response: call.response,
		timestamp: call.timestamp,
		duration: call.duration,
		stepName: call.step,
		description: `API Call: ${call.method} ${call.url}`,
	};
};

export const ApiCallDisplayV8: React.FC = () => {
	const [calls, setCalls] = useState<ApiCall[]>([]);

	useEffect(() => {
		const unsubscribe = apiCallTrackerService.subscribe((updatedCalls) => {
			setCalls(updatedCalls);
		});
		// Initial load
		setCalls(apiCallTrackerService.getApiCalls());
		return unsubscribe;
	}, []);

	if (calls.length === 0) {
		return null;
	}

	return (
		<div style={{ marginTop: '2rem' }}>
			<h3>API Activity</h3>
			{calls.map((call) => (
				<EnhancedApiCallDisplay
					key={call.id}
					apiCall={mapApiCallToEnhancedData(call)}
					options={{
						showEducationalNotes: true,
						showFlowContext: true,
					}}
					initiallyCollapsed={true}
				/>
			))}
		</div>
	);
};

