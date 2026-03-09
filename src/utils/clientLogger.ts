export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

import { logger } from '../utils/logger';

export async function clientLog(
	level: LogLevel,
	message: string,
	meta?: Record<string, unknown>
): Promise<void> {
	try {
		// Always console log for local visibility
		// Avoid printing secrets; caller must pass safe meta only
		const prefix = `[client:${level}]`;
		if (level === 'debug') logger.debug(prefix, message, meta || {});
		else if (level === 'info') logger.info(prefix, message, meta || {});
		else if (level === 'warn') logger.warn(prefix, message, meta || {});
		else logger.error(prefix, message, meta || {});

		// Post to dev server endpoint; ignore failures
		await fetch('/__client-log', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ level, message, meta }),
			keepalive: true,
		}).catch(() => {});
	} catch {}
}
