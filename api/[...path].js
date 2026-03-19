// api/[...path].js
// Vercel Serverless catch-all — delegates all /api/* requests to the Express app.
//
// Vercel automatically routes /api/* here when no more-specific api/ file matches.
// The full original URL (e.g. /api/credentials/save) is preserved in req.url so
// Express routes everything correctly without any path remapping.

import app from '../server.js';

export default function handler(req, res) {
	return app(req, res);
}
