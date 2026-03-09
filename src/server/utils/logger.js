// Server-side logger adapter
// Plain ESM JS compatible with Node.js server files

const timestamp = () => new Date().toISOString();

export const logger = {
	info: (msg, ...args) => console.log(`[${timestamp()}] INFO  ${msg}`, ...args),
	warn: (msg, ...args) => console.warn(`[${timestamp()}] WARN  ${msg}`, ...args),
	error: (msg, ...args) => console.error(`[${timestamp()}] ERROR ${msg}`, ...args),
	debug: (msg, ...args) => console.debug(`[${timestamp()}] DEBUG ${msg}`, ...args),
};
