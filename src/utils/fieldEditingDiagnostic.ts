// src/utils/fieldEditingDiagnostic.ts
// Comprehensive diagnostic tool for field editing issues

interface FieldEditingIssue {
	type: 'disabled' | 'readonly' | 'css' | 'event-handler' | 'state-management' | 'unknown';
	description: string;
	element: HTMLElement;
	fix: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
}

interface FieldEditingReport {
	totalFields: number;
	editableFields: number;
	nonEditableFields: number;
	issues: FieldEditingIssue[];
	recommendations: string[];
}

class FieldEditingDiagnostic {
	private static instance: FieldEditingDiagnostic;

	static getInstance(): FieldEditingDiagnostic {
		if (!FieldEditingDiagnostic.instance) {
			FieldEditingDiagnostic.instance = new FieldEditingDiagnostic();
		}
		return FieldEditingDiagnostic.instance;
	}

	/**
	 * Diagnose all input fields in the current page
	 */
	diagnoseAllFields(): FieldEditingReport {
		console.group('🔍 [FIELD EDITING DIAGNOSTIC] Starting comprehensive field analysis...');

		const allInputs = this.getAllInputElements();
		const issues: FieldEditingIssue[] = [];
		let editableFields = 0;
		let nonEditableFields = 0;

		allInputs.forEach((input, index) => {
			console.log(`\n📝 Analyzing field ${index + 1}:`, {
				tagName: input.tagName,
				type: input.type,
				id: input.id,
				name: input.name,
				className: input.className,
				placeholder: input.placeholder,
			});

			const fieldIssues = this.analyzeField(input);
			if (fieldIssues.length > 0) {
				issues.push(...fieldIssues);
				nonEditableFields++;
				console.warn(`❌ Field ${index + 1} has ${fieldIssues.length} issue(s):`, fieldIssues);
			} else {
				editableFields++;
				console.log(`✅ Field ${index + 1} is fully editable`);
			}
		});

		const report: FieldEditingReport = {
			totalFields: allInputs.length,
			editableFields,
			nonEditableFields,
			issues,
			recommendations: this.generateRecommendations(issues),
		};

		console.groupEnd();
		return report;
	}

	/**
	 * Get all input elements on the page
	 */
	private getAllInputElements(): HTMLElement[] {
		const selectors = [
			'input[type="text"]',
			'input[type="email"]',
			'input[type="password"]',
			'input[type="url"]',
			'input[type="tel"]',
			'input[type="search"]',
			'textarea',
			'select',
		];

		const elements: HTMLElement[] = [];
		selectors.forEach((selector) => {
			const found = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
			elements.push(...Array.from(found));
		});

		return elements;
	}

	/**
	 * Analyze a single field for editing issues
	 */
	private analyzeField(element: HTMLElement): FieldEditingIssue[] {
		const issues: FieldEditingIssue[] = [];

		// Check disabled state
		if (element.hasAttribute('disabled') || (element as any).disabled) {
			issues.push({
				type: 'disabled',
				description: 'Field is disabled',
				element,
				fix: 'Remove disabled attribute or set disabled=false',
				severity: 'high',
			});
		}

		// Check readonly state
		if (element.hasAttribute('readonly') || (element as any).readOnly) {
			issues.push({
				type: 'readonly',
				description: 'Field is readonly',
				element,
				fix: 'Remove readonly attribute or set readOnly=false',
				severity: 'high',
			});
		}

		// Check CSS pointer-events
		const computedStyle = window.getComputedStyle(element);
		if (computedStyle.pointerEvents === 'none') {
			issues.push({
				type: 'css',
				description: 'CSS pointer-events is set to none',
				element,
				fix: 'Set pointer-events: auto in CSS',
				severity: 'critical',
			});
		}

		// Check if field is covered by another element
		const rect = element.getBoundingClientRect();
		const elementAtCenter = document.elementFromPoint(
			rect.left + rect.width / 2,
			rect.top + rect.height / 2
		);
		if (elementAtCenter && elementAtCenter !== element && !element.contains(elementAtCenter)) {
			issues.push({
				type: 'css',
				description: 'Field is covered by another element',
				element,
				fix: 'Adjust z-index or positioning of covering element',
				severity: 'critical',
			});
		}

		// Check event handlers
		const hasClickHandler = this.hasEventListeners(element, 'click');
		const hasChangeHandler = this.hasEventListeners(element, 'change');
		const hasInputHandler = this.hasEventListeners(element, 'input');

		if (!hasClickHandler && !hasChangeHandler && !hasInputHandler) {
			issues.push({
				type: 'event-handler',
				description: 'No event handlers detected (may indicate React state issues)',
				element,
				fix: 'Ensure React onChange handlers are properly connected',
				severity: 'medium',
			});
		}

		// Check if field is in a disabled container
		const disabledContainer = element.closest('[disabled], .disabled, [aria-disabled="true"]');
		if (disabledContainer) {
			issues.push({
				type: 'state-management',
				description: 'Field is inside a disabled container',
				element,
				fix: 'Remove disabled state from parent container',
				severity: 'high',
			});
		}

		return issues;
	}

	/**
	 * Check if element has event listeners
	 */
	private hasEventListeners(element: HTMLElement, eventType: string): boolean {
		// This is a simplified check - in reality, we can't easily detect React event handlers
		// But we can check for native event listeners
		const events = (element as any)._events || {};
		return events[eventType] && events[eventType].length > 0;
	}

	/**
	 * Generate recommendations based on issues found
	 */
	private generateRecommendations(issues: FieldEditingIssue[]): string[] {
		const recommendations: string[] = [];

		if (issues.some((issue) => issue.type === 'disabled')) {
			recommendations.push(
				'Review all disabled attributes - ensure they are only set when appropriate'
			);
		}

		if (issues.some((issue) => issue.type === 'readonly')) {
			recommendations.push(
				'Review all readonly attributes - ensure they are only set when appropriate'
			);
		}

		if (issues.some((issue) => issue.type === 'css')) {
			recommendations.push('Review CSS for pointer-events and z-index issues');
		}

		if (issues.some((issue) => issue.type === 'event-handler')) {
			recommendations.push('Ensure all React onChange handlers are properly connected');
		}

		if (issues.some((issue) => issue.type === 'state-management')) {
			recommendations.push('Review parent container disabled states');
		}

		if (issues.length === 0) {
			recommendations.push('All fields appear to be editable - issue may be intermittent');
		}

		return recommendations;
	}

	/**
	 * Fix common field editing issues
	 */
	fixCommonIssues(): void {
		console.group('🔧 [FIELD EDITING FIX] Applying common fixes...');

		const allInputs = this.getAllInputElements();
		let fixedCount = 0;

		allInputs.forEach((input, index) => {
			let fieldFixed = false;

			// Fix disabled state
			if (input.hasAttribute('disabled')) {
				input.removeAttribute('disabled');
				(input as any).disabled = false;
				console.log(`✅ Fixed disabled state for field ${index + 1}`);
				fieldFixed = true;
			}

			// Fix readonly state
			if (input.hasAttribute('readonly')) {
				input.removeAttribute('readonly');
				(input as any).readOnly = false;
				console.log(`✅ Fixed readonly state for field ${index + 1}`);
				fieldFixed = true;
			}

			// Fix CSS pointer-events
			const computedStyle = window.getComputedStyle(input);
			if (computedStyle.pointerEvents === 'none') {
				(input as any).style.pointerEvents = 'auto';
				console.log(`✅ Fixed pointer-events for field ${index + 1}`);
				fieldFixed = true;
			}

			if (fieldFixed) {
				fixedCount++;
			}
		});

		console.log(`\n🎉 Fixed ${fixedCount} fields out of ${allInputs.length} total fields`);
		console.groupEnd();
	}

	/**
	 * Monitor field editing in real-time
	 */
	startMonitoring(): void {
		console.log('👀 [FIELD EDITING MONITOR] Starting real-time monitoring...');

		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === 'attributes') {
					const target = mutation.target as HTMLElement;
					if (
						target.tagName === 'INPUT' ||
						target.tagName === 'TEXTAREA' ||
						target.tagName === 'SELECT'
					) {
						if (mutation.attributeName === 'disabled' || mutation.attributeName === 'readonly') {
							console.warn('🚨 Field editing state changed:', {
								element: target,
								attribute: mutation.attributeName,
								newValue: target.getAttribute(mutation.attributeName!),
							});
						}
					}
				}
			});
		});

		observer.observe(document.body, {
			attributes: true,
			attributeFilter: ['disabled', 'readonly'],
			subtree: true,
		});

		// Store observer for cleanup
		(window as any).fieldEditingObserver = observer;
	}

	/**
	 * Stop monitoring
	 */
	stopMonitoring(): void {
		const observer = (window as any).fieldEditingObserver;
		if (observer) {
			observer.disconnect();
			delete (window as any).fieldEditingObserver;
		}
	}
}

// Global access for debugging
if (typeof window !== 'undefined') {
	(window as any).FieldEditingDiagnostic = FieldEditingDiagnostic.getInstance();

	// Convenience functions
	(window as any).diagnoseFields = () => FieldEditingDiagnostic.getInstance().diagnoseAllFields();
	(window as any).fixFields = () => FieldEditingDiagnostic.getInstance().fixCommonIssues();
	(window as any).monitorFields = () => FieldEditingDiagnostic.getInstance().startMonitoring();
	(window as any).stopMonitorFields = () => FieldEditingDiagnostic.getInstance().stopMonitoring();

}

export default FieldEditingDiagnostic;
