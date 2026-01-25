/**
 * ========================================================================
 * MENU VERSION V3 - PHASE 1-3 INTEGRATION UPDATE
 * ========================================================================
 *
 * This file extends the original DragDropSidebar to add the Security & Management 
 * section with Feature Flags Admin for managing Phase 1-3 OIDC integrations.
 *
 * Changes from V1:
 * - Added Security & Management section
 * - Added Feature Flags Admin item
 * - Added proper badges for Phase 1-3 features
 *
 * Version: V3 (Phase 1-3 Integration)
 * ========================================================================
 */

import React, { useMemo } from 'react';
import { FiShield, FiSettings, FiEye, FiFileText } from 'react-icons/fi';
import DragDropSidebar from './DragDropSidebar';
import type { DragDropSidebarProps } from './DragDropSidebar';

// Migration badge component
const MigrationBadge = ({ $color = '#10b981', title, children }: { $color?: string; title?: string; children: React.ReactNode }) => (
	<span
		style={{
			background: $color,
			color: 'white',
			padding: '0.125rem 0.375rem',
			borderRadius: '0.25rem',
			fontSize: '0.625rem',
			fontWeight: '600',
			marginLeft: '0.5rem',
			textTransform: 'uppercase',
		}}
		title={title}
	>
		{children}
	</span>
);

// Enhanced DragDropSidebar with Phase 1-3 Security Management
const DragDropSidebarV3: React.FC<DragDropSidebarProps> = (props) => {
	// Get the original menu items from the parent component's state
	const originalGetMenuItems = DragDropSidebar.getMenuItems as (openMenusState: Record<string, boolean>) => any[];
	
	// Enhanced menu items with Security & Management section
	const enhancedGetMenuItems = (openMenusState: Record<string, boolean>) => {
		const originalItems = originalGetMenuItems(openMenusState);
		
		// Check if Security & Management already exists
		const existingSecurityIndex = originalItems.findIndex(
			(group: any) => group.label === 'Security & Management'
		);

		const securityManagementSection = {
			id: 'security-management',
			label: 'Security & Management',
			icon: <FiShield />,
			isOpen: openMenusState['Security & Management'] || false,
			items: [
				{
					id: 'feature-flags-admin',
					path: '/admin/feature-flags',
					label: '⚙️ Feature Flags Admin',
					icon: <FiSettings />,
					badge: (
						<MigrationBadge $color="#3b82f6" title="Control Phase 1-3 OIDC services rollout">
							NEW
						</MigrationBadge>
					),
				},
				{
					id: 'token-monitoring-dashboard',
					path: '/v8u/token-monitoring',
					label: '🔍 Token Monitoring',
					icon: <FiEye />,
					badge: (
						<MigrationBadge $color="#10b981" title="Real-time token monitoring and management">
							NEW
						</MigrationBadge>
					),
				},
				{
					id: 'security-audit-log',
					path: '/admin/security-audit',
					label: '📋 Security Audit Log',
					icon: <FiFileText />,
					badge: (
						<MigrationBadge $color="#f59e0b" title="Security events and audit trail">
							BETA
						</MigrationBadge>
					),
				},
			],
		};

		if (existingSecurityIndex >= 0) {
			// Replace existing Security & Management section
			const enhancedItems = [...originalItems];
			enhancedItems[existingSecurityIndex] = securityManagementSection;
			return enhancedItems;
		} else {
			// Add Security & Management section before Documentation
			const documentationIndex = originalItems.findIndex(
				(group: any) => group.label === 'Documentation'
			);
			
			const enhancedItems = [...originalItems];
			enhancedItems.splice(
				documentationIndex >= 0 ? documentationIndex : enhancedItems.length - 1,
				0,
				securityManagementSection
			);
			return enhancedItems;
		}
	};

	// Override the getMenuItems method for this instance
	const enhancedProps = {
		...props,
		getMenuItems: enhancedGetMenuItems,
	};

	return <DragDropSidebar {...enhancedProps} />;
};

// Export static method to get menu items (for compatibility)
DragDropSidebarV3.getMenuItems = (openMenusState: Record<string, boolean>) => {
	const originalItems = DragDropSidebar.getMenuItems(openMenusState);
	
	// Add Security & Management section
	const securityManagementSection = {
		id: 'security-management',
		label: 'Security & Management',
		icon: <FiShield />,
		isOpen: openMenusState['Security & Management'] || false,
		items: [
			{
				id: 'feature-flags-admin',
				path: '/admin/feature-flags',
				label: '⚙️ Feature Flags Admin',
				icon: <FiSettings />,
				badge: (
					<MigrationBadge $color="#3b82f6" title="Control Phase 1-3 OIDC services rollout">
						NEW
					</MigrationBadge>
				),
			},
			{
				id: 'token-monitoring-dashboard',
				path: '/v8u/token-monitoring',
				label: '🔍 Token Monitoring',
				icon: <FiEye />,
				badge: (
					<MigrationBadge $color="#10b981" title="Real-time token monitoring and management">
						NEW
					</MigrationBadge>
				),
			},
			{
				id: 'security-audit-log',
				path: '/admin/security-audit',
				label: '📋 Security Audit Log',
				icon: <FiFileText />,
				badge: (
					<MigrationBadge $color="#f59e0b" title="Security events and audit trail">
						BETA
					</MigrationBadge>
				),
			},
		],
	};

	// Check if Security & Management already exists
	const existingSecurityIndex = originalItems.findIndex(
		(group: any) => group.label === 'Security & Management'
	);

	if (existingSecurityIndex >= 0) {
		// Replace existing Security & Management section
		const enhancedItems = [...originalItems];
		enhancedItems[existingSecurityIndex] = securityManagementSection;
		return enhancedItems;
	} else {
		// Add Security & Management section before Documentation
		const documentationIndex = originalItems.findIndex(
			(group: any) => group.label === 'Documentation'
		);
		
		const enhancedItems = [...originalItems];
		enhancedItems.splice(
			documentationIndex >= 0 ? documentationIndex : enhancedItems.length - 1,
			0,
			securityManagementSection
		);
		return enhancedItems;
	}
};

export default DragDropSidebarV3;
