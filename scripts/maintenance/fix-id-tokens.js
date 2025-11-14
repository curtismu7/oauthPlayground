#!/usr/bin/env node

import fs from 'node:fs';

// Fix IDTokensFlow.tsx
const idTokensContent = fs.readFileSync('src/pages/flows/IDTokensFlow.tsx', 'utf8');

// Remove broken styled components (lines 158-176)
let fixedContent = idTokensContent.replace(
	/`;\s*\n\s*\n\s*\n\s*\n\s*\n\s*\n\s*}\s*\n\s*if \(\$completed\) \{\s*\n\s*return `\s*\n\s*background-color: #22c55e;\s*\n\s*color: white;\s*\n\s*`;\s*\n\s*\}\s*\n\s*if \(\$active\) \{\s*\n\s*return `\s*\n\s*background-color: #3b82f6;\s*\n\s*color: white;\s*\n\s*`;\s*\n\s*\}\s*\n\s*return `\s*\n\s*background-color: #e5e7eb;\s*\n\s*color: #6b7280;\s*\n\s*`;\s*\n\s*\}\}\s*\n\s*`;/g,
	'`;'
);

// Remove the duplicate StepsContainer section
fixedContent = fixedContent.replace(/<StepsContainer>[\s\S]*?<\/StepsContainer>/g, '');

// Add missing state variables and fix the component
fixedContent = fixedContent.replace(
	/const \[executedSteps\] = useState<Set<number>>\(new Set\(\)\);/g,
	'const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());\n  const [stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);'
);

// Update the simulateIDTokenFlow function to initialize stepsWithResults
fixedContent = fixedContent.replace(
	/setDemoStatus\('loading'\);\s*setCurrentStep\(0\);\s*setError\(null\);\s*setDecodedToken\(null\);\s*setValidationResults\(null\);/g,
	`setDemoStatus('loading');
    setCurrentStep(0);
    setError(null);
    setDecodedToken(null);
    setValidationResults(null);
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([...steps]);`
);

// Update resetDemo function
fixedContent = fixedContent.replace(
	/setDemoStatus\('idle'\);\s*setCurrentStep\(0\);\s*setIdToken\(''\);\s*setDecodedToken\(null\);\s*setValidationResults\(null\);\s*setError\(null\);/g,
	`setDemoStatus('idle');
    setCurrentStep(0);
    setIdToken('');
    setDecodedToken(null);
    setValidationResults(null);
    setError(null);
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([]);`
);

// Add StepByStepFlow component usage
fixedContent = fixedContent.replace(
	/<DemoControls>[\s\S]*?<\/DemoControls>/g,
	`<StepByStepFlow
            steps={stepsWithResults.length > 0 ? stepsWithResults : steps}
            onStart={simulateIDTokenFlow}
            onReset={resetDemo}
            status={demoStatus}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onStepResult={handleStepResult}
            disabled={!config || !idToken}
            title="ID Token Flow"
          />`
);

fs.writeFileSync('src/pages/flows/IDTokensFlow.tsx', fixedContent, 'utf8');
console.log('✅ Fixed IDTokensFlow.tsx');
