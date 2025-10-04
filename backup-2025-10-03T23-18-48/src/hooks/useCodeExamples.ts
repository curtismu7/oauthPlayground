// src/hooks/useCodeExamples.ts

import { useState, useMemo, useCallback } from 'react';
import { 
	CodeExamplesService, 
	SupportedLanguage, 
	FlowStepCodeExamples,
	CodeExamplesConfig,
	CodeExample
} from '../services/codeExamplesService';

interface UseCodeExamplesProps {
	flowType: string;
	stepId: string;
	config?: Partial<CodeExamplesConfig>;
	initialLanguages?: SupportedLanguage[];
}

interface UseCodeExamplesReturn {
	stepData: FlowStepCodeExamples | null;
	selectedLanguages: SupportedLanguage[];
	setSelectedLanguages: (languages: SupportedLanguage[]) => void;
	toggleLanguage: (language: SupportedLanguage) => void;
	filteredExamples: CodeExample[];
	supportedLanguages: SupportedLanguage[];
	isLoading: boolean;
	error: string | null;
}

export const useCodeExamples = ({
	flowType,
	stepId,
	config,
	initialLanguages = ['javascript', 'typescript'],
}: UseCodeExamplesProps): UseCodeExamplesReturn => {
	const [selectedLanguages, setSelectedLanguages] = useState<SupportedLanguage[]>(initialLanguages);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const codeExamplesService = useMemo(() => {
		try {
			return new CodeExamplesService(config);
		} catch {
			setError('Failed to initialize code examples service');
			return null;
		}
	}, [config]);

	const stepData = useMemo(() => {
		if (!codeExamplesService) return null;
		
		try {
			setIsLoading(true);
			setError(null);
			const data = codeExamplesService.getExamplesForStep(flowType, stepId);
			setIsLoading(false);
			return data;
		} catch {
			setError('Failed to load code examples');
			setIsLoading(false);
			return null;
		}
	}, [codeExamplesService, flowType, stepId]);

	const filteredExamples = useMemo(() => {
		if (!stepData || !codeExamplesService) return [];
		
		try {
			return codeExamplesService.filterExamplesByLanguage(stepData.examples, selectedLanguages);
		} catch {
			setError('Failed to filter examples');
			return [];
		}
	}, [stepData, selectedLanguages, codeExamplesService]);

	const toggleLanguage = useCallback((language: SupportedLanguage) => {
		setSelectedLanguages(prev => 
			prev.includes(language)
				? prev.filter(l => l !== language)
				: [...prev, language]
		);
	}, []);

	const supportedLanguages = useMemo(() => {
		return codeExamplesService?.getSupportedLanguages() || [];
	}, [codeExamplesService]);

	return {
		stepData,
		selectedLanguages,
		setSelectedLanguages,
		toggleLanguage,
		filteredExamples,
		supportedLanguages,
		isLoading,
		error,
	};
};

export default useCodeExamples;
