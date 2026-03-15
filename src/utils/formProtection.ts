/**
 * Utilities to prevent browser extension interference with forms
 */

export interface FormProtectionOptions {
	/** Disable autofill completely */
	disableAutofill?: boolean;
	/** Add random names to confuse extensions */
	randomizeNames?: boolean;
	/** Add autocomplete="off" */
	disableAutocomplete?: boolean;
}

/**
 * Adds attributes to form elements to prevent browser extension interference
 */
export const protectFormFromExtensions = (
	formElement: HTMLFormElement,
	options: FormProtectionOptions = {}
): void => {
	const { disableAutofill = true, randomizeNames = false, disableAutocomplete = true } = options;

	// Protect the form itself
	if (disableAutofill) {
		formElement.setAttribute('autocomplete', 'off');
		formElement.setAttribute('autofill', 'off');
	}

	// Protect all input elements
	const inputs = formElement.querySelectorAll('input, select, textarea');
	inputs.forEach((input) => {
		const element = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

		// Disable autocomplete
		if (disableAutocomplete) {
			element.setAttribute('autocomplete', 'off');
		}

		// Disable autofill
		if (disableAutofill) {
			element.setAttribute('autofill', 'off');
		}

		// Randomize names to confuse extensions
		if (randomizeNames && element.name) {
			const originalName = element.name;
			const randomSuffix = Math.random().toString(36).substring(2, 8);
			element.setAttribute('data-original-name', originalName);
			element.name = `${originalName}_${randomSuffix}`;
		}

		// Add data attributes to mark as protected
		element.setAttribute('data-extension-protected', 'true');
	});
};

/**
 * Creates a protected input element with extension-safe attributes
 */
export const createProtectedInput = (
	type: string,
	placeholder?: string,
	options: FormProtectionOptions = {}
): HTMLInputElement => {
	const input = document.createElement('input');
	input.type = type;

	if (placeholder) {
		input.placeholder = placeholder;
	}

	// Apply protection attributes
	if (options.disableAutofill !== false) {
		input.setAttribute('autocomplete', 'off');
		input.setAttribute('autofill', 'off');
	}

	if (options.randomizeNames) {
		const randomSuffix = Math.random().toString(36).substring(2, 8);
		input.name = `input_${randomSuffix}`;
	}

	input.setAttribute('data-extension-protected', 'true');

	return input;
};

/**
 * React component wrapper for protected inputs
 */
export const ProtectedInputProps = {
	// Standard input props
	disabled: false,
	readOnly: false,
	required: false,

	// Extension protection props
	autoComplete: 'off' as const,
	autoFill: 'off' as const,

	// Data attributes for extension protection
	'data-extension-protected': 'true',
};

/**
 * CSS class to hide elements from browser extensions
 */
export const HIDE_FROM_EXTENSIONS = 'hide-from-extensions';

/**
 * CSS to hide elements from browser extensions
 */
export const extensionProtectionCSS = `
	/* Hide from browser extensions */
	.hide-from-extensions {
		visibility: hidden;
		position: absolute;
		left: -9999px;
		top: -9999px;
		height: 1px;
		width: 1px;
		overflow: hidden;
	}
	
	/* Prevent extension overlays */
	[data-extension-protected] {
		position: relative;
	}
	
	/* Some extensions look for these classes - make them ineffective */
	.password-field,
	.username-field,
	.email-field,
	.login-form {
		/* Reset any extension-specific styling */
		all: initial;
	}
`;
