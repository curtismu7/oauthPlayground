import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import {
  startRedirectlessAuthentication,
  pollRedirectlessAuthentication,
  completeRedirectlessAuthentication,
  toRedirectlessErrorPayload,
} from '../services/pingoneRedirectlessClient.js';

const errorShape = {
  status: z.number().nullish(),
  code: z.string().nullish(),
  message: z.string(),
  description: z.string().nullish(),
  details: z.unknown().optional(),
} as const;

const startInputShape = {
  environmentId: z.string().trim().optional(),
  clientId: z.string().trim().optional(),
  clientSecret: z.string().trim().optional(),
  scope: z.string().trim().optional(),
  responseType: z.string().trim().optional(),
  audience: z.string().trim().optional(),
  username: z.string().trim().optional(),
  password: z.string().trim().optional(),
  userId: z.string().trim().optional(),
  deviceName: z.string().trim().optional(),
  applicationId: z.string().trim().optional(),
} as const;

const pollInputShape = {
  environmentId: z.string().trim().optional(),
  resumeUrl: z.string().trim().min(1, 'resumeUrl is required'),
  pollIntervalMs: z.number().int().positive().optional(),
  timeoutMs: z.number().int().positive().optional(),
} as const;

const completeInputShape = {
  environmentId: z.string().trim().optional(),
  resumeUrl: z.string().trim().min(1, 'resumeUrl is required'),
  code: z.string().trim().optional(),
  verifier: z.string().trim().optional(),
} as const;

const redirectlessOutputSchema = z.object({
  success: z.boolean(),
  resumeUrl: z.string().optional(),
  status: z.string().optional(),
  flowId: z.string().optional(),
  interactionId: z.string().optional(),
  authContext: z.record(z.string(), z.unknown()).optional(),
  raw: z.unknown().optional(),
  error: z.object(errorShape).optional(),
});

const redirectlessOutputShape = redirectlessOutputSchema.shape;

function buildErrorResult(
  component: string,
  error: unknown,
) {
  const payload = toRedirectlessErrorPayload(error);
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
    structuredContent: redirectlessOutputSchema.parse({
      success: false,
      error: payload,
    }) as Record<string, unknown>,
  };
}

export function registerRedirectlessTools(server: McpServer, logger: Logger) {
  server.registerTool(
    'pingone.redirectless.start',
    {
      description: 'Start a PingOne redirectless authentication flow.',
      inputSchema: startInputShape,
      outputSchema: redirectlessOutputShape,
    },
    async (args) => {
      logger.info('Starting PingOne redirectless authentication', { audience: args.audience, userId: args.userId });

      try {
        const parsed = z.object(startInputShape).parse(args);
        const result = await startRedirectlessAuthentication(parsed);
        const structured = redirectlessOutputSchema.parse(result as unknown);

        return {
          content: [
            { type: 'text' as const, text: 'PingOne redirectless authentication initiated.' },
            structured.resumeUrl
              ? { type: 'text' as const, text: `Resume URL: ${structured.resumeUrl}` }
              : { type: 'text' as const, text: `Status: ${structured.status ?? 'UNKNOWN'}` },
          ],
          structuredContent: structured,
        };
      } catch (error) {
        logger.error('MCP.Redirectless.Start', { error });
        return buildErrorResult('PingOne redirectless start', error);
      }
    }
  );

  server.registerTool(
    'pingone.redirectless.poll',
    {
      description: 'Poll a PingOne redirectless authentication resume URL until completion.',
      inputSchema: pollInputShape,
      outputSchema: redirectlessOutputShape,
    },
    async (args) => {
      logger.info('Polling PingOne redirectless authentication', { resumeUrl: args.resumeUrl });

      try {
        const parsed = z.object(pollInputShape).parse(args);
        const result = await pollRedirectlessAuthentication(parsed);

        if (!result.success) {
          return buildErrorResult('PingOne redirectless poll', result.error ?? result);
        }

        const structured = redirectlessOutputSchema.parse(result as unknown);
        return {
          content: [
            { type: 'text' as const, text: `Redirectless authentication completed with status ${structured.status ?? 'COMPLETED'}.` },
            { type: 'text' as const, text: JSON.stringify(structured.authContext ?? {}, null, 2) },
          ],
          structuredContent: structured,
        };
      } catch (error) {
        logger.error('MCP.Redirectless.Poll', { error });
        return buildErrorResult('PingOne redirectless poll', error);
      }
    }
  );

  server.registerTool(
    'pingone.redirectless.complete',
    {
      description: 'Complete a PingOne redirectless authentication using a resume URL.',
      inputSchema: completeInputShape,
      outputSchema: redirectlessOutputShape,
    },
    async (args) => {
      logger.info('Completing PingOne redirectless authentication', { resumeUrl: args.resumeUrl });

      try {
        const parsed = z.object(completeInputShape).parse(args);
        const result = await completeRedirectlessAuthentication(parsed);

        if (!result.success) {
          return buildErrorResult('PingOne redirectless completion', result.error ?? result);
        }

        const structured = redirectlessOutputSchema.parse(result as unknown);
        return {
          content: [
            { type: 'text' as const, text: 'PingOne redirectless authentication completed successfully.' },
            { type: 'text' as const, text: JSON.stringify(structured.authContext ?? {}, null, 2) },
          ],
          structuredContent: structured,
        };
      } catch (error) {
        logger.error('MCP.Redirectless.Complete', { error });
        return buildErrorResult('PingOne redirectless completion', error);
      }
    }
  );
}
