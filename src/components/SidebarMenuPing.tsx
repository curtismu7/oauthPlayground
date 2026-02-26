/**
 * Ping UI sidebar menu — uses shared config, MDI icons, blue active state, collapsible groups.
 * See docs/MENU_PING_UI_PLAN.md and src/config/sidebarMenuConfig.ts.
 */

import React, { useCallback, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
	SIDEBAR_MENU_GROUPS,
	type SidebarMenuGroup,
	type SidebarMenuItem,
} from '../config/sidebarMenuConfig';
import { Icon } from './Icon/Icon';

const GROUP_ICON: Record<string, string> = {
	dashboard: 'chart-box',
	'admin-configuration': 'cog',
	'pingone-platform': 'account-group',
	'unified-production-flows': 'flash',
	'oauth-flows': 'lock',
	'oidc-flows': 'account-key',
	'pingone-flows': 'key',
	'tokens-session': 'key-chain',
	'developer-tools': 'code-tags',
	'education-tutorials': 'school',
	'mock-educational-flows': 'alert-box',
	'ai-ping': 'robot',
	'documentation-reference': 'book-open-variant',
	'oauth-mock-flows': 'file-document-outline',
	'advanced-mock-flows': 'flask-outline',
};

const DEFAULT_ITEM_ICON = 'page-next-outline';

/** Returns whether the current location matches the item path (pathname + search). */
function isActive(path: string, pathname: string, search: string): boolean {
	const full = pathname + search;
	if (path.includes('?')) {
		return (
			full === path || (pathname === path.split('?')[0] && search === `?${path.split('?')[1]}`)
		);
	}
	return pathname === path && !search;
}

function MenuItemLink({
	item,
	pathname,
	search,
}: {
	item: SidebarMenuItem;
	pathname: string;
	search: string;
}) {
	const active = isActive(item.path, pathname, search);
	return (
		<Link
			to={item.path}
			className={`sidebar-ping__item ${active ? 'sidebar-ping__item--active' : ''}`}
			aria-current={active ? 'page' : undefined}
		>
			<span className="sidebar-ping__item-icon" aria-hidden>
				<Icon name={DEFAULT_ITEM_ICON} size="sm" />
			</span>
			<span className="sidebar-ping__item-label">{item.label}</span>
		</Link>
	);
}

function GroupContent({
	group,
	pathname,
	search,
	indent,
}: {
	group: SidebarMenuGroup;
	pathname: string;
	search: string;
	indent?: boolean;
}) {
	return (
		<ul
			className={`sidebar-ping__group-items ${indent ? 'sidebar-ping__group-items--nested' : ''}`}
		>
			{group.items.map((item) => (
				<li key={item.id}>
					<MenuItemLink item={item} pathname={pathname} search={search} />
				</li>
			))}
			{group.subGroups?.map((sub) => (
				<li key={sub.id}>
					<GroupContent group={sub} pathname={pathname} search={search} indent />
				</li>
			))}
		</ul>
	);
}

export const SidebarMenuPing: React.FC = () => {
	const { pathname, search } = useLocation();
	const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
		const initial = new Set<string>();
		for (const g of SIDEBAR_MENU_GROUPS) initial.add(g.id);
		return initial;
	});

	const toggleGroup = useCallback((id: string) => {
		setOpenGroups((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	return (
		<nav className="sidebar-ping__nav" aria-label="Main navigation">
			{SIDEBAR_MENU_GROUPS.map((group) => {
				const hasSub = (group.subGroups?.length ?? 0) > 0 || group.items.length > 1;
				const isOpen = openGroups.has(group.id);
				const iconName = GROUP_ICON[group.id] ?? 'folder-outline';

				if (group.items.length === 0 && !group.subGroups?.length) return null;

				if (!hasSub && group.items.length === 1) {
					return (
						<div key={group.id} className="sidebar-ping__group">
							<ul className="sidebar-ping__group-items">
								<li>
									<MenuItemLink item={group.items[0]} pathname={pathname} search={search} />
								</li>
							</ul>
						</div>
					);
				}

				return (
					<div key={group.id} className="sidebar-ping__group">
						<button
							type="button"
							className="sidebar-ping__group-header"
							onClick={() => toggleGroup(group.id)}
							aria-expanded={isOpen}
							aria-controls={`sidebar-group-${group.id}`}
							id={`sidebar-group-btn-${group.id}`}
						>
							<span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<Icon name={iconName} size="sm" />
								{group.label}
							</span>
							<Icon name="chevron-down" size="sm" className="sidebar-ping__chevron" />
						</button>
						{isOpen && (
							<section
								id={`sidebar-group-${group.id}`}
								aria-labelledby={`sidebar-group-btn-${group.id}`}
							>
								<GroupContent group={group} pathname={pathname} search={search} />
							</section>
						)}
					</div>
				);
			})}
		</nav>
	);
};

export default SidebarMenuPing;
