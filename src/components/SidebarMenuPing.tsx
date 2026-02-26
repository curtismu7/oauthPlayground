/**
 * Ping UI sidebar menu — uses shared config, MDI icons, blue active state, collapsible groups.
 * Supports resizing (via Sidebar) and drag-and-drop reorder when dragMode is on.
 * See docs/updates-to-apps/MENU_PING_UI_PLAN.md and src/config/sidebarMenuConfig.ts.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
	SIDEBAR_MENU_GROUPS,
	type SidebarMenuGroup,
	type SidebarMenuItem,
} from '../config/sidebarMenuConfig';
import { Icon } from './Icon/Icon';

const PING_MENU_STORAGE_KEY = 'sidebarPing.menuOrder';
const PING_MENU_VERSION = '1';

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

/** Serializable order for persistence (group ids and item ids only). */
interface SerializedGroup {
	id: string;
	items: Array<{ id: string }>;
	subGroups?: SerializedGroup[];
}

function serializeGroups(groups: SidebarMenuGroup[]): SerializedGroup[] {
	return groups.map((g) => ({
		id: g.id,
		items: g.items.map((i) => ({ id: i.id })),
		subGroups: g.subGroups?.length ? serializeGroups(g.subGroups) : undefined,
	}));
}

/** Restore group order from saved; fill in full item data from default groups. */
function restoreGroups(
	saved: SerializedGroup[],
	defaultGroups: SidebarMenuGroup[]
): SidebarMenuGroup[] {
	return saved
		.map((savedGroup) => {
			const defaultGroup = defaultGroups.find((g) => g.id === savedGroup.id);
			if (!defaultGroup) return null;
			const seenIds = new Set<string>();
			const items = savedGroup.items
				.map((savedItem) => {
					if (seenIds.has(savedItem.id)) return null;
					seenIds.add(savedItem.id);
					const found =
						defaultGroup.items.find((i) => i.id === savedItem.id) ||
						defaultGroup.subGroups?.flatMap((sg) => sg.items).find((i) => i.id === savedItem.id);
					return found ?? null;
				})
				.filter(Boolean) as SidebarMenuItem[];
			// Append any default items not in saved
			for (const it of defaultGroup.items) {
				if (!seenIds.has(it.id)) items.push(it);
			}
			for (const sg of defaultGroup.subGroups ?? []) {
				for (const it of sg.items) {
					if (!seenIds.has(it.id)) items.push(it);
				}
			}
			let subGroups: SidebarMenuGroup[] | undefined;
			if (defaultGroup.subGroups?.length && savedGroup.subGroups?.length) {
				subGroups = restoreGroups(savedGroup.subGroups, defaultGroup.subGroups);
			} else {
				subGroups = defaultGroup.subGroups;
			}
			return { ...defaultGroup, items, subGroups };
		})
		.filter(Boolean) as SidebarMenuGroup[];
}

function getInitialGroups(): SidebarMenuGroup[] {
	try {
		const version = localStorage.getItem('sidebarPing.menuVersion');
		if (version !== PING_MENU_VERSION) return [...SIDEBAR_MENU_GROUPS];
		const raw = localStorage.getItem(PING_MENU_STORAGE_KEY);
		if (!raw) return [...SIDEBAR_MENU_GROUPS];
		const saved = JSON.parse(raw) as SerializedGroup[];
		if (!Array.isArray(saved)) return [...SIDEBAR_MENU_GROUPS];
		return restoreGroups(saved, SIDEBAR_MENU_GROUPS);
	} catch {
		return [...SIDEBAR_MENU_GROUPS];
	}
}

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
	dragMode,
	draggable,
	groupId,
	itemIndex,
	dropTargetItem,
	onDragOverItem,
	onDragStart,
	onDragEnd,
	onDragOver,
	onDrop,
}: {
	item: SidebarMenuItem;
	pathname: string;
	search: string;
	dragMode?: boolean;
	draggable?: boolean;
	groupId: string;
	itemIndex: number;
	dropTargetItem?: { groupId: string; index: number } | null;
	onDragOverItem?: (groupId: string, index: number) => void;
	onDragStart?: (e: React.DragEvent, itemId: string, groupId: string, subGroupId?: string) => void;
	onDragEnd?: (e: React.DragEvent) => void;
	onDragOver?: (e: React.DragEvent) => void;
	onDrop?: (e: React.DragEvent, groupId: string, itemIndex: number, subGroupId?: string) => void;
}) {
	const active = isActive(item.path, pathname, search);
	const showDropLine =
		dragMode && dropTargetItem?.groupId === groupId && dropTargetItem?.index === itemIndex;
	const link = (
		<Link
			to={item.path}
			className={`sidebar-ping__item ${active ? 'sidebar-ping__item--active' : ''}`}
			aria-current={active ? 'page' : undefined}
			onClick={dragMode ? (e) => e.preventDefault() : undefined}
		>
			{dragMode && (
				<span className="sidebar-ping__drag-handle" aria-hidden title="Drag to reorder">
					<Icon name="drag" size="sm" />
				</span>
			)}
			<span className="sidebar-ping__item-icon" aria-hidden>
				<Icon name={DEFAULT_ITEM_ICON} size="sm" />
			</span>
			<span className="sidebar-ping__item-label">{item.label}</span>
		</Link>
	);
	const handleDragOver = (e: React.DragEvent) => {
		onDragOver?.(e);
		onDragOverItem?.(groupId, itemIndex);
	};
	if (dragMode && draggable) {
		return (
			<li
				draggable
				onDragStart={(e) => {
					e.stopPropagation();
					onDragStart?.(e, item.id, groupId, undefined);
				}}
				onDragEnd={onDragEnd}
				onDragOver={handleDragOver}
				onDrop={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onDrop?.(e, groupId, itemIndex);
				}}
				className="sidebar-ping__draggable-item"
			>
				{showDropLine && <div className="sidebar-ping__drop-line" aria-hidden />}
				{link}
			</li>
		);
	}
	return (
		<li>
			{showDropLine && <div className="sidebar-ping__drop-line" aria-hidden />}
			{link}
		</li>
	);
}

function GroupContent({
	group,
	pathname,
	search,
	indent,
	dragMode,
	groupId,
	dropTargetItem,
	onItemDragOver,
	onItemDragStart,
	onItemDragEnd,
	onItemDragOverHandler,
	onItemDrop,
}: {
	group: SidebarMenuGroup;
	pathname: string;
	search: string;
	indent?: boolean;
	dragMode?: boolean;
	groupId: string;
	dropTargetItem?: { groupId: string; index: number } | null;
	onItemDragOver?: (groupId: string, index: number) => void;
	onItemDragStart?: (e: React.DragEvent, itemId: string, gid: string, subGroupId?: string) => void;
	onItemDragEnd?: (e: React.DragEvent) => void;
	onItemDragOverHandler?: (e: React.DragEvent) => void;
	onItemDrop?: (e: React.DragEvent, gid: string, itemIndex: number, subGroupId?: string) => void;
}) {
	return (
		<ul
			className={`sidebar-ping__group-items ${indent ? 'sidebar-ping__group-items--nested' : ''}`}
		>
			{group.items.map((item, idx) => (
				<MenuItemLink
					key={item.id}
					item={item}
					pathname={pathname}
					search={search}
					dragMode={dragMode}
					draggable={dragMode}
					groupId={groupId}
					itemIndex={idx}
					dropTargetItem={dropTargetItem}
					onDragOverItem={onItemDragOver}
					onDragStart={onItemDragStart}
					onDragEnd={onItemDragEnd}
					onDragOver={onItemDragOverHandler}
					onDrop={onItemDrop}
				/>
			))}
			{group.subGroups?.map((sub) => (
				<li key={sub.id}>
					<GroupContent
						group={sub}
						pathname={pathname}
						search={search}
						indent
						dragMode={dragMode}
						groupId={groupId}
						dropTargetItem={dropTargetItem}
						onItemDragOver={onItemDragOver}
						onItemDragStart={onItemDragStart}
						onItemDragEnd={onItemDragEnd}
						onItemDragOverHandler={onItemDragOverHandler}
						onItemDrop={onItemDrop}
					/>
				</li>
			))}
		</ul>
	);
}

export const SidebarMenuPing: React.FC<{ dragMode?: boolean }> = ({ dragMode = false }) => {
	const { pathname, search } = useLocation();
	const [menuGroups, setMenuGroups] = useState<SidebarMenuGroup[]>(getInitialGroups);
	const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
		const initial = new Set<string>();
		for (const g of menuGroups) initial.add(g.id);
		return initial;
	});
	const [draggedItem, setDraggedItem] = useState<{
		type: 'group' | 'item';
		id: string;
		groupId?: string;
		subGroupId?: string;
	} | null>(null);
	const [dropTargetGroupIndex, setDropTargetGroupIndex] = useState<number | null>(null);
	const [dropTargetItem, setDropTargetItem] = useState<{ groupId: string; index: number } | null>(
		null
	);

	// Keep openGroups in sync when menuGroups change (e.g. after restore)
	useEffect(() => {
		setOpenGroups((prev) => {
			const next = new Set(prev);
			for (const g of menuGroups) next.add(g.id);
			return next;
		});
	}, [menuGroups]);

	const saveOrder = useCallback((groups: SidebarMenuGroup[]) => {
		try {
			localStorage.setItem(PING_MENU_STORAGE_KEY, JSON.stringify(serializeGroups(groups)));
			localStorage.setItem('sidebarPing.menuVersion', PING_MENU_VERSION);
		} catch (e) {
			console.warn('SidebarMenuPing: failed to save order', e);
		}
	}, []);

	const toggleGroup = useCallback((id: string) => {
		setOpenGroups((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const getDraggedData = useCallback(
		(e: React.DragEvent) => {
			if (draggedItem) return draggedItem;
			try {
				const raw =
					e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
				if (raw) return JSON.parse(raw) as typeof draggedItem;
			} catch {}
			return null;
		},
		[draggedItem]
	);

	const handleDragStart = useCallback(
		(
			e: React.DragEvent,
			type: 'group' | 'item',
			id: string,
			groupId?: string,
			subGroupId?: string
		) => {
			const data = { type, id, groupId, subGroupId };
			setDraggedItem(data);
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('application/json', JSON.stringify(data));
			e.dataTransfer.setData('text/plain', JSON.stringify(data));
			(e.currentTarget as HTMLElement).style.opacity = '0.5';
		},
		[]
	);

	const handleDragEnd = useCallback((e: React.DragEvent) => {
		(e.currentTarget as HTMLElement).style.opacity = '1';
		setDraggedItem(null);
		setDropTargetGroupIndex(null);
		setDropTargetItem(null);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	}, []);

	const handleDropGroupReorder = useCallback(
		(e: React.DragEvent, targetIndex: number) => {
			e.preventDefault();
			e.stopPropagation();
			setDropTargetGroupIndex(null);
			const data = getDraggedData(e);
			if (!data || data.type !== 'group') return;
			setDraggedItem(null);
			const srcIndex = menuGroups.findIndex((g) => g.id === data.id);
			if (srcIndex === -1 || srcIndex === targetIndex) return;
			const next = [...menuGroups];
			const [removed] = next.splice(srcIndex, 1);
			next.splice(targetIndex, 0, removed);
			setMenuGroups(next);
			saveOrder(next);
		},
		[menuGroups, getDraggedData, saveOrder]
	);

	// Item reorder within same group (drop before target index).
	const handleDropOnItemSameGroup = useCallback(
		(groupId: string, targetIndex: number) => {
			const data = draggedItem;
			if (!data || data.type !== 'item') return;
			setDropTargetItem(null);
			const groupIdx = menuGroups.findIndex((g) => g.id === groupId);
			if (groupIdx === -1) return;
			const group = menuGroups[groupIdx];
			const srcIdx = group.items.findIndex((i) => i.id === data.id);
			if (srcIdx === -1) return;
			const next = [...menuGroups];
			const items = [...next[groupIdx].items];
			const [removed] = items.splice(srcIdx, 1);
			const insertAt = targetIndex > srcIdx ? targetIndex - 1 : targetIndex;
			items.splice(insertAt, 0, removed);
			next[groupIdx] = { ...next[groupIdx], items };
			setMenuGroups(next);
			saveOrder(next);
			setDraggedItem(null);
		},
		[menuGroups, draggedItem, saveOrder]
	);

	return (
		<nav className="sidebar-ping__nav" aria-label="Main navigation">
			{dragMode && (
				<output className="sidebar-ping__drag-hint" aria-live="polite">
					Drag sections or items to reorder. Order is saved automatically.
				</output>
			)}
			{menuGroups.map((group, groupIndex) => {
				const hasSub = (group.subGroups?.length ?? 0) > 0 || group.items.length > 1;
				const isOpen = openGroups.has(group.id);
				const iconName = GROUP_ICON[group.id] ?? 'folder-outline';

				if (group.items.length === 0 && !group.subGroups?.length) return null;

				if (!hasSub && group.items.length === 1) {
					return (
						<React.Fragment key={group.id}>
							{dragMode && (
								// biome-ignore lint/a11y/useSemanticElements: drop zone is not a form fieldset
								<div
									role="group"
									className={`sidebar-ping__drop-zone sidebar-ping__drop-zone--group ${
										dropTargetGroupIndex === groupIndex && draggedItem?.type === 'group'
											? 'sidebar-ping__drop-zone--active'
											: ''
									}`}
									onDragOver={(e) => {
										e.preventDefault();
										e.dataTransfer.dropEffect = 'move';
										if (draggedItem?.type === 'group') setDropTargetGroupIndex(groupIndex);
									}}
									onDragLeave={() => setDropTargetGroupIndex(null)}
									onDrop={(e) => {
										e.preventDefault();
										handleDropGroupReorder(e, groupIndex);
									}}
								/>
							)}
							{/* biome-ignore lint/a11y/useSemanticElements: draggable group wrapper, not a form fieldset */}
							<div
								role="group"
								className="sidebar-ping__group"
								draggable={dragMode}
								onDragStart={dragMode ? (e) => handleDragStart(e, 'group', group.id) : undefined}
								onDragEnd={dragMode ? handleDragEnd : undefined}
								onDragOver={dragMode ? handleDragOver : undefined}
								onDrop={
									dragMode
										? (e) => {
												e.preventDefault();
												handleDropGroupReorder(e, groupIndex);
											}
										: undefined
								}
							>
								<ul className="sidebar-ping__group-items">
									<MenuItemLink
										item={group.items[0]}
										pathname={pathname}
										search={search}
										dragMode={dragMode}
										draggable={dragMode}
										groupId={group.id}
										itemIndex={0}
										dropTargetItem={dropTargetItem}
										onDragOverItem={(gid, idx) => setDropTargetItem({ groupId: gid, index: idx })}
										onDragStart={(e) => handleDragStart(e, 'item', group.items[0].id, group.id)}
										onDragEnd={handleDragEnd}
										onDragOver={handleDragOver}
										onDrop={(_e) => handleDropOnItemSameGroup(group.id, 0)}
									/>
								</ul>
							</div>
						</React.Fragment>
					);
				}

				return (
					<React.Fragment key={group.id}>
						{dragMode && (
							// biome-ignore lint/a11y/useSemanticElements: drop zone is not a form fieldset
							<div
								role="group"
								className={`sidebar-ping__drop-zone sidebar-ping__drop-zone--group ${
									dropTargetGroupIndex === groupIndex && draggedItem?.type === 'group'
										? 'sidebar-ping__drop-zone--active'
										: ''
								}`}
								onDragOver={(e) => {
									e.preventDefault();
									e.dataTransfer.dropEffect = 'move';
									if (draggedItem?.type === 'group') setDropTargetGroupIndex(groupIndex);
								}}
								onDragLeave={() => setDropTargetGroupIndex(null)}
								onDrop={(e) => handleDropGroupReorder(e, groupIndex)}
							/>
						)}
						{/* biome-ignore lint/a11y/useSemanticElements: group wrapper for collapsible section, not form fieldset */}
						<div role="group" className="sidebar-ping__group">
							<div className="sidebar-ping__group-header-wrap">
								{dragMode && (
									<span
										className="sidebar-ping__drag-handle"
										aria-hidden
										draggable
										onDragStart={(e) => {
											e.stopPropagation();
											handleDragStart(e, 'group', group.id);
										}}
										onDragEnd={handleDragEnd}
										onDragOver={handleDragOver}
										title="Drag to reorder section"
									>
										<Icon name="drag" size="sm" />
									</span>
								)}
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
							</div>
							{isOpen && (
								<section
									id={`sidebar-group-${group.id}`}
									aria-labelledby={`sidebar-group-btn-${group.id}`}
								>
									<GroupContent
										group={group}
										pathname={pathname}
										search={search}
										dragMode={dragMode}
										groupId={group.id}
										dropTargetItem={dropTargetItem}
										onItemDragOver={(gid, idx) => setDropTargetItem({ groupId: gid, index: idx })}
										onItemDragStart={(e, itemId) => handleDragStart(e, 'item', itemId, group.id)}
										onItemDragEnd={handleDragEnd}
										onItemDragOverHandler={handleDragOver}
										onItemDrop={(_e, gid, idx) => handleDropOnItemSameGroup(gid, idx)}
									/>
								</section>
							)}
						</div>
					</React.Fragment>
				);
			})}
			{dragMode && menuGroups.length > 0 && (
				// biome-ignore lint/a11y/useSemanticElements: drop zone is not a form fieldset
				<div
					role="group"
					className={`sidebar-ping__drop-zone sidebar-ping__drop-zone--group ${
						dropTargetGroupIndex === menuGroups.length && draggedItem?.type === 'group'
							? 'sidebar-ping__drop-zone--active'
							: ''
					}`}
					onDragOver={(e) => {
						e.preventDefault();
						e.dataTransfer.dropEffect = 'move';
						if (draggedItem?.type === 'group') setDropTargetGroupIndex(menuGroups.length);
					}}
					onDragLeave={() => setDropTargetGroupIndex(null)}
					onDrop={(e) => handleDropGroupReorder(e, menuGroups.length)}
				/>
			)}
		</nav>
	);
};

export default SidebarMenuPing;
