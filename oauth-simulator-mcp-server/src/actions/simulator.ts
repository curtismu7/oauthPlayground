import { z } from 'zod';
import { FlowEngine, FlowType, FlowStep, FlowConfig } from '../services/flowEngine.js';
import { logger } from '../services/logger.js';

export const SimulatorRequestSchema = z.object({
  flowType: z.enum(['authorization_code', 'implicit', 'client_credentials', 'device_code', 'password']),
  config: z.object({
    clientId: z.string().min(1),
    redirectUri: z.string().url().optional(),
    scope: z.string().optional(),
    enablePkce: z.boolean().optional(),
    issuerUrl: z.string().url().optional(),
    username: z.string().optional(),
    deviceId: z.string().optional(),
  }),
});

export type SimulatorRequest = z.infer<typeof SimulatorRequestSchema>;

export interface SimulatorResponse {
  steps: FlowStep[];
  stepCount: number;
  summary: string;
  educational: boolean;
  flowType: FlowType;
  configUsed: FlowConfig;
}

export async function simulateFlow(request: SimulatorRequest): Promise<SimulatorResponse> {
  const { flowType, config } = request;

  logger.info('Simulating OAuth flow', { flowType });

  const steps = FlowEngine.generateFlow(flowType, config);

  const summaries: Record<FlowType, string> = {
    authorization_code: 'Authorization Code flow: Three-legged OAuth with user interaction and backend token exchange.',
    implicit: 'Implicit flow (NOT RECOMMENDED): Tokens returned directly in browser URL fragment. Use Authorization Code + PKCE instead.',
    client_credentials: 'Client Credentials flow: Backend-to-backend authentication without user interaction.',
    device_code: 'Device Code flow: Authentication for devices without a browser (TVs, IoT devices).',
    password: 'Password flow (NOT RECOMMENDED): Direct username/password exchange. Only for highly trusted first-party apps.',
  };

  logger.debug('Flow simulation complete', { stepCount: steps.length, flowType });

  return {
    steps,
    stepCount: steps.length,
    summary: summaries[flowType],
    educational: true,
    flowType,
    configUsed: config,
  };
}
