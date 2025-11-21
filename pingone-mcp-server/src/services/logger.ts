export class Logger {
	constructor(private readonly scope: string) {}

	info(message: string, meta?: unknown) {
		console.log(`[${this.scope}] INFO: ${message}`, meta ?? '');
	}

	warn(message: string, meta?: unknown) {
		console.warn(`[${this.scope}] WARN: ${message}`, meta ?? '');
	}

	error(message: string, meta?: unknown) {
		console.error(`[${this.scope}] ERROR: ${message}`, meta ?? '');
	}
}
