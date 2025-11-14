#!/usr/bin/env node

import fs from 'node:fs';

// Fix DeviceCodeFlow.tsx
const deviceCodeContent = fs.readFileSync('src/pages/flows/DeviceCodeFlow.tsx', 'utf8');

// Remove broken styled components (lines 159-177)
let fixedContent = deviceCodeContent.replace(
	/`;\s*\n\s*\n\s*\n\s*\n\s*\n\s*\n\s*}\s*\n\s*if \(completed\) \{\s*\n\s*return `\s*\n\s*background-color: #22c55e;\s*\n\s*color: white;\s*\n\s*`;\s*\n\s*\}\s*\n\s*if \(active\) \{\s*\n\s*return `\s*\n\s*background-color: #3b82f6;\s*\n\s*color: white;\s*\n\s*`;\s*\n\s*\}\s*\n\s*return `\s*\n\s*background-color: #e5e7eb;\s*\n\s*color: #6b7280;\s*\n\s*`;\s*\n\s*\}\}\s*\n\s*`;/g,
	'`;'
);

// Remove the duplicate StepsContainer section
fixedContent = fixedContent.replace(/<StepsContainer>[\s\S]*?<\/StepsContainer>/g, '');

// Add missing state variables
fixedContent = fixedContent.replace(
	/const \[stepResults, setStepResults\] = useState<Record<number, any>>\(\{\}\);\s*const \[executedSteps, setExecutedSteps\] = useState<Set<number>>\(new Set\(\)\);\s*const \[stepsWithResults, setStepsWithResults\] = useState<FlowStep\[\]>\(\[\]\);/g,
	'const [stepResults, setStepResults] = useState<Record<number, any>>({});\n  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());\n  const [stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);'
);

// Update the startDeviceCodeFlow function to initialize stepsWithResults
fixedContent = fixedContent.replace(
	/setDemoStatus\('loading'\);\s*setCurrentStep\(0\);\s*setError\(null\);\s*setDeviceCode\(null\);\s*setTokensReceived\(null\);\s*setStepResults\(\{\}\);\s*setExecutedSteps\(new Set\(\)\);\s*setStepsWithResults\(\[\]\);\s*setStepsWithResults\(\[\.\.\.steps\]\);/g,
	`setDemoStatus('loading');
    setCurrentStep(0);
    setError(null);
    setDeviceCode(null);
    setTokensReceived(null);
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([...steps]);`
);

// Update resetDemo function
fixedContent = fixedContent.replace(
	/setDemoStatus\('idle'\);\s*setCurrentStep\(0\);\s*setDeviceCode\(null\);\s*setTokensReceived\(null\);\s*setError\(null\);\s*setStepResults\(\{\}\);\s*setExecutedSteps\(new Set\(\)\);/g,
	`setDemoStatus('idle');
    setCurrentStep(0);
    setDeviceCode(null);
    setTokensReceived(null);
    setError(null);
    setStepResults({});
    setExecutedSteps(new Set());
    setStepsWithResults([]);`
);

// Update execute functions to return results
fixedContent = fixedContent.replace(
	/setStepResults\(prev => \(\{ \.\.\.prev, 0: \{ deviceCode: deviceCodeData \} \}\)\);\s*setExecutedSteps\(prev => new Set\(prev\)\.add\(0\)\);/g,
	`const result = { deviceCode: deviceCodeData };
        setStepResults(prev => ({ ...prev, 0: result }));
        setExecutedSteps(prev => new Set(prev).add(0));
        return result;`
);

fixedContent = fixedContent.replace(
	/setStepResults\(prev => \(\{ \.\.\.prev, 1: \{ message: 'User authentication completed' \} \}\)\);\s*setExecutedSteps\(prev => new Set\(prev\)\.add\(1\)\);/g,
	`const result = { message: 'User authentication completed' };
        setStepResults(prev => ({ ...prev, 1: result }));
        setExecutedSteps(prev => new Set(prev).add(1));
        return result;`
);

fixedContent = fixedContent.replace(
	/setStepResults\(prev => \(\{ \.\.\.prev, 2: \{ response: tokenData, status: response\.status \} \}\)\);\s*setExecutedSteps\(prev => new Set\(prev\)\.add\(2\)\);/g,
	`const result = { response: tokenData, status: response.status };
          setStepResults(prev => ({ ...prev, 2: result }));
          setExecutedSteps(prev => new Set(prev).add(2));
          return result;`
);

fixedContent = fixedContent.replace(
	/setStepResults\(prev => \(\{ \.\.\.prev, 3: \{ tokens: tokensReceived \} \}\)\);\s*setExecutedSteps\(prev => new Set\(prev\)\.add\(3\)\);\s*setDemoStatus\('success'\);/g,
	`const result = { tokens: tokensReceived };
        setStepResults(prev => ({ ...prev, 3: result }));
        setExecutedSteps(prev => new Set(prev).add(3));
        setDemoStatus('success');
        return result;`
);

fs.writeFileSync('src/pages/flows/DeviceCodeFlow.tsx', fixedContent, 'utf8');
console.log('✅ Fixed DeviceCodeFlow.tsx');
