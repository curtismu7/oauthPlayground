import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import {
	activateDevice,
	allowMfaBypass,
	blockDevice,
	checkMfaBypass,
	createDeviceAuthPolicy,
	deleteDevice,
	getDeviceAuthPolicy,
	listDeviceAuthPolicies,
	listDevices,
	registerDevice,
	removeDeviceOrder,
	sendChallenge,
	sendOtp,
	setDeviceOrder,
	toMfaErrorPayload,
	unblockDevice,
	unlockDevice,
	updateDeviceAuthPolicy,
	updateDeviceNickname,
	validateChallenge,
} from '../services/pingoneMfaClient.js';

const credentialsShape = {
	environmentId: z.string().trim().optional(),
	workerToken: z.string().trim().min(1, 'workerToken is required'),
	userId: z.string().trim().min(1, 'userId is required'),
} as const;

const listDevicesOutputSchema = z.object({
	success: z.boolean(),
	devices: z.array(z.record(z.string(), z.unknown())).optional(),
	error: z
		.object({
			status: z.number().nullish(),
			code: z.string().nullish(),
			message: z.string(),
			description: z.string().nullish(),
			details: z.unknown().optional(),
		})
		.optional(),
});

const registerDeviceInputShape = {
	...credentialsShape,
	type: z.enum(['SMS', 'EMAIL', 'TOTP', 'VOICE', 'FIDO2', 'MOBILE']),
	phoneNumber: z.string().trim().optional(),
	emailAddress: z.string().trim().optional(),
	nickname: z.string().trim().optional(),
	deviceName: z.string().trim().optional(),
} as const;

const registerDeviceOutputSchema = z.object({
	success: z.boolean(),
	device: z.record(z.string(), z.unknown()).optional(),
	error: z
		.object({
			status: z.number().nullish(),
			code: z.string().nullish(),
			message: z.string(),
			description: z.string().nullish(),
			details: z.unknown().optional(),
		})
		.optional(),
});

const activateDeviceInputShape = {
	...credentialsShape,
	deviceId: z.string().trim().min(1, 'deviceId is required'),
	otp: z.string().trim().min(1, 'otp is required'),
} as const;

const challengeInputShape = {
	...credentialsShape,
	deviceId: z.string().trim().min(1, 'deviceId is required'),
	method: z.enum(['SMS', 'EMAIL', 'VOICE']).optional(),
} as const;

const challengeOutputSchema = z.object({
	success: z.boolean(),
	challenge: z.record(z.string(), z.unknown()).optional(),
	error: z
		.object({
			status: z.number().nullish(),
			code: z.string().nullish(),
			message: z.string(),
			description: z.string().nullish(),
			details: z.unknown().optional(),
		})
		.optional(),
});

const validateChallengeInputShape = {
	...credentialsShape,
	challengeId: z.string().trim().min(1, 'challengeId is required'),
	code: z.string().trim().min(1, 'code is required'),
} as const;

const validateChallengeOutputSchema = challengeOutputSchema;

const deleteDeviceInputShape = {
	...credentialsShape,
	deviceId: z.string().trim().min(1, 'deviceId is required'),
} as const;

const operationOutputSchema = z.object({
	success: z.boolean(),
	error: z
		.object({
			status: z.number().nullish(),
			code: z.string().nullish(),
			message: z.string(),
			description: z.string().nullish(),
			details: z.unknown().optional(),
		})
		.optional(),
});

function buildErrorResult<T extends z.ZodTypeAny>(component: string, error: unknown, validator: T) {
	const payload = toMfaErrorPayload(error);
	return {
		content: [
			{
				type: 'text' as const,
				text: `${component} failed: ${payload.message}`,
			},
			{
				type: 'text' as const,
				text: `Details: ${JSON.stringify(payload, null, 2)}`,
			},
		],
		structuredContent: validator.parse({
			success: false,
			error: payload,
		}) as Record<string, unknown>,
	};
}

export function registerMfaTools(server: McpServer, logger: Logger) {
	server.registerTool(
		'pingone.mfa.devices.list',
		{
			description: 'List PingOne MFA devices for a user.',
			inputSchema: credentialsShape,
			outputSchema: listDevicesOutputSchema.shape,
		},
		async (args) => {
			logger.info('Listing PingOne MFA devices', { userId: args.userId });

			try {
				const parsed = z.object(credentialsShape).parse(args);
				const devices = await listDevices(parsed);
				return {
					content: [
						{
							type: 'text' as const,
							text: `Retrieved ${devices.length} MFA devices from PingOne.`,
						},
						{
							type: 'text' as const,
							text: JSON.stringify(devices, null, 2),
						},
					],
					structuredContent: listDevicesOutputSchema.parse({
						success: true,
						devices,
					}) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Devices.List', { error });
				return buildErrorResult('PingOne MFA device listing', error, listDevicesOutputSchema);
			}
		}
	);

	server.registerTool(
		'pingone.mfa.devices.register',
		{
			description: 'Register a new PingOne MFA device for a user.',
			inputSchema: registerDeviceInputShape,
			outputSchema: registerDeviceOutputSchema.shape,
		},
		async (args) => {
			logger.info('Registering PingOne MFA device', { userId: args.userId, type: args.type });

			try {
				const parsed = z.object(registerDeviceInputShape).parse(args);
				const result = await registerDevice({
					credentials: parsed,
					type: parsed.type,
					phoneNumber: parsed.phoneNumber,
					emailAddress: parsed.emailAddress,
					nickname: parsed.nickname,
					deviceName: parsed.deviceName,
				});

				if (!result.success) {
					return buildErrorResult(
						'PingOne MFA device registration',
						result.error ?? 'Unknown error',
						registerDeviceOutputSchema
					);
				}

				return {
					content: [
						{ type: 'text' as const, text: 'PingOne MFA device registered successfully.' },
						{ type: 'text' as const, text: JSON.stringify(result.device ?? {}, null, 2) },
					],
					structuredContent: registerDeviceOutputSchema.parse({
						success: true,
						device: result.device,
					}) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Devices.Register', { error });
				return buildErrorResult(
					'PingOne MFA device registration',
					error,
					registerDeviceOutputSchema
				);
			}
		}
	);

	server.registerTool(
		'pingone.mfa.devices.activate',
		{
			description: 'Activate a PingOne MFA device using an OTP code.',
			inputSchema: activateDeviceInputShape,
			outputSchema: operationOutputSchema.shape,
		},
		async (args) => {
			logger.info('Activating PingOne MFA device', {
				userId: args.userId,
				deviceId: args.deviceId,
			});

			try {
				const parsed = z.object(activateDeviceInputShape).parse(args);
				await activateDevice({
					credentials: parsed,
					deviceId: parsed.deviceId,
					otp: parsed.otp,
				});

				return {
					content: [{ type: 'text' as const, text: 'PingOne MFA device activated successfully.' }],
					structuredContent: operationOutputSchema.parse({ success: true }) as Record<
						string,
						unknown
					>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Devices.Activate', { error });
				return buildErrorResult('PingOne MFA device activation', error, operationOutputSchema);
			}
		}
	);

	server.registerTool(
		'pingone.mfa.challenge.send',
		{
			description: 'Initiate an MFA challenge for a PingOne device.',
			inputSchema: challengeInputShape,
			outputSchema: challengeOutputSchema.shape,
		},
		async (args) => {
			logger.info('Sending PingOne MFA challenge', {
				userId: args.userId,
				deviceId: args.deviceId,
			});

			try {
				const parsed = z.object(challengeInputShape).parse(args);
				const challenge = await sendChallenge({
					credentials: parsed,
					deviceId: parsed.deviceId,
					method: parsed.method,
				});

				return {
					content: [
						{ type: 'text' as const, text: 'PingOne MFA challenge sent successfully.' },
						{ type: 'text' as const, text: JSON.stringify(challenge, null, 2) },
					],
					structuredContent: challengeOutputSchema.parse({
						success: true,
						challenge,
					}) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Challenge.Send', { error });
				return buildErrorResult('PingOne MFA challenge send', error, challengeOutputSchema);
			}
		}
	);

	server.registerTool(
		'pingone.mfa.challenge.validate',
		{
			description: 'Validate a PingOne MFA challenge response.',
			inputSchema: validateChallengeInputShape,
			outputSchema: validateChallengeOutputSchema.shape,
		},
		async (args) => {
			logger.info('Validating PingOne MFA challenge', {
				userId: args.userId,
				challengeId: args.challengeId,
			});

			try {
				const parsed = z.object(validateChallengeInputShape).parse(args);
				const validation = await validateChallenge({
					credentials: parsed,
					challengeId: parsed.challengeId,
					code: parsed.code,
				});

				return {
					content: [
						{ type: 'text' as const, text: 'PingOne MFA challenge validated.' },
						{ type: 'text' as const, text: JSON.stringify(validation, null, 2) },
					],
					structuredContent: validateChallengeOutputSchema.parse({
						success: true,
						challenge: validation,
					}) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Challenge.Validate', { error });
				return buildErrorResult(
					'PingOne MFA challenge validation',
					error,
					validateChallengeOutputSchema
				);
			}
		}
	);

	server.registerTool(
		'pingone.mfa.devices.delete',
		{
			description: 'Delete a PingOne MFA device.',
			inputSchema: deleteDeviceInputShape,
			outputSchema: operationOutputSchema.shape,
		},
		async (args) => {
			logger.info('Deleting PingOne MFA device', { userId: args.userId, deviceId: args.deviceId });

			try {
				const parsed = z.object(deleteDeviceInputShape).parse(args);
				await deleteDevice({
					credentials: parsed,
					deviceId: parsed.deviceId,
				});

				return {
					content: [{ type: 'text' as const, text: 'PingOne MFA device deleted successfully.' }],
					structuredContent: operationOutputSchema.parse({ success: true }) as Record<
						string,
						unknown
					>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Devices.Delete', { error });
				return buildErrorResult('PingOne MFA device deletion', error, operationOutputSchema);
			}
		}
	);

	// ── Device Authentication Policies ─────────────────────────────────────────

	const policyInputShape = {
		environmentId: z.string().trim().optional(),
		workerToken: z.string().trim().min(1, 'workerToken is required'),
		region: z.string().trim().optional(),
	} as const;

	const policyOutputSchema = z.object({
		success: z.boolean(),
		policies: z.array(z.record(z.string(), z.unknown())).optional(),
		policy: z.record(z.string(), z.unknown()).optional(),
		error: z
			.object({
				status: z.number().nullish(),
				code: z.string().nullish(),
				message: z.string(),
				description: z.string().nullish(),
				details: z.unknown().optional(),
			})
			.optional(),
	});

	server.registerTool(
		'pingone.mfa.policy.list',
		{
			description: 'List all MFA device authentication policies in the PingOne environment.',
			inputSchema: policyInputShape,
			outputSchema: policyOutputSchema.shape,
		},
		async (args) => {
			logger.info('Listing MFA device authentication policies');
			try {
				const parsed = z.object(policyInputShape).parse(args);
				const policies = await listDeviceAuthPolicies(parsed);
				return {
					content: [
						{ type: 'text' as const, text: `Found ${policies.length} device authentication policies.` },
						{ type: 'text' as const, text: JSON.stringify(policies, null, 2) },
					],
					structuredContent: policyOutputSchema.parse({ success: true, policies }) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Policy.List', { error });
				return buildErrorResult('List device authentication policies', error, policyOutputSchema);
			}
		}
	);

	server.registerTool(
		'pingone.mfa.policy.get',
		{
			description: 'Get a specific MFA device authentication policy by ID.',
			inputSchema: { ...policyInputShape, policyId: z.string().trim().min(1, 'policyId is required') },
			outputSchema: policyOutputSchema.shape,
		},
		async (args) => {
			logger.info('Getting MFA device authentication policy', { policyId: args.policyId });
			try {
				const parsed = z.object({ ...policyInputShape, policyId: z.string().trim().min(1) }).parse(args);
				const policy = await getDeviceAuthPolicy(parsed, parsed.policyId);
				return {
					content: [
						{ type: 'text' as const, text: 'Retrieved device authentication policy.' },
						{ type: 'text' as const, text: JSON.stringify(policy, null, 2) },
					],
					structuredContent: policyOutputSchema.parse({ success: true, policy: policy as Record<string, unknown> }) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Policy.Get', { error });
				return buildErrorResult('Get device authentication policy', error, policyOutputSchema);
			}
		}
	);

	server.registerTool(
		'pingone.mfa.policy.create',
		{
			description: 'Create a new MFA device authentication policy in PingOne.',
			inputSchema: {
				...policyInputShape,
				policy: z.record(z.string(), z.unknown()).describe('Policy object — must include at least "name". "type" defaults to "DEFAULT".'),
			},
			outputSchema: policyOutputSchema.shape,
		},
		async (args) => {
			logger.info('Creating MFA device authentication policy', { policyName: (args.policy as Record<string, unknown>)?.name });
			try {
				const parsed = z.object({ ...policyInputShape, policy: z.record(z.string(), z.unknown()) }).parse(args);
				const policy = await createDeviceAuthPolicy(parsed, parsed.policy);
				return {
					content: [
						{ type: 'text' as const, text: 'Device authentication policy created.' },
						{ type: 'text' as const, text: JSON.stringify(policy, null, 2) },
					],
					structuredContent: policyOutputSchema.parse({ success: true, policy: policy as Record<string, unknown> }) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Policy.Create', { error });
				return buildErrorResult('Create device authentication policy', error, policyOutputSchema);
			}
		}
	);

	server.registerTool(
		'pingone.mfa.policy.update',
		{
			description: 'Update an existing MFA device authentication policy (full PUT replacement).',
			inputSchema: {
				...policyInputShape,
				policyId: z.string().trim().min(1, 'policyId is required'),
				policy: z.record(z.string(), z.unknown()).describe('Complete policy object to replace the existing policy.'),
			},
			outputSchema: policyOutputSchema.shape,
		},
		async (args) => {
			logger.info('Updating MFA device authentication policy', { policyId: args.policyId });
			try {
				const parsed = z.object({
					...policyInputShape,
					policyId: z.string().trim().min(1),
					policy: z.record(z.string(), z.unknown()),
				}).parse(args);
				const policy = await updateDeviceAuthPolicy(parsed, parsed.policyId, parsed.policy);
				return {
					content: [
						{ type: 'text' as const, text: 'Device authentication policy updated.' },
						{ type: 'text' as const, text: JSON.stringify(policy, null, 2) },
					],
					structuredContent: policyOutputSchema.parse({ success: true, policy: policy as Record<string, unknown> }) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Policy.Update', { error });
				return buildErrorResult('Update device authentication policy', error, policyOutputSchema);
			}
		}
	);

	// ── Device status (block / unlock / unblock) ────────────────────────────────

	const deviceStatusInputShape = {
		environmentId: z.string().trim().optional(),
		workerToken: z.string().trim().min(1, 'workerToken is required'),
		userId: z.string().trim().min(1, 'userId is required'),
		deviceId: z.string().trim().min(1, 'deviceId is required'),
		region: z.string().trim().optional(),
	} as const;

	server.registerTool(
		'pingone.mfa.devices.block',
		{
			description: 'Block a PingOne MFA device, preventing it from being used for authentication.',
			inputSchema: deviceStatusInputShape,
			outputSchema: operationOutputSchema.shape,
		},
		async (args) => {
			logger.info('Blocking MFA device', { userId: args.userId, deviceId: args.deviceId });
			try {
				const parsed = z.object(deviceStatusInputShape).parse(args);
				await blockDevice(parsed);
				return {
					content: [{ type: 'text' as const, text: 'MFA device blocked successfully.' }],
					structuredContent: operationOutputSchema.parse({ success: true }) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Devices.Block', { error });
				return buildErrorResult('Block MFA device', error, operationOutputSchema);
			}
		}
	);

	server.registerTool(
		'pingone.mfa.devices.unlock',
		{
			description: 'Unlock a PingOne MFA device that was locked due to too many failed attempts.',
			inputSchema: deviceStatusInputShape,
			outputSchema: operationOutputSchema.shape,
		},
		async (args) => {
			logger.info('Unlocking MFA device', { userId: args.userId, deviceId: args.deviceId });
			try {
				const parsed = z.object(deviceStatusInputShape).parse(args);
				await unlockDevice(parsed);
				return {
					content: [{ type: 'text' as const, text: 'MFA device unlocked successfully.' }],
					structuredContent: operationOutputSchema.parse({ success: true }) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Devices.Unlock', { error });
				return buildErrorResult('Unlock MFA device', error, operationOutputSchema);
			}
		}
	);

	server.registerTool(
		'pingone.mfa.devices.unblock',
		{
			description: 'Unblock a PingOne MFA device that was administratively blocked.',
			inputSchema: deviceStatusInputShape,
			outputSchema: operationOutputSchema.shape,
		},
		async (args) => {
			logger.info('Unblocking MFA device', { userId: args.userId, deviceId: args.deviceId });
			try {
				const parsed = z.object(deviceStatusInputShape).parse(args);
				await unblockDevice(parsed);
				return {
					content: [{ type: 'text' as const, text: 'MFA device unblocked successfully.' }],
					structuredContent: operationOutputSchema.parse({ success: true }) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Devices.Unblock', { error });
				return buildErrorResult('Unblock MFA device', error, operationOutputSchema);
			}
		}
	);

	// ── Device nickname ─────────────────────────────────────────────────────────

	const deviceNicknameOutputSchema = z.object({
		success: z.boolean(),
		device: z.record(z.string(), z.unknown()).optional(),
		error: z.object({ status: z.number().nullish(), code: z.string().nullish(), message: z.string(), description: z.string().nullish(), details: z.unknown().optional() }).optional(),
	});

	server.registerTool(
		'pingone.mfa.devices.nickname',
		{
			description: 'Update the display nickname of a PingOne MFA device.',
			inputSchema: {
				...deviceStatusInputShape,
				nickname: z.string().trim().min(1, 'nickname is required'),
			},
			outputSchema: deviceNicknameOutputSchema.shape,
		},
		async (args) => {
			logger.info('Updating MFA device nickname', { userId: args.userId, deviceId: args.deviceId });
			try {
				const parsed = z.object({ ...deviceStatusInputShape, nickname: z.string().trim().min(1) }).parse(args);
				const device = await updateDeviceNickname(parsed);
				return {
					content: [
						{ type: 'text' as const, text: 'MFA device nickname updated.' },
						{ type: 'text' as const, text: JSON.stringify(device, null, 2) },
					],
					structuredContent: deviceNicknameOutputSchema.parse({ success: true, device: device as Record<string, unknown> }) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Devices.Nickname', { error });
				return buildErrorResult('Update device nickname', error, deviceNicknameOutputSchema);
			}
		}
	);

	// ── MFA Bypass ───────────────────────────────────────────────────────────────

	const bypassInputShape = {
		environmentId: z.string().trim().optional(),
		workerToken: z.string().trim().min(1, 'workerToken is required'),
		userId: z.string().trim().min(1, 'userId is required'),
		region: z.string().trim().optional(),
	} as const;

	const bypassOutputSchema = z.object({
		success: z.boolean(),
		bypass: z.record(z.string(), z.unknown()).optional(),
		error: z.object({ status: z.number().nullish(), code: z.string().nullish(), message: z.string(), description: z.string().nullish(), details: z.unknown().optional() }).optional(),
	});

	server.registerTool(
		'pingone.mfa.bypass.allow',
		{
			description: 'Enable MFA bypass for a PingOne user (allows them to skip MFA temporarily).',
			inputSchema: bypassInputShape,
			outputSchema: bypassOutputSchema.shape,
		},
		async (args) => {
			logger.info('Allowing MFA bypass', { userId: args.userId });
			try {
				const parsed = z.object(bypassInputShape).parse(args);
				const result = await allowMfaBypass(parsed);
				return {
					content: [
						{ type: 'text' as const, text: 'MFA bypass enabled for user.' },
						{ type: 'text' as const, text: JSON.stringify(result, null, 2) },
					],
					structuredContent: bypassOutputSchema.parse({ success: true, bypass: result as Record<string, unknown> }) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Bypass.Allow', { error });
				return buildErrorResult('Allow MFA bypass', error, bypassOutputSchema);
			}
		}
	);

	server.registerTool(
		'pingone.mfa.bypass.check',
		{
			description: 'Check the current MFA bypass status for a PingOne user.',
			inputSchema: bypassInputShape,
			outputSchema: bypassOutputSchema.shape,
		},
		async (args) => {
			logger.info('Checking MFA bypass status', { userId: args.userId });
			try {
				const parsed = z.object(bypassInputShape).parse(args);
				const result = await checkMfaBypass(parsed);
				return {
					content: [
						{ type: 'text' as const, text: 'MFA bypass status retrieved.' },
						{ type: 'text' as const, text: JSON.stringify(result, null, 2) },
					],
					structuredContent: bypassOutputSchema.parse({ success: true, bypass: result as Record<string, unknown> }) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Bypass.Check', { error });
				return buildErrorResult('Check MFA bypass', error, bypassOutputSchema);
			}
		}
	);

	// ── Device order ────────────────────────────────────────────────────────────

	const deviceOrderInputShape = {
		environmentId: z.string().trim().optional(),
		workerToken: z.string().trim().min(1, 'workerToken is required'),
		userId: z.string().trim().min(1, 'userId is required'),
		region: z.string().trim().optional(),
	} as const;

	server.registerTool(
		'pingone.mfa.devices.reorder',
		{
			description: 'Set the preferred order of MFA devices for a user.',
			inputSchema: {
				...deviceOrderInputShape,
				deviceIds: z.array(z.string().trim().min(1)).min(1, 'At least one deviceId is required').describe('Ordered list of device IDs from most-preferred to least-preferred.'),
			},
			outputSchema: operationOutputSchema.shape,
		},
		async (args) => {
			logger.info('Setting MFA device order', { userId: args.userId, count: args.deviceIds.length });
			try {
				const parsed = z.object({ ...deviceOrderInputShape, deviceIds: z.array(z.string().trim().min(1)).min(1) }).parse(args);
				await setDeviceOrder(parsed);
				return {
					content: [{ type: 'text' as const, text: 'MFA device order set successfully.' }],
					structuredContent: operationOutputSchema.parse({ success: true }) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Devices.Reorder', { error });
				return buildErrorResult('Set device order', error, operationOutputSchema);
			}
		}
	);

	server.registerTool(
		'pingone.mfa.devices.reorder.remove',
		{
			description: 'Remove the custom device order for a user, reverting to default ordering.',
			inputSchema: deviceOrderInputShape,
			outputSchema: operationOutputSchema.shape,
		},
		async (args) => {
			logger.info('Removing MFA device order', { userId: args.userId });
			try {
				const parsed = z.object(deviceOrderInputShape).parse(args);
				await removeDeviceOrder(parsed);
				return {
					content: [{ type: 'text' as const, text: 'MFA device order removed successfully.' }],
					structuredContent: operationOutputSchema.parse({ success: true }) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Devices.Reorder.Remove', { error });
				return buildErrorResult('Remove device order', error, operationOutputSchema);
			}
		}
	);

	// ── OTP ─────────────────────────────────────────────────────────────────────

	const otpOutputSchema = z.object({
		success: z.boolean(),
		otp: z.record(z.string(), z.unknown()).optional(),
		error: z.object({ status: z.number().nullish(), code: z.string().nullish(), message: z.string(), description: z.string().nullish(), details: z.unknown().optional() }).optional(),
	});

	server.registerTool(
		'pingone.mfa.devices.otp',
		{
			description: 'Send an OTP to a PingOne MFA device (SMS, EMAIL, or VOICE).',
			inputSchema: deviceStatusInputShape,
			outputSchema: otpOutputSchema.shape,
		},
		async (args) => {
			logger.info('Sending OTP to MFA device', { userId: args.userId, deviceId: args.deviceId });
			try {
				const parsed = z.object(deviceStatusInputShape).parse(args);
				const result = await sendOtp(parsed);
				return {
					content: [
						{ type: 'text' as const, text: 'OTP sent to MFA device.' },
						{ type: 'text' as const, text: JSON.stringify(result, null, 2) },
					],
					structuredContent: otpOutputSchema.parse({ success: true, otp: result as Record<string, unknown> }) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.MFA.Devices.OTP', { error });
				return buildErrorResult('Send OTP', error, otpOutputSchema);
			}
		}
	);
}
