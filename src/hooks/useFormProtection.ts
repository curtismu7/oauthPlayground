import { useEffect, useRef } from 'react';
import { type FormProtectionOptions, protectFormFromExtensions } from '../utils/formProtection';

/**
 * React hook to protect forms from browser extension interference
 */
export const useFormProtection = (
	options: FormProtectionOptions = {}
): React.RefObject<HTMLFormElement> => {
	const formRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		const form = formRef.current;
		if (form) {
			protectFormFromExtensions(form, options);
		}
	}, [options]);

	return formRef;
};

/**
 * React hook to protect individual inputs from browser extensions
 */
export const useInputProtection = (
	inputRef: React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
	options: FormProtectionOptions = {}
): void => {
	useEffect(() => {
		const input = inputRef.current;
		if (!input) return;

		const { disableAutofill = true, disableAutocomplete = true } = options;

		// Apply protection attributes
		if (disableAutocomplete) {
			input.setAttribute('autocomplete', 'off');
		}

		if (disableAutofill) {
			input.setAttribute('autofill', 'off');
		}

		input.setAttribute('data-extension-protected', 'true');
	}, [inputRef, options]);
};
