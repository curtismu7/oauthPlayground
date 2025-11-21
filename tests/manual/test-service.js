// Test execution script
console.log('🚀 Running Comprehensive Service Validation...');

// Import and run the validation
import('./src/utils/comprehensiveServiceValidation.js')
	.then(async (module) => {
		const { runComprehensiveValidation } = module;

		try {
			const results = await runComprehensiveValidation();

			if (results.overallSuccess) {
				console.log('\n🎉 VALIDATION SUCCESSFUL! Service is rock solid and ready for production.');
				console.log('✅ Proceeding to update V7 flows...');
			} else {
				console.log('\n❌ VALIDATION FAILED! Service needs fixes before updating flows.');
				console.log('⚠️ Please address the issues before proceeding.');
			}

			// Exit with appropriate code
			process.exit(results.overallSuccess ? 0 : 1);
		} catch (error) {
			console.error('❌ Validation execution error:', error);
			process.exit(1);
		}
	})
	.catch((error) => {
		console.error('❌ Failed to load validation module:', error);
		process.exit(1);
	});
