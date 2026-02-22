// Example integration into Configuration page
// Add this import to src/pages/Configuration.tsx

import { WorkerTokenConfiguration } from '../components/WorkerTokenConfiguration';

// Then replace the existing Worker Token section with:

{
	/* Worker Token Configuration Section */
}
<WorkerTokenConfiguration
	onTokenObtained={(token) => {
		console.log('Worker token obtained:', token);
		// Trigger any additional actions when token is obtained
	}}
	onTokenCleared={() => {
		console.log('Worker token cleared');
		// Trigger any cleanup actions when token is cleared
	}}
/>;
