# Yellow Header Consistency Issue - Analysis

## Problem Identified
In OAuth Authorization Code flow, there are TWO different yellow headers with:
1. **Different shades of yellow**
2. **Different icons**

### Header 1: "OAuth 2.0 = Authorization Only (NOT Authentication)"
- **Source:** `EducationalContentService` (service)
- **Theme:** `theme='yellow'` from `CollapsibleHeader` service
- **Icon:** `<FiInfo />` (default for EducationalContentService)
- **Color:** `linear-gradient(135deg, #fde047 0%, #facc15 100%)` (darker yellow)

### Header 2: "OAuth 2.0 Authorization Code Overview"
- **Source:** Local `YellowHeaderButton` styled component
- **Theme:** Custom local styled component
- **Icon:** `<FiBook />`
- **Color:** `linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)` (lighter yellow)

## Per SECTION_HEADER_COLOR_ICON_REFERENCE.md:
- 🟡 **YELLOW** (`theme="yellow"` + `<FiBook />`): Educational sections in **odd positions** (1st, 3rd, 5th)
- 🟢 **GREEN** (`theme="green"` + `<FiBook />`): Educational sections in **even positions** (2nd, 4th, 6th)

## Solution
The issue is:
1. Both are yellow (should alternate yellow/green for educational sections)
2. Different shades (should use standardized CollapsibleHeader service)
3. Different icons (should use <FiBook /> per reference doc)

**Fix:**
1. **Header 1** (EducationalContentService) → Keep yellow, change icon to `<FiBook />`
2. **Header 2** (Overview section) → Change to **GREEN** theme using CollapsibleHeader service

This creates proper visual hierarchy:
- 🟡 1st educational: "OAuth 2.0 = Authorization Only" (Yellow)
- 🟢 2nd educational: "OAuth 2.0 Authorization Code Overview" (Green)
