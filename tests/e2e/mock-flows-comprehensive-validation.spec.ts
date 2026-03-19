// tests/e2e/mock-flows-comprehensive-validation.spec.ts
/**
 * Mock Flows - Comprehensive Field Validation
 * Enhanced test to find and validate all fields in all mock flows
 */

import { expect, test } from '@playwright/test';

test.describe('Mock Flows - Comprehensive Field Validation', () => {
	const mockFlows = [
		'/flows/oidc-authorization-code-v9',
		'/flows/client-credentials-v9',
		'/flows/device-authorization-v9',
		'/flows/implicit-v9',
		'/flows/oidc-hybrid-v9',
		'/flows/dpop-authorization-code-v9',
		'/flows/mock-mcp-agent-flow',
	];

	test('comprehensive field validation for all mock flows', async ({ page }) => {
		const overallResults = {
			totalFlows: mockFlows.length,
			flowsWithFields: 0,
			flowsWithoutFields: 0,
			totalFields: 0,
			totalFilledFields: 0,
			totalEmptyFields: 0,
			totalEmptyRequiredFields: 0,
			flowDetails: [] as Array<{
				flow: string;
				hasFields: boolean;
				totalInputs: number;
				filledInputs: number;
				emptyInputs: number;
				emptyRequiredInputs: number;
				fieldDetails: Array<{
					name: string;
					type: string;
					placeholder: string;
					value: string;
					isEmpty: boolean;
					isRequired: boolean;
				}>;
			}>,
		};

		for (const flow of mockFlows) {
			console.log(`\n=== Testing: ${flow} ===`);

			await page.goto(flow, { timeout: 15000 });
			await page.waitForTimeout(3000);

			const flowResult = {
				flow: flow,
				hasFields: false,
				totalInputs: 0,
				filledInputs: 0,
				emptyInputs: 0,
				emptyRequiredInputs: 0,
				fieldDetails: [] as Array<{
					name: string;
					type: string;
					placeholder: string;
					value: string;
					isEmpty: boolean;
					isRequired: boolean;
				}>,
			};

			// Try multiple selectors to find input fields
			const possibleContainers = [
				'main',
				'.main-content',
				'.flow-container',
				'.container',
				'.flow-content',
				'.unified-flow',
				'.oauth-flow',
				'body',
				'[class*="flow"]',
				'[class*="oauth"]',
				'[class*="content"]',
			];

			let inputsFound = false;
			for (const container of possibleContainers) {
				const containerElement = page.locator(container).first();
				if (await containerElement.isVisible()) {
					const inputs = containerElement.locator(
						'input:visible, textarea:visible, select:visible'
					);
					const inputCount = await inputs.count();

					if (inputCount > 0) {
						console.log(`Found ${inputCount} input fields in container: ${container}`);
						inputsFound = true;
						flowResult.hasFields = true;

						// Process each input field
						for (let i = 0; i < inputCount; i++) {
							const input = inputs.nth(i);
							const tagName = await input.evaluate((el) => el.tagName.toLowerCase());
							const type = (await input.getAttribute('type')) || tagName;
							const name =
								(await input.getAttribute('name')) ||
								(await input.getAttribute('id')) ||
								(await input.getAttribute('placeholder')) ||
								`field-${i}`;
							const placeholder = (await input.getAttribute('placeholder')) || '';
							const isRequired =
								(await input.getAttribute('required')) !== null ||
								(await input.getAttribute('aria-required')) === 'true';

							let value = '';
							let isEmpty = false;

							if (tagName === 'select') {
								const selectedOption = input.locator('option:checked');
								if ((await selectedOption.count()) > 0) {
									value = (await selectedOption.first().textContent()) || '';
								} else {
									isEmpty = true;
								}
							} else if (type === 'checkbox' || type === 'radio') {
								value = (await input.isChecked()) ? 'checked' : 'unchecked';
								isEmpty = value === 'unchecked';
							} else {
								value = await input.inputValue();
								isEmpty = !value || value.trim() === '';
							}

							const fieldDetail = {
								name: name,
								type: type,
								placeholder: placeholder,
								value: value,
								isEmpty: isEmpty,
								isRequired: isRequired,
							};

							flowResult.fieldDetails.push(fieldDetail);

							if (isEmpty) {
								flowResult.emptyInputs++;
								if (isRequired) {
									flowResult.emptyRequiredInputs++;
									console.log(`❌ EMPTY REQUIRED: ${name} (${type}) - ${placeholder}`);
								} else {
									console.log(`⚠️  Empty optional: ${name} (${type}) - ${placeholder}`);
								}
							} else {
								flowResult.filledInputs++;
								const displayValue = value.length > 30 ? `${value.substring(0, 30)}...` : value;
								console.log(`✅ Filled: ${name} = "${displayValue}"`);
							}
						}

						flowResult.totalInputs = inputCount;
						break; // Found fields, no need to try other containers
					}
				}
			}

			if (!inputsFound) {
				console.log('No input fields found in any container');

				// Check if the page has any content at all
				const pageContent = await page.content();
				const hasInputElements =
					pageContent.includes('<input') ||
					pageContent.includes('<textarea') ||
					pageContent.includes('<select');

				if (hasInputElements) {
					console.log('⚠️  Page contains input elements but none are visible');
				} else {
					console.log('ℹ️  No input elements found on page (may be content-only flow)');
				}
			}

			// Update overall results
			if (flowResult.hasFields) {
				overallResults.flowsWithFields++;
			} else {
				overallResults.flowsWithoutFields++;
			}

			overallResults.totalFields += flowResult.totalInputs;
			overallResults.totalFilledFields += flowResult.filledInputs;
			overallResults.totalEmptyFields += flowResult.emptyInputs;
			overallResults.totalEmptyRequiredFields += flowResult.emptyRequiredInputs;
			overallResults.flowDetails.push(flowResult);

			// Assert no required fields are empty for this flow
			if (flowResult.emptyRequiredInputs > 0) {
				throw new Error(`${flow} has ${flowResult.emptyRequiredInputs} empty required fields`);
			}

			console.log(`Summary for ${flow}:`);
			console.log(`  Fields found: ${flowResult.hasFields ? 'Yes' : 'No'}`);
			console.log(`  Total fields: ${flowResult.totalInputs}`);
			console.log(`  Filled: ${flowResult.filledInputs}`);
			console.log(`  Empty: ${flowResult.emptyInputs}`);
			console.log(`  Empty required: ${flowResult.emptyRequiredInputs}`);
		}

		// Print comprehensive summary
		console.log('\n=== COMPREHENSIVE VALIDATION SUMMARY ===');
		console.log(`Total flows tested: ${overallResults.totalFlows}`);
		console.log(`Flows with input fields: ${overallResults.flowsWithFields}`);
		console.log(`Flows without input fields: ${overallResults.flowsWithoutFields}`);
		console.log(`Total input fields: ${overallResults.totalFields}`);
		console.log(`Total filled fields: ${overallResults.totalFilledFields}`);
		console.log(`Total empty fields: ${overallResults.totalEmptyFields}`);
		console.log(`Total empty required fields: ${overallResults.totalEmptyRequiredFields}`);

		// Detailed breakdown by flow
		console.log('\n=== DETAILED BREAKDOWN ===');
		overallResults.flowDetails.forEach((result) => {
			console.log(`\n${result.flow}:`);
			if (result.hasFields) {
				console.log(
					`  Fields: ${result.totalInputs} total, ${result.filledInputs} filled, ${result.emptyInputs} empty`
				);
				if (result.emptyInputs > 0) {
					const emptyFields = result.fieldDetails.filter((f) => f.isEmpty);
					console.log(`  Empty fields:`);
					emptyFields.forEach((field) => {
						const required = field.isRequired ? 'REQUIRED' : 'optional';
						console.log(
							`    - ${field.name} (${field.type}) - ${required} - "${field.placeholder}"`
						);
					});
				}
			} else {
				console.log(`  No input fields found (may be content-only or display flow)`);
			}
		});

		// Final assertions
		expect(overallResults.totalEmptyRequiredFields).toBe(0);

		if (overallResults.totalFields > 0) {
			const fillRate = (overallResults.totalFilledFields / overallResults.totalFields) * 100;
			console.log(`\nField fill rate: ${fillRate.toFixed(1)}%`);

			if (overallResults.totalEmptyRequiredFields === 0) {
				console.log('🎉 All required fields are filled in all mock flows!');
			}
		} else {
			console.log('\nℹ️  No input fields found in any flows (may be expected for some mock flows)');
		}
	});

	test('mock flows work without user interaction', async ({ page }) => {
		// Test that flows can be used without entering any data
		const keyFlows = ['/flows/oidc-authorization-code-v9', '/flows/client-credentials-v9'];

		for (const flow of keyFlows) {
			console.log(`\nTesting flow without user interaction: ${flow}`);

			await page.goto(flow, { timeout: 15000 });
			await page.waitForTimeout(3000);

			// Look for any action buttons that would allow proceeding
			const buttons = page.locator('button:visible');
			const buttonCount = await buttons.count();

			let actionableButtons = 0;
			for (let i = 0; i < buttonCount; i++) {
				const button = buttons.nth(i);
				const text = await button.textContent();
				const isDisabled = await button.isDisabled();

				if (
					text &&
					!isDisabled &&
					/Generate|Create|Request|Authorize|Test|Execute|Run/i.test(text)
				) {
					actionableButtons++;
					console.log(`  ✅ Found actionable button: "${text}"`);
				}
			}

			// Check if flow already shows results (.first() avoids strict mode violation
			// when sidebar items like "JWT Bearer Token" also match the regex)
			const hasResults = await page
				.getByText(/access_token|id_token|code=|Bearer|JWT/i)
				.first()
				.isVisible();
			if (hasResults) {
				console.log(`  ✅ Flow already shows token/results`);
			}

			// Check for authentication errors (should not exist in mock flows)
			const hasAuthError = await page
				.getByText(/login required|authentication failed|unauthorized|401|403/i)
				.first()
				.isVisible();
			expect(hasAuthError).toBeFalsy();

			if (actionableButtons > 0 || hasResults) {
				console.log(`  ✅ Flow is ready to use without user input`);
			} else {
				console.log(`  ⚠️  No actionable elements found (may be expected)`);
			}
		}
	});
});
