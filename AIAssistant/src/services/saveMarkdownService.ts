/**
 * saveMarkdownService — writes markdown content to disk via backend API.
 * Supports natural language, bullet points, and checkboxes (- [ ] / - [x]).
 * Files are saved under ~/.pingone-playground/ai-assistant-output/
 */

const DEFAULT_DIRECTORY = 'ai-assistant-output';

export interface SaveMarkdownResult {
	success: boolean;
	path?: string;
	error?: string;
}

/**
 * Saves markdown content to a file. Uses backend API to write to disk.
 * @param content - Raw markdown (natural language, bullets, checkboxes)
 * @param filename - e.g. "my-plan.md" or "output-2026-03-15.md"
 */
export async function saveMarkdown(
	content: string,
	filename: string
): Promise<SaveMarkdownResult> {
	try {
		const res = await fetch('/api/file-storage/save-markdown', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				directory: DEFAULT_DIRECTORY,
				filename: filename.endsWith('.md') ? filename : `${filename}.md`,
				content,
			}),
		});
		const data = await res.json();
		if (!res.ok) {
			return { success: false, error: data.error ?? data.message ?? 'Save failed' };
		}
		if (!data.success) {
			return { success: false, error: data.error ?? 'Save failed' };
		}
		return {
			success: true,
			path: `~/.pingone-playground/${DEFAULT_DIRECTORY}/${filename}`,
		};
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Network error',
		};
	}
}

/**
 * Generates a default filename with timestamp.
 */
export function defaultMarkdownFilename(): string {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	const h = String(d.getHours()).padStart(2, '0');
	const min = String(d.getMinutes()).padStart(2, '0');
	return `output-${y}-${m}-${day}-${h}${min}.md`;
}
