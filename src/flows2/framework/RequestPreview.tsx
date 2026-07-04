// src/flows2/framework/RequestPreview.tsx
//
// Shows the raw HTTP request that the current flow step would send, formatted as a
// copy-paste-ready curl command. Teaching tool only — the curl reflects the direct
// PingOne call (not the BFF proxy), so learners see the actual OAuth wire protocol.

import React from 'react';
import styled from 'styled-components';
import { CodeBlock } from './CodeBlock';
import { tokens } from './tokens';

export interface CurlRequest {
	method: 'GET' | 'POST';
	url: string;
	/** HTTP request headers */
	headers?: Record<string, string>;
	/** Key-value pairs for the request body (POST) or query string (GET). Undefined
	 *  values are omitted so callers can pass conditional params without extra guards. */
	params?: Record<string, string | undefined>;
}

/** Format a CurlRequest as a human-readable multi-line curl command. */
export function buildCurl(req: CurlRequest): string {
	const lines: string[] = [];
	const isGet = req.method === 'GET';

	if (isGet) {
		lines.push(`curl --get \\`);
	} else {
		lines.push(`curl -X POST \\`);
	}

	lines.push(`  '${req.url}' \\`);

	// Headers (Content-Type first for readability)
	const headers = req.headers ?? {};
	if (!isGet && !headers['Content-Type']) {
		headers['Content-Type'] = 'application/x-www-form-urlencoded';
	}
	for (const [k, v] of Object.entries(headers)) {
		lines.push(`  -H '${k}: ${v}' \\`);
	}

	// Params — each on its own line for readability
	const entries = Object.entries(req.params ?? {}).filter(
		(entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== ''
	);
	for (let i = 0; i < entries.length; i++) {
		const [k, v] = entries[i];
		const isLast = i === entries.length - 1;
		const suffix = isLast ? '' : ' \\';
		lines.push(`  --data-urlencode '${k}=${v}'${suffix}`);
	}

	// Trim trailing backslash if no params were added
	if (entries.length === 0 && lines.length > 0) {
		lines[lines.length - 1] = lines[lines.length - 1].replace(/ \\$/, '');
	}

	return lines.join('\n');
}

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
`;

const Label = styled.div`
	font-size: 0.75rem;
	font-weight: 700;
	color: ${tokens.color.textMuted};
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

export interface RequestPreviewProps {
	request: CurlRequest | null;
	label?: string;
}

export const RequestPreview: React.FC<RequestPreviewProps> = ({
	request,
	label = 'Raw request (curl)',
}) => {
	if (!request) return null;
	return (
		<Wrap>
			<Label>{label}</Label>
			<CodeBlock value={buildCurl(request)} />
		</Wrap>
	);
};
