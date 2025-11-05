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
    const argsShape: Record<string, z.ZodTypeAny> = {};
    prompt.args.forEach((arg) => {
      const baseSchema = promptArgSchemas[arg.zod] ?? z.string();
      argsShape[arg.name] = arg.optional ? baseSchema.optional() : baseSchema;
    });

    server.registerPrompt(
      prompt.name,
      {
        description: prompt.description,
        argsSchema: argsShape as Record<string, z.ZodTypeAny>,
      },
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
              content: {
                type: 'text' as const,
                text: content.join('\n\n'),
              },
            },
          ],
        };
      }
    );
  });
}

function registerPracticeTools(server: McpServer, logger: Logger) {
  const practiceOutputSchema = z.object({
    scenario: z.string(),
    guidance: z.array(z.string()),
  });

  practiceTools.forEach((tool) => {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        outputSchema: practiceOutputSchema.shape,
      },
      async () => {
        logger.info('Simulating practice tool', { tool: tool.name });

        const structured = practiceOutputSchema.parse({
          scenario: tool.scenario,
          guidance: tool.guidance,
        });

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
          structuredContent: structured,
        };
      }
    );
  });
}
