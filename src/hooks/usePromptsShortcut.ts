import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const usePromptsShortcut = () => {
	const navigate = useNavigate();

	useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent) => {
			// Ctrl/Cmd + Shift + P for Prompts
			if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'P') {
				event.preventDefault();
				navigate('/docs/prompts/prompt-all');
			}
		};

		document.addEventListener('keydown', handleKeyPress);
		return () => document.removeEventListener('keydown', handleKeyPress);
	}, [navigate]);
};
