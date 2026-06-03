import { logger } from "./logger.js";

export interface ToolErrorResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError: boolean;
}

export class McpError extends Error {
  constructor(message: string, public code: string = "INTERNAL_ERROR") {
    super(message);
    this.name = "McpError";
  }
}

export function buildToolErrorResult(
  error: unknown,
  toolName: string,
): ToolErrorResult {
  let errorMessage: string;

  if (error instanceof McpError) {
    errorMessage = error.message;
    logger.error(`Tool error in ${toolName}`, { code: error.code, message: error.message });
  } else if (error instanceof Error) {
    errorMessage = error.message;
    logger.error(`Tool error in ${toolName}`, { message: error.message, stack: error.stack });
  } else {
    errorMessage = String(error);
    logger.error(`Tool error in ${toolName}`, { error });
  }

  return {
    content: [
      {
        type: "text",
        text: `Error: ${errorMessage}`,
      },
    ],
    isError: true,
  };
}
