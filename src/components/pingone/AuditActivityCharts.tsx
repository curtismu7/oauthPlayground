// src/components/pingone/AuditActivityCharts.tsx
// Dashboard charts for PingOne Audit Activities

import React from 'react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

interface AuditActivity {
	action?: { type?: string };
	result?: { status?: string };
	[key: string]: unknown;
}

interface AuditActivityChartsProps {
	activities: AuditActivity[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AuditActivityCharts({ activities }: AuditActivityChartsProps) {
	if (!activities || activities.length === 0) return null;

	// Aggregate by action type for bar chart
	const actionCounts = activities.reduce<Record<string, number>>((acc, a) => {
		const type = a.action?.type || 'unknown';
		acc[type] = (acc[type] || 0) + 1;
		return acc;
	}, {});
	const barData = Object.entries(actionCounts)
		.map(([name, count]) => ({ name: name.length > 20 ? `${name.slice(0, 18)}…` : name, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 8);

	// Success/failure for pie chart
	const statusCounts = activities.reduce<Record<string, number>>((acc, a) => {
		const status = a.result?.status || 'unknown';
		acc[status] = (acc[status] || 0) + 1;
		return acc;
	}, {});
	const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

	return (
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
				gap: '1.5rem',
				marginBottom: '1.5rem',
			}}
		>
			{barData.length > 0 && (
				<div
					style={{
						background: '#fff',
						borderRadius: '1rem',
						border: '1px solid #e5e7eb',
						padding: '1.25rem',
						boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
					}}
				>
					<h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
						Activity Types
					</h3>
					<ResponsiveContainer width="100%" height={240}>
						<BarChart data={barData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
							<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
							<XAxis dataKey="name" tick={{ fontSize: 11 }} />
							<YAxis tick={{ fontSize: 11 }} />
							<Tooltip />
							<Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>
			)}
			{pieData.length > 0 && (
				<div
					style={{
						background: '#fff',
						borderRadius: '1rem',
						border: '1px solid #e5e7eb',
						padding: '1.25rem',
						boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
					}}
				>
					<h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
						Result Status
					</h3>
					<ResponsiveContainer width="100%" height={240}>
						<PieChart>
							<Pie
								data={pieData}
								dataKey="value"
								nameKey="name"
								cx="50%"
								cy="50%"
								outerRadius={80}
								label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
							>
								{pieData.map((_, i) => (
									<Cell key={i} fill={COLORS[i % COLORS.length]} />
								))}
							</Pie>
							<Tooltip />
							<Legend />
						</PieChart>
					</ResponsiveContainer>
				</div>
			)}
		</div>
	);
}
