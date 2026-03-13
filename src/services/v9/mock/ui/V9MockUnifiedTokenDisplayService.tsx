// src/services/v7m/ui/V9MockUnifiedTokenDisplayService.tsx
import React from 'react';

export const V9MockUnifiedTokenDisplayService = {
	JsonView: ({ data }: { data: unknown }) => (
		<pre style={preJson}>{JSON.stringify(data, null, 2)}</pre>
	),
};

const preJson: React.CSSProperties = {
	background: '#fff',
	border: '1px solid #e5e7eb',
	borderRadius: 6,
	padding: 12,
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
};
