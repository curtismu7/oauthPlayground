/**
 * Ping UI sidebar menu — uses shared config, MDI icons, blue active state, collapsible groups.
 * Supports resizing (via Sidebar) and drag-and-drop reorder when dragMode is on.
 * See docs/updates-to-apps/MENU_PING_UI_PLAN.md and src/config/sidebarMenuConfig.ts.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
	getSidebarMenuGroupsWithVersionBadges,
	type SidebarMenuGroup,
	type SidebarMenuItem,
} from '../config/sidebarMenuConfig';
import { logger } from '../utils/logger';
import { Icon } from './Icon/Icon';
import { renderVersionBadge } from './VersionBadgeService';

const PING_MENU_STORAGE_KEY = 'sidebarPing.menuOrder';
const HIDDEN_ITEMS_STORAGE_KEY = 'sidebarPing.hiddenItems';
// v7: restructured mock flows into OIDC / OAuth 2.0 / Unsupported groups
const PING_MENU_VERSION = '8';

function loadHiddenItems(): Set<string> {
	try {
		const raw = localStorage.getItem(HIDDEN_ITEMS_STORAGE_KEY);
		if (!raw) return new Set();
		const arr = JSON.parse(raw) as string[];
		return Array.isArray(arr) ? new Set(arr) : new Set();
	} catch {
		return new Set();
	}
}

function saveHiddenItems(hidden: Set<string>): void {
	try {
		localStorage.setItem(HIDDEN_ITEMS_STORAGE_KEY, JSON.stringify([...hidden]));
	} catch (e) {
		logger.warn('SidebarMenuPing', 'Failed to save hidden items', { error: e });
	}
}

const GROUP_ICON: Record<string, string> = {
	dashboard: 'chart-box',
	'setup-configuration': 'cog',
	'mock-flows': 'alert-box',
	'oidc-mock': 'account-key',
	'oauth-2-mock': 'lock',
	'unsupported-flows': 'alert-circle-outline',
	'unified-production-flows': 'flash',
	'flow-tools': 'tool',
	'tokens-session': 'key-chain',
	'documentation-reference': 'book-open-variant',
	'artificial-intelligence': 'robot',
	'ai-ping': 'robot',
	'developer-tools': 'code-tags',
	'admin-platform': 'account-cog',
};

const DEFAULT_ITEM_ICON = 'page-next-outline';

/** Full item snapshot stored in localStorage. */
interface StoredItem {
	id: string;
	path: string;
	label: string;
	migratedToV9?: boolean;
}

/** Full group snapshot stored in localStorage — captures placement and order. */
interface StoredGroup {
	id: string;
	label: string;
	items: StoredItem[];
	subGroups?: StoredGroup[];
}

function serializeGroups(groups: SidebarMenuGroup[]): StoredGroup[] {
	return groups.map((g) => ({
		id: g.id,
		label: g.label,
		items: g.items.map((i) => ({
			id: i.id,
			path: i.path,
			label: i.label,
			...(i.migratedToV9 !== undefined && { migratedToV9: i.migratedToV9 }),
		})),
		subGroups: g.subGroups?.length ? serializeGroups(g.subGroups) : undefined,
	}));
}

/**
 * Restore menu from storage.
 * - Config is the authoritative source for item data (labels/paths/badges stay fresh).
 * - Items are looked up globally across all groups so cross-group placements are honoured.
 * - New groups/items added to the config are appended to their default locations.
 * - Items no longer in the config are silently dropped.
 */
function restoreGroups(
	stored: StoredGroup[],
	defaultGroups: SidebarMenuGroup[]
): SidebarMenuGroup[] {
	// Build a global id → SidebarMenuItem map from the current config
	const configItems = new Map<string, SidebarMenuItem>();
	for (const g of defaultGroups) {
		for (const it of g.items) configItems.set(it.id, it);
		for (const sg of g.subGroups ?? []) {
			for (const it of sg.items) configItems.set(it.id, it);
		}
	}

	const placed = new Set<string>();

	// Rebuild groups following the saved order; items are resolved globally
	const restored = stored
		.map((sg) => {
			const defaultGroup = defaultGroups.find((g) => g.id === sg.id);
			const baseGroup = defaultGroup ?? {
				id: sg.id,
				label: sg.label,
				items: [] as SidebarMenuItem[],
				subGroups: undefined,
			};
			const items = sg.items
				.filter((si) => !placed.has(si.id) && configItems.has(si.id))
				.map((si) => {
					placed.add(si.id);
					return configItems.get(si.id)!; // always use fresh config data
				});

			if (!defaultGroup && items.length === 0) return null; // ghost group, all items gone
			return { ...baseGroup, items, subGroups: defaultGroup?.subGroups };
		})
		.filter(Boolean) as SidebarMenuGroup[];

	// Index restored groups for fast lookup
	const restoredMap = new Map(restored.map((g) => [g.id, g]));

	// Append new config items/groups that haven't been placed yet
	for (const dg of defaultGroups) {
		const existing = restoredMap.get(dg.id);
		if (!existing) {
			// Brand-new group — add entirely (only unplaced items)
			const newItems = dg.items.filter((it) => !placed.has(it.id));
			for (const it of newItems) placed.add(it.id);
			if (newItems.length > 0 || (dg.subGroups?.length ?? 0) > 0) {
				restored.push({ ...dg, items: newItems });
			}
		} else {
			// Existing group — append any items newly added to the config
			for (const it of dg.items) {
				if (!placed.has(it.id)) {
					existing.items.push(it);
					placed.add(it.id);
				}
			}
		}
	}

	return restored;
}

function getInitialGroups(): SidebarMenuGroup[] {
	try {
		const version = localStorage.getItem('sidebarPing.menuVersion');
		if (version !== PING_MENU_VERSION) return getSidebarMenuGroupsWithVersionBadges();
		const raw = localStorage.getItem(PING_MENU_STORAGE_KEY);
		if (!raw) return getSidebarMenuGroupsWithVersionBadges();
		const stored = JSON.parse(raw) as StoredGroup[];
		if (!Array.isArray(stored)) return getSidebarMenuGroupsWithVersionBadges();
		return restoreGroups(stored, getSidebarMenuGroupsWithVersionBadges());
	} catch {
		return getSidebarMenuGroupsWithVersionBadges();
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
	onHideItem,
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
	onHideItem?: (itemId: string) => void;
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
			onContextMenu={
				onHideItem
					? (e) => {
							e.preventDefault();
							onHideItem(item.id);
						}
					: undefined
			}
			title={onHideItem ? 'Right-click to hide from menu' : undefined}
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
			{renderVersionBadge(item)}
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
	hiddenItems,
	onHideItem,
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
	hiddenItems?: Set<string>;
	onHideItem?: (itemId: string) => void;
}) {
	const visibleItems = hiddenItems
		? group.items.filter((i) => !hiddenItems.has(i.id))
		: group.items;
	const countVisible = (g: SidebarMenuGroup): number =>
		(g.items.filter((i) => !hiddenItems?.has(i.id)).length ?? 0) +
		(g.subGroups?.reduce((acc, sg) => acc + countVisible(sg), 0) ?? 0);
	const visibleSubGroups = hiddenItems
		? group.subGroups?.filter((sg) => countVisible(sg) > 0)
		: group.subGroups;
	return (
		<ul
			className={`sidebar-ping__group-items ${indent ? 'sidebar-ping__group-items--nested' : ''}`}
		>
			{visibleItems.map((item, idx) => (
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
					onHideItem={onHideItem}
				/>
			))}
			{visibleSubGroups?.map((sub) => (
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
						hiddenItems={hiddenItems}
						onHideItem={onHideItem}
					/>
				</li>
			))}
			{/* Trailing drop slot — allows dropping after the last item */}
			{dragMode && (
				<li
					className={`sidebar-ping__drop-trail${
						dropTargetItem?.groupId === groupId && dropTargetItem?.index === group.items.length
							? ' sidebar-ping__drop-trail--active'
							: ''
					}`}
					onDragOver={(e) => {
						e.preventDefault();
						e.dataTransfer.dropEffect = 'move';
						onItemDragOver?.(groupId, group.items.length);
					}}
					onDrop={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onItemDrop?.(e, groupId, group.items.length);
					}}
				/>
			)}
		</ul>
	);
}

/** Build flat map of item id -> item for all items in groups */
function buildItemMap(groups: SidebarMenuGroup[]): Map<string, SidebarMenuItem> {
	const map = new Map<string, SidebarMenuItem>();
	const add = (g: SidebarMenuGroup) => {
		for (const i of g.items) map.set(i.id, i);
		for (const sg of g.subGroups ?? []) add(sg);
	};
	for (const g of groups) add(g);
	return map;
}

export const SidebarMenuPing: React.FC<{ dragMode?: boolean; searchQuery?: string }> = ({
	dragMode = false,
	searchQuery = '',
}) => {
	const { pathname, search } = useLocation();
	const [menuGroups, setMenuGroups] = useState<SidebarMenuGroup[]>(getInitialGroups);
	const [hiddenItems, setHiddenItems] = useState<Set<string>>(loadHiddenItems);
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
			logger.warn('SidebarMenuPing', 'SidebarMenuPing: failed to save order', { error: e });
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

	const handleHideItem = useCallback((itemId: string) => {
		setHiddenItems((prev) => {
			const next = new Set(prev);
			next.add(itemId);
			saveHiddenItems(next);
			return next;
		});
	}, []);

	const handleUnhideItem = useCallback((itemId: string) => {
		setHiddenItems((prev) => {
			const next = new Set(prev);
			next.delete(itemId);
			saveHiddenItems(next);
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

	// Find item in group (main items or any subGroup) and remove it; returns [removedItem, nextGroups] or null.
	function findAndRemoveItem(
		groups: SidebarMenuGroup[],
		groupId: string,
		itemId: string
	): { item: SidebarMenuItem; next: SidebarMenuGroup[] } | null {
		const next = groups.map((g) => ({
			...g,
			items: [...g.items],
			subGroups: g.subGroups?.map((sg) => ({ ...sg, items: [...sg.items] })),
		}));
		const gi = next.findIndex((g) => g.id === groupId);
		if (gi === -1) return null;

		const g = next[gi];
		const srcIdx = g.items.findIndex((i) => i.id === itemId);
		if (srcIdx !== -1) {
			const [item] = g.items.splice(srcIdx, 1);
			return { item, next };
		}
		if (g.subGroups) {
			for (let si = 0; si < g.subGroups.length; si++) {
				const sg = g.subGroups[si];
				const idx = sg.items.findIndex((i) => i.id === itemId);
				if (idx !== -1) {
					const [item] = sg.items.splice(idx, 1);
					return { item, next };
				}
			}
		}
		return null;
	}

	// Unified item drop — handles same-group reorder AND cross-group moves (including from subGroups).
	const handleDropItem = useCallback(
		(e: React.DragEvent, targetGroupId: string, targetIndex: number) => {
			e.preventDefault();
			e.stopPropagation();
			setDropTargetItem(null);
			const data = getDraggedData(e);
			if (!data || data.type !== 'item' || !data.groupId) return;
			setDraggedItem(null);

			const tgtGroupIdx = menuGroups.findIndex((g) => g.id === targetGroupId);
			if (tgtGroupIdx === -1) return;

			const result = findAndRemoveItem(menuGroups, data.groupId, data.id);
			if (!result) return;

			const { item: removed, next } = result;
			const sameGroup = data.groupId === targetGroupId;

			if (sameGroup) {
				// Recompute source index from original (before removal) for same-group adjust
				const srcGroup = menuGroups.find((g) => g.id === data.groupId);
				const srcItemIdx = srcGroup?.items.findIndex((i) => i.id === data.id) ?? -1;
				const inMain = srcItemIdx !== -1;
				const insertAt = inMain
					? targetIndex > srcItemIdx
						? targetIndex - 1
						: targetIndex
					: Math.min(targetIndex, next[tgtGroupIdx].items.length);
				next[tgtGroupIdx].items.splice(Math.max(0, insertAt), 0, removed);
			} else {
				setOpenGroups((prev) => new Set([...prev, targetGroupId]));
				const clampedIndex = Math.min(targetIndex, next[tgtGroupIdx].items.length);
				next[tgtGroupIdx].items.splice(clampedIndex, 0, removed);
			}

			setMenuGroups(next);
			saveOrder(next);
		},
		[menuGroups, getDraggedData, saveOrder]
	);

	// Helper to count visible items in a group (excluding hidden)
	const countVisibleInGroup = useCallback(
		(g: SidebarMenuGroup): number =>
			g.items.filter((i) => !hiddenItems.has(i.id)).length +
			(g.subGroups?.reduce((acc, sg) => acc + countVisibleInGroup(sg), 0) ?? 0),
		[hiddenItems]
	);

	// Search mode: flat filtered list across all groups (excludes hidden items)
	if (searchQuery.trim()) {
		const q = searchQuery.toLowerCase();
		const results: Array<{ item: SidebarMenuItem; groupLabel: string }> = [];
		for (const group of menuGroups) {
			const allItems = [...group.items, ...(group.subGroups?.flatMap((sg) => sg.items) ?? [])];
			for (const item of allItems) {
				if (hiddenItems.has(item.id)) continue;
				if (item.label.toLowerCase().includes(q) || item.path.toLowerCase().includes(q)) {
					results.push({ item, groupLabel: group.label });
				}
			}
		}
		return (
			<nav className="sidebar-ping__nav" aria-label="Main navigation">
				{results.length === 0 ? (
					<div
						style={{
							padding: '1rem',
							color: '#94a3b8',
							fontSize: '0.875rem',
							textAlign: 'center',
						}}
					>
						No results for "{searchQuery}"
					</div>
				) : (
					<ul
						className="sidebar-ping__group-items"
						style={{ listStyle: 'none', margin: 0, padding: 0 }}
					>
						{results.map(({ item, groupLabel }) => (
							<li key={item.id}>
								<Link
									to={item.path}
									className={`sidebar-ping__item ${
										isActive(item.path, pathname, search) ? 'sidebar-ping__item--active' : ''
									}`}
								>
									<span className="sidebar-ping__item-icon" aria-hidden>
										<Icon name={DEFAULT_ITEM_ICON} size="sm" />
									</span>
									<span style={{ flex: 1, minWidth: 0 }}>
										<span className="sidebar-ping__item-label" style={{ display: 'block' }}>
											{item.label}
										</span>
										<span
											style={{
												fontSize: '0.7rem',
												color: '#cbd5e1',
												display: 'block',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
											}}
										>
											{groupLabel}
										</span>
									</span>
								</Link>
							</li>
						))}
					</ul>
				)}
			</nav>
		);
	}

	return (
		<nav className="sidebar-ping__nav" aria-label="Main navigation">
			{dragMode && (
				<output className="sidebar-ping__drag-hint" aria-live="polite">
					Drag sections or items to reorder. Order is saved automatically.
				</output>
			)}
			{menuGroups.map((group, groupIndex) => {
				// Hide Mock Flows section on unified flow pages so the UI shows no mock entries
				if (pathname.startsWith('/v8u/unified') && group.id === 'mock-flows') return null;

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
										onDrop={(e) => handleDropItem(e, group.id, 0)}
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
						<div
							role="group"
							className="sidebar-ping__group"
							onDragOver={
								dragMode && draggedItem?.type === 'item'
									? (e) => {
											e.preventDefault();
											e.dataTransfer.dropEffect = 'move';
											e.stopPropagation();
										}
									: undefined
							}
							onDrop={
								dragMode && draggedItem?.type === 'item'
									? (e) => {
											e.preventDefault();
											e.stopPropagation();
											const countMain = group.items.length;
											handleDropItem(e, group.id, countMain);
										}
									: undefined
							}
						>
							<div
								className="sidebar-ping__group-header-wrap"
								onDragOver={
									dragMode && draggedItem?.type === 'item'
										? (e) => {
												e.preventDefault();
												e.dataTransfer.dropEffect = 'move';
												e.stopPropagation();
											}
										: undefined
								}
								onDrop={
									dragMode && draggedItem?.type === 'item'
										? (e) => {
												e.preventDefault();
												e.stopPropagation();
												handleDropItem(e, group.id, group.items.length);
											}
										: undefined
								}
							>
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
										onItemDrop={(e, gid, idx) => handleDropItem(e, gid, idx)}
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
