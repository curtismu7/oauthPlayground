// api/tokens/store.js
// Backend endpoint for storing tokens in SQLite database

export default async function handler(req, res) {
	// Only allow POST requests
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const { flowKey, data } = req.body;

		if (!flowKey || !data) {
			return res.status(400).json({ error: 'Missing required fields: flowKey, data' });
		}

		// For now, return success since we're using IndexedDB as primary storage
		// SQLite is backup/fallback only
		return res.status(200).json({
			success: true,
			message: 'Token storage acknowledged (using IndexedDB as primary)',
			flowKey,
		});
	} catch (error) {
		console.error('[API /tokens/store] Error:', error);
		return res.status(500).json({
			error: 'Internal server error',
			message: error.message,
		});
	}
}
