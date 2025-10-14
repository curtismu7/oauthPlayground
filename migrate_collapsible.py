#!/usr/bin/env python3
"""
Migrate old CollapsibleHeaderButton pattern to new CollapsibleHeader service.
This script automates the Phase 3 migration for large flow files.
"""

import re
import sys
from pathlib import Path

def add_imports(content):
    """Add CollapsibleHeader import and required icons."""
    # Check if CollapsibleHeader is already imported
    if 'CollapsibleHeader' in content:
        print("  ✓ CollapsibleHeader already imported")
        return content
    
    # Add CollapsibleHeader import after other service imports
    pattern = r"(import.*from '\.\.\/\.\.\/services\/[^']+';)"
    
    def add_import(match):
        return match.group(0) + "\nimport { CollapsibleHeader } from '../../services/collapsibleHeaderService';"
    
    content = re.sub(pattern, add_import, content, count=1)
    
    # Add required icons if not present
    icons_to_add = ['FiBook', 'FiPackage', 'FiSend', 'FiSettings']
    
    # Find the react-icons import
    icon_pattern = r"(import \{[^}]+\} from 'react-icons/fi';)"
    match = re.search(icon_pattern, content)
    
    if match:
        existing_icons = match.group(1)
        icons_needed = [icon for icon in icons_to_add if icon not in existing_icons]
        
        if icons_needed:
            # Add missing icons
            new_import = existing_icons.replace('} from', f",\n\t{', '.join(icons_needed)},\n}} from")
            content = content.replace(existing_icons, new_import)
            print(f"  ✓ Added icons: {', '.join(icons_needed)}")
    
    return content

def convert_section(match):
    """Convert a single CollapsibleHeaderButton section to CollapsibleHeader."""
    full_match = match.group(0)
    
    # Extract title
    title_match = re.search(r'<CollapsibleTitle>\s*(?:<Fi\w+\s*/>\s*)?([^<]+)</CollapsibleTitle>', full_match)
    if not title_match:
        return full_match  # Can't parse, skip
    
    title = title_match.group(1).strip()
    
    # Determine icon and theme based on title keywords
    icon = '<FiSettings />'
    theme = ''
    
    if any(word in title.lower() for word in ['overview', 'what is', 'how', 'education', 'learn', 'understand']):
        icon = '<FiBook />'
        theme = 'theme="yellow"'
    elif any(word in title.lower() for word in ['configuration', 'credentials', 'settings', 'parameters', 'advanced', 'pkce']):
        icon = '<FiSettings />'
        theme = 'theme="orange"'
    elif any(word in title.lower() for word in ['request', 'authorization', 'generate', 'create']):
        icon = '<FiSend />'
        theme = 'theme="blue"'
    elif any(word in title.lower() for word in ['response', 'received', 'token', 'code', 'result']):
        icon = '<FiPackage />'
        theme = ''  # default
    elif any(word in title.lower() for word in ['complete', 'success', 'done', 'next steps']):
        icon = '<FiCheckCircle />'
        theme = 'theme="green"'
    elif 'deep dive' in title.lower() or 'details' in title.lower():
        icon = '<FiBook />'
        theme = 'theme="green"'
    
    # Extract content between CollapsibleContent tags
    content_match = re.search(r'<CollapsibleContent>(.*?)</CollapsibleContent>', full_match, re.DOTALL)
    if not content_match:
        return full_match
    
    content = content_match.group(1)
    
    # Build new CollapsibleHeader
    theme_attr = f'\n\t\t\t\t\t{theme}' if theme else ''
    new_section = f'''<CollapsibleHeader
\t\t\t\t\ttitle="{title}"
\t\t\t\t\ticon={{{icon}}}{theme_attr}
\t\t\t\t\tdefaultCollapsed={{false}}
\t\t\t\t>
{content}
\t\t\t\t</CollapsibleHeader>'''
    
    return new_section

def migrate_file(filepath):
    """Migrate a single file."""
    print(f"\n📝 Migrating: {filepath.name}")
    
    content = filepath.read_text()
    original_content = content
    
    # Step 1: Add imports
    content = add_imports(content)
    
    # Step 2: Convert CollapsibleSection patterns
    # Pattern: <CollapsibleSection>...<CollapsibleHeaderButton>...<CollapsibleContent>...</CollapsibleContent>...</CollapsibleSection>
    pattern = r'<CollapsibleSection>\s*<CollapsibleHeaderButton[^>]*>.*?</CollapsibleHeaderButton>\s*\{[^}]*collapsedSections[^}]*\}\s*&&\s*\(\s*<CollapsibleContent>.*?</CollapsibleContent>\s*\)\s*\}\s*</CollapsibleSection>'
    
    sections_found = len(re.findall(pattern, content, re.DOTALL))
    print(f"  Found {sections_found} sections to convert")
    
    if sections_found == 0:
        print("  ⚠️  No sections found - file may have different pattern")
        return False
    
    # Convert each section
    content = re.sub(pattern, convert_section, content, flags=re.DOTALL)
    
    # Step 3: Remove CollapsibleSection, CollapsibleHeaderButton, etc. styled components
    # (Keep them for now as they might be used elsewhere)
    
    # Step 4: Write back
    if content != original_content:
        filepath.write_text(content)
        print(f"  ✅ Migrated {sections_found} sections")
        return True
    else:
        print("  ⚠️  No changes made")
        return False

def main():
    """Main migration script."""
    files = [
        'src/pages/flows/OAuthImplicitFlowV6.tsx',
        'src/pages/flows/DeviceAuthorizationFlowV6.tsx',
        'src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx',
        'src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx',
    ]
    
    print("🚀 Starting Phase 3 Migration")
    print("=" * 50)
    
    migrated = 0
    for file_path in files:
        path = Path(file_path)
        if not path.exists():
            print(f"❌ File not found: {file_path}")
            continue
        
        if migrate_file(path):
            migrated += 1
    
    print("\n" + "=" * 50)
    print(f"✅ Migration complete: {migrated}/{len(files)} files migrated")
    print("\n⚠️  IMPORTANT: Review changes and test thoroughly!")
    print("   Run: npm run build")

if __name__ == '__main__':
    main()
