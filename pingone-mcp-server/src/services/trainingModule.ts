import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from './logger.js';
import {
  trainingResources,
  trainingPrompts,
  practiceTools,
} from '../config/trainingContent.js';

const promptArgSchemas: Record<string, z.ZodTypeAny> = {
  string: z.string(),
};

export function registerTrainingModule(server: McpServer, logger: Logger) {
  registerResources(server, logger);
  registerPrompts(server, logger);
  registerPracticeTools(server, logger);
}

function registerResources(server: McpServer, logger: Logger) {
  trainingResources.forEach((resource) => {
    server.resource(
      resource.name,
      resource.uri,
      {
        title: resource.title,
        description: resource.summary,
      },
      async () => {
        logger.info('Serving training resource', { resource: resource.name });
        return {
          contents: [
            {
              uri: resource.uri,
              type: 'text',
              text: resource.body,
            },
          ],
        };
      }
    );
  });
}

function registerPrompts(server: McpServer, logger: Logger) {
  trainingPrompts.forEach((prompt) => {
    const argsSchemaEntries = prompt.args.reduce<Record<string, z.ZodString | z.ZodOptional<z.ZodString>>>(
      (acc, arg) => {
        const baseSchema = promptArgSchemas[arg.zod] ?? z.string();
        if (!z.string().safeParse('').success) {
          // placeholder to appease compiler but not executed
        }
        acc[arg.name] = arg.optional ? baseSchema.optional() : baseSchema;
        return acc;
      },
      {}
    );

    server.prompt(
      prompt.name,
      prompt.description,
      argsSchemaEntries,
      async (args) => {
        logger.info('Serving training prompt', {
          prompt: prompt.name,
          args,
        });

        const content = prompt.template(
          Object.fromEntries(
            Object.entries(args).map(([key, value]) => [key, String(value ?? '')])
          )
        );

        return {
          description: prompt.description,
          messages: [
            {
              role: 'assistant',
              content: content.map((text) => ({ type: 'text' as const, text })),
            },
          ],
        };
      }
    );
  });
}

function registerPracticeTools(server: McpServer, logger: Logger) {
  practiceTools.forEach((tool) => {
    server.tool(
      tool.name,
      tool.description,
      {
        scenario: z.string(),
        guidance: z.array(z.string()),
      },
      async () => {
        logger.info('Simulating practice tool', { tool: tool.name });
        return {
          content: [
            {
              type: 'text',
              text: `Practice Mode: ${tool.scenario}`,
            },
            {
              type: 'text',
              text: tool.guidance.map((line) => `• ${line}`).join('\n'),
            },
          ],
          data: {
            scenario: tool.scenario,
            guidance: tool.guidance,
          },
        };
      }
    );
  });
}
