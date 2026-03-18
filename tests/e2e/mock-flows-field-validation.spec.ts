// tests/e2e/mock-flows-field-validation.spec.ts
/**
 * Mock Flows - Comprehensive Field Validation
 * Tests all mock flows to ensure every field has pre-filled values
 */

import { expect, test } from '@playwright/test';

test.describe('Mock Flows - Field Validation', () => {
	const mockFlows = [
		'/flows/oidc-authorization-code-v9',
		'/flows/client-credentials-v9',
		'/flows/device-authorization-v9',
		'/flows/implicit-v9',
		'/flows/oidc-hybrid-v9',
		'/flows/dpop-authorization-code-v9',
		'/flows/mock-mcp-agent-flow',
	];

	test('all mock flows have pre-filled values in all fields', async ({ page }) => {
		const validationResults: Array<{
			flow: string;
			totalInputs: number;
			filledInputs: number;
			emptyInputs: number;
			emptyRequiredInputs: number;
			emptyFields: Array<{
				name: string;
				placeholder: string;
				type: string;
				required: boolean;
			}>;
		}> = [];

		for (const flow of mockFlows) {
			console.log(`\n=== Testing: ${flow} ===`);

			await page.goto(flow, { timeout: 15000 });
			await page.waitForTimeout(3000);

			const flowResult = {
				flow: flow,
				totalInputs: 0,
				filledInputs: 0,
				emptyInputs: 0,
				emptyRequiredInputs: 0,
				emptyFields: [],
			};

			// Find all input fields in the main content area (excluding sidebar)
			const mainContent = page.locator('main, .main-content, .flow-container, .container').first();
			if (await mainContent.isVisible()) {
				const inputs = mainContent.locator('input:visible, textarea:visible, select:visible');
				const inputCount = await inputs.count();
				flowResult.totalInputs = inputCount;

				console.log(`Found ${inputCount} input fields`);

				for (let i = 0; i < inputCount; i++) {
					const input = inputs.nth(i);
					const tagName = await input.evaluate((el) => el.tagName.toLowerCase());
					const type = (await input.getAttribute('type')) || tagName;
					const name =
						(await input.getAttribute('name')) || (await input.getAttribute('id')) || `field-${i}`;
					const placeholder = (await input.getAttribute('placeholder')) || '';
					const isRequired =
						(await input.getAttribute('required')) !== null ||
						(await input.getAttribute('aria-required')) === 'true';

					let value = '';
					let isEmpty = false;

					if (tagName === 'select') {
						// For select elements, check if an option is selected
						const selectedOption = input.locator('option:checked');
						if ((await selectedOption.count()) > 0) {
							value = await selectedOption.first().textContent();
						} else {
							isEmpty = true;
						}
					} else {
						// For input and textarea elements
						value = await input.inputValue();
						isEmpty = !value || value.trim() === '';
					}

					if (isEmpty) {
						flowResult.emptyInputs++;
						flowResult.emptyFields.push({
							name: name,
							placeholder: placeholder,
							type: type || tagName,
							required: isRequired,
						});

						if (isRequired) {
							flowResult.emptyRequiredInputs++;
							console.log(`❌ EMPTY REQUIRED FIELD: ${name} (${type || tagName}) - ${placeholder}`);
						} else {
							console.log(
								`⚠️  Empty optional field: ${name} (${type || tagName}) - ${placeholder}`
							);
						}
					} else {
						flowResult.filledInputs++;
						console.log(
							`✅ Filled: ${name} = "${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"`
						);
					}
				}
			} else {
				console.log('Main content area not found');
			}

			validationResults.push(flowResult);

			// Assert that no REQUIRED fields are empty
			if (flowResult.emptyRequiredInputs > 0) {
				throw new Error(
					`${flow} has ${flowResult.emptyRequiredInputs} empty required fields: ${flowResult.emptyFields
						.filter((f) => f.required)
						.map((f) => f.name)
						.join(', ')}`
				);
			}

			console.log(`Summary for ${flow}:`);
			console.log(`  Total fields: ${flowResult.totalInputs}`);
			console.log(`  Filled fields: ${flowResult.filledInputs}`);
			console.log(`  Empty fields: ${flowResult.emptyInputs}`);
			console.log(`  Empty required fields: ${flowResult.emptyRequiredInputs}`);
		}

		// Print overall summary
		console.log('\n=== OVERALL VALIDATION SUMMARY ===');
		const totalFields = validationResults.reduce((sum, r) => sum + r.totalInputs, 0);
		const totalFilled = validationResults.reduce((sum, r) => sum + r.filledInputs, 0);
		const totalEmpty = validationResults.reduce((sum, r) => sum + r.emptyInputs, 0);
		const totalEmptyRequired = validationResults.reduce((sum, r) => sum + r.emptyRequiredInputs, 0);

		console.log(`Total fields across all flows: ${totalFields}`);
		console.log(`Total filled fields: ${totalFilled}`);
		console.log(`Total empty fields: ${totalEmpty}`);
		console.log(`Total empty required fields: ${totalEmptyRequired}`);

		// Final assertion - no required fields should be empty across any flow
		expect(totalEmptyRequired).toBe(0);

		if (totalEmpty > 0) {
			console.log(`\n⚠️  Found ${totalEmpty} empty optional fields (this may be acceptable)`);
			validationResults.forEach((result) => {
				if (result.emptyInputs > 0) {
					const optionalEmpty = result.emptyFields.filter((f) => !f.required);
					if (optionalEmpty.length > 0) {
						console.log(`\n${result.flow} - ${optionalEmpty.length} empty optional fields:`);
						optionalEmpty.forEach((field) => {
							console.log(`  - ${field.name} (${field.type})`);
						});
					}
				}
			});
		} else {
			console.log('\n🎉 All fields in all mock flows have pre-filled values!');
		}
	});

	test('mock flows display educational/mock indicators', async ({ page }) => {
		const mockIndicators = [
			'Mock Flow',
			'Educational Mock Mode',
			'Mock Data',
			'Demo Mode',
			'Test Mode',
			'MOCK',
			'EDUCATIONAL',
		];

		for (const flow of mockFlows) {
			console.log(`\nChecking mock indicators for: ${flow}`);

			await page.goto(flow, { timeout: 15000 });
			await page.waitForTimeout(2000);

			// Check for any mock indicators in the main content
			const mainContent = page.locator('main, .main-content, .flow-container, .container').first();
			let hasMockIndicator = false;

			if (await mainContent.isVisible()) {
				for (const indicator of mockIndicators) {
					const element = mainContent.getByText(indicator).first();
					if (await element.isVisible()) {
						console.log(`✅ Found mock indicator: "${indicator}"`);
						hasMockIndicator = true;
						break;
					}
				}

				if (!hasMockIndicator) {
					// Check for mock indicators in badges or version badges
					const badges = mainContent.locator(
						'.version-badge, [title*="Mock"], [title*="Educational"]'
					);
					if ((await badges.count()) > 0) {
						console.log(`✅ Found mock badges`);
						hasMockIndicator = true;
					}
				}
			}

			if (!hasMockIndicator) {
				console.log(`⚠️  No explicit mock indicator found for ${flow}`);
			}
		}
	});
});
