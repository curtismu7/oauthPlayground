// src/components/pingone/IdentityMetricsChart.tsx
// Dashboard chart for PingOne Active Identity Counts

import React from 'react';
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

interface ActiveIdentityCount {
	startDate?: string;
	count?: number;
	[key: string]: unknown;
}

interface IdentityMetricsChartProps {
	activeIdentityCounts: ActiveIdentityCount[];
}

export function IdentityMetricsChart({ activeIdentityCounts }: IdentityMetricsChartProps) {
	if (!activeIdentityCounts || activeIdentityCounts.length === 0) return null;

	const chartData = activeIdentityCounts
		.map((item) => ({
			date: item.startDate
				? new Date(item.startDate).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric',
						year: '2-digit',
					})
				: '—',
			count: item.count ?? 0,
			fullDate: item.startDate,
		}))
		.sort((a, b) => new Date(a.fullDate || 0).getTime() - new Date(b.fullDate || 0).getTime());

	return (
		<div
			style={{
				background: '#fff',
				borderRadius: '1rem',
				border: '1px solid #e5e7eb',
				padding: '1.25rem',
				boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
				marginBottom: '1.5rem',
			}}
		>
			<h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
				Active Identities Over Time
			</h3>
			<ResponsiveContainer width="100%" height={280}>
				<AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
					<defs>
						<linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
							<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
					<XAxis dataKey="date" tick={{ fontSize: 11 }} />
					<YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v.toLocaleString()} />
					<Tooltip formatter={(value: number) => [value.toLocaleString(), 'Count']} />
					<Area
						type="monotone"
						dataKey="count"
						stroke="#10b981"
						strokeWidth={2}
						fill="url(#colorCount)"
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}
