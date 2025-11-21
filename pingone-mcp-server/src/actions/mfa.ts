import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import {
	activateDevice,
	deleteDevice,
	listDevices,
	registerDevice,
	sendChallenge,
	toMfaErrorPayload,
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
}
