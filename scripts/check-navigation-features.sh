#!/bin/bash

# Navigation Feature Presence Check
# Prevent regressions in Navigation functionality

set -e

echo "🔍 Checking Navigation Feature Presence..."

# Check Navigation components exist
NAVIGATION_COMPONENTS=(
    "Sidebar"
    "Navbar"
    "DragDropSidebar"
    "SidebarSearch"
    "VersionBadge"
)

for component in "${NAVIGATION_COMPONENTS[@]}"; do
    if ! find src/apps/navigation/components/ -name "*$component*" -type f | grep -q .; then
        echo "❌ Navigation component missing: $component"
        exit 1
    fi
done

# Check Navigation hooks exist (they might be in shared hooks)
NAVIGATION_HOOKS=(
    "useAccessibility"
    "useSidebar"
    "useNavigation"
)

for hook in "${NAVIGATION_HOOKS[@]}"; do
    if ! find src/hooks/ -name "*$hook*" -type f | grep -q .; then
        echo "⚠️  Navigation hook not found (optional): $hook"
        # Don't exit here as hooks might be in shared hooks or not yet created
    fi
done

# Check Navigation services exist (they might be in shared services)
NAVIGATION_SERVICES=(
    "navigation"
    "sidebar"
    "menu"
)

for service in "${NAVIGATION_SERVICES[@]}"; do
    if ! find src/services/ -name "*$service*" -type f | grep -q .; then
        echo "⚠️  Navigation service not found (optional): $service"
        # Don't exit here as services might be in shared services or not yet created
    fi
done

# Check for key Navigation functionality
echo "🔍 Checking Navigation functionality..."

# Check sidebar functionality
if ! grep -r "sidebar\|Sidebar" src/apps/navigation/components/ | grep -q .; then
    echo "❌ Sidebar functionality missing"
    exit 1
fi

# Check navbar functionality
if ! grep -r "navbar\|Navbar" src/apps/navigation/components/ | grep -q .; then
    echo "❌ Navbar functionality missing"
    exit 1
fi

# Check drag and drop functionality
if ! grep -r "DragDrop" src/apps/navigation/components/ | grep -q .; then
    echo "❌ Drag and drop functionality missing"
    exit 1
fi

# Check search functionality
if ! grep -r "Search\|search" src/apps/navigation/components/ | grep -q .; then
    echo "❌ Search functionality missing"
    exit 1
fi

# Check version display functionality
if ! grep -r "Version\|version" src/apps/navigation/components/ | grep -q .; then
    echo "❌ Version display functionality missing"
    exit 1
fi

# Check navigation state management
if ! grep -r "sidebarOpen\|isOpen\|toggle" src/apps/navigation/components/ | grep -q .; then
    echo "❌ Navigation state management missing"
    exit 1
fi

# Check accessibility features
if ! grep -r "accessibility\|Accessibility" src/apps/navigation/components/ | grep -q .; then
    echo "❌ Navigation accessibility features missing"
    exit 1
fi

echo "✅ All Navigation features present"
exit 0
