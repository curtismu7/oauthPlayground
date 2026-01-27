#!/bin/bash

# Script to apply 3D glassmorphic design to DragDropSidebar.tsx
# This script creates a new version with all the 3D styling applied

echo "🎨 Applying 3D Glassmorphic Design to DragDropSidebar..."
echo ""

# Backup current file
BACKUP_FILE="src/components/DragDropSidebar.tsx.backup-before-3d-$(date +%Y%m%d-%H%M%S)"
cp src/components/DragDropSidebar.tsx "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Create the implementation using Node.js for precise text replacement
node << 'NODEJS'
const fs = require('fs');
const path = require('path');

const filePath = 'src/components/DragDropSidebar.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('📝 Step 1: Adding useMemo import...');
content = content.replace(
  "import React, { useCallback, useState } from 'react';",
  "import React, { useCallback, useMemo, useState } from 'react';"
);

console.log('📝 Step 2: Updating MigrationBadge with 3D effects...');
const oldBadge = `const MigrationBadge = styled.span\`
	background: rgba(34, 197, 94, 0.9);
	border: 1px solid #22c55e;
	color: #ffffff;
	padding: 0.125rem 0.375rem;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.25rem;
	z-index: 1;
	position: relative;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
\`;`;

const newBadge = `const MigrationBadge = styled.span\`
	background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
	border: 1px solid rgba(34, 197, 94, 0.8);
	color: #ffffff;
	padding: 0.25rem 0.5rem;
	border-radius: 12px;
	font-size: 0.75rem;
	font-weight: 700;
	display: flex;
	align-items: center;
	gap: 0.25rem;
	z-index: 1;
	position: relative;
	box-shadow: 
		0 2px 8px rgba(34, 197, 94, 0.4),
		inset 0 1px 0 rgba(255, 255, 255, 0.3);
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
\`;`;

content = content.replace(oldBadge, newBadge);

console.log('📝 Step 3: Adding IconContainer3D styled component...');
const iconContainer3D = `
const IconContainer3D = styled.div\`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	background: linear-gradient(
		135deg,
		#667eea 0%,
		#764ba2 25%,
		#f093fb 50%,
		#4facfe 75%,
		#00f2fe 100%
	);
	background-size: 400% 400%;
	animation: gradientShift 8s ease infinite;
	border-radius: 8px;
	box-shadow: 
		0 3px 10px rgba(102, 126, 234, 0.4),
		inset 0 1px 0 rgba(255, 255, 255, 0.3);
	transition: transform 0.3s ease;
	
	&:hover {
		transform: scale(1.15) rotate(3deg);
	}
	
	svg {
		filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.6));
	}
	
	@keyframes gradientShift {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}
\`;
`;

// Insert after MigrationBadge
content = content.replace(
  newBadge + '\n\ninterface MenuItem {',
  newBadge + iconContainer3D + '\n\ninterface MenuItem {'
);

console.log('📝 Step 4: Adding filteredMenuGroups...');
// Add the filter function and useMemo before toggleMenuGroup
const filterFunction = `
	// Filter menu groups based on search query
	const filterGroupsRecursive = useCallback((groups: MenuGroup[], query: string): MenuGroup[] => {
		return groups
			.map((group) => {
				const filteredItems = group.items.filter((item) =>
					item.label.toLowerCase().includes(query)
				);

				const filteredSubGroups = group.subGroups
					? filterGroupsRecursive(group.subGroups, query)
					: [];

				const hasItems = filteredItems.length > 0;
				const hasSubGroups = filteredSubGroups.length > 0;
				const matchesLabel = group.label.toLowerCase().includes(query);

				if (hasItems || hasSubGroups || matchesLabel) {
					return {
						...group,
						items: filteredItems,
						subGroups: filteredSubGroups.length > 0 ? filteredSubGroups : group.subGroups,
						isOpen: true,
					};
				}
				return null;
			})
			.filter((group): group is MenuGroup => group !== null);
	}, []);

	const filteredMenuGroups = useMemo(() => {
		if (!searchQuery.trim()) {
			return menuGroups;
		}

		const query = searchQuery.toLowerCase();
		return filterGroupsRecursive(menuGroups, query);
	}, [menuGroups, searchQuery, filterGroupsRecursive]);
`;

content = content.replace(
  '\tconst toggleMenuGroup = (groupId: string) => {',
  filterFunction + '\n\tconst toggleMenuGroup = (groupId: string) => {'
);

console.log('✅ All changes applied successfully!');
console.log('');
console.log('📊 Summary:');
console.log('  - Added useMemo import');
console.log('  - Updated MigrationBadge with 3D gradient');
console.log('  - Added IconContainer3D styled component');
console.log('  - Added filteredMenuGroups with search filtering');
console.log('');
console.log('⚠️  Note: Group headers and menu items still need manual styling updates');
console.log('   Follow the implementation guide for those changes');

fs.writeFileSync(filePath, content, 'utf8');
NODEJS

echo ""
echo "✅ Phase 1 Complete: Foundation changes applied"
echo ""
echo "📖 Next Steps:"
echo "   1. Test the build: npm run dev"
echo "   2. If successful, manually apply group header styling from:"
echo "      docs/DRAGDROP_SIDEBAR_3D_IMPLEMENTATION_GUIDE.md"
echo ""
echo "💾 Backup location: $BACKUP_FILE"
