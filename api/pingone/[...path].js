// api/pingone/[...path].js
// Vercel Serverless — delegates /api/pingone/* to the Express app in server.js.
// The Express app handles all PingOne routes with proper auth, worker tokens, etc.

import app from '../../server.js';

export default function handler(req, res) {
	return app(req, res);
}
