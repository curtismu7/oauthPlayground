// src/v7m/ui/V7MJwtInspectorModal.tsx

import { FiPackage } from '@icons';
import React, { useMemo, useState } from 'react';
import { V7MHelpModal } from './V7MHelpModal';

type Props = {
	open: boolean;
	token: string;
	onClose: () => void;
};

export const V7MJwtInspectorModal: React.FC<Props> = ({ open, token, onClose }) => {
	const [tab, setTab] = useState<'header' | 'payload' | 'signature'>('payload');
	const decoded = useMemo(() => decode(token), [token]);
	return (
		<V7MHelpModal
			open={open}
			title="JWT Inspector"
			icon={<FiPackage color="#fff" />}
			onClose={onClose}
			themeColor="#0ea5e9"
		>
			<div style={{ marginBottom: 12 }}>
				<button style={tabBtn(tab === 'header')} onClick={() => setTab('header')}>
					Header
				</button>
				<button style={tabBtn(tab === 'payload')} onClick={() => setTab('payload')}>
					Payload
				</button>
				<button style={tabBtn(tab === 'signature')} onClick={() => setTab('signature')}>
					Signature
				</button>
			</div>
			{decoded ? (
				<div style={jsonContainerStyle}>
					<pre style={preStyle}>
						{tab === 'header' && highlightJson(decoded.header)}
						{tab === 'payload' && highlightJson(decoded.payload)}
						{tab === 'signature' && decoded.signature}
					</pre>
				</div>
			) : (
				<p>Not a JWT-like token.</p>
			)}
		</V7MHelpModal>
	);
};

function decode(token: string): { header: any; payload: any; signature: string } | undefined {
	const parts = token.split('.');
	if (parts.length !== 3) return undefined;
	try {
		const header = JSON.parse(b64UrlDecode(parts[0]));
		const payload = JSON.parse(b64UrlDecode(parts[1]));
		const signature = parts[2];
		return { header, payload, signature };
	} catch {
		return undefined;
	}
}

function b64UrlDecode(input: string): string {
	const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
	const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
	return Buffer.from(padded, 'base64').toString('utf8');
}

const jsonContainerStyle: React.CSSProperties = {
	background: '#fff',
	border: '1px solid #e5e7eb',
	borderRadius: 6,
	padding: 12,
};
const preStyle: React.CSSProperties = {
	margin: 0,
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
	fontSize: 13,
};

function highlightJson(obj: any): React.ReactNode {
	const json = JSON.stringify(obj, null, 2);
	// simple syntax highlight: keys red, values blue
	const html = json
		.replace(/(&)/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"([^"]+)":/g, '<span style="color:#ef4444">"$1"</span>:')
		.replace(/: (\d+|true|false|null|".*?")/g, ': <span style="color:#3b82f6">$1</span>');
	return <code dangerouslySetInnerHTML={{ __html: html }} />;
}

function tabBtn(active: boolean): React.CSSProperties {
	return {
		marginRight: 8,
		padding: '6px 10px',
		borderRadius: 6,
		border: '1px solid #cbd5e1',
		background: active ? '#e0f2fe' : '#fff',
		cursor: 'pointer',
	};
}
