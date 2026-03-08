#!/usr/bin/env python3
"""
@icons Cleanup Script
Automated script to replace @icons imports with emojis wrapped in spans
"""

import os
import re
import sys
from pathlib import Path

# Icon to emoji mappings
ICON_MAPPINGS = {
    'FiAlertCircle': '⚠️',
    'FiAlertTriangle': '⚠️',
    'FiCheckCircle': '✅',
    'FiCheck': '✅',
    'FiX': '❌',
    'FiXCircle': '❌',
    'FiCopy': '📋',
    'FiDownload': '📥',
    'FiUpload': '📤',
    'FiEye': '👁️',
    'FiEyeOff': '🙈',
    'FiKey': '🔑',
    'FiLock': '🔒',
    'FiUnlock': '🔓',
    'FiSettings': '⚙️',
    'FiRefreshCw': '🔄',
    'FiHome': '🏠',
    'FiArrowRight': '➡️',
    'FiArrowLeft': '⬅️',
    'FiArrowUp': '⬆️',
    'FiArrowDown': '⬇️',
    'FiChevronRight': '➡️',
    'FiChevronLeft': '⬅️',
    'FiChevronUp': '⬆️',
    'FiChevronDown': '⬇️',
    'FiPlus': '➕',
    'FiMinus': '➖',
    'FiTrash2': '🗑️',
    'FiEdit': '✏️',
    'FiSave': '💾',
    'FiSearch': '🔍',
    'FiFilter': '🔽',
    'FiExternalLink': '🔗',
    'FiLink': '🔗',
    'FiMail': '📧',
    'FiPhone': '📞',
    'FiUser': '👤',
    'FiUsers': '👥',
    'FiShield': '🛡️',
    'FiZap': '⚡',
    'FiActivity': '🔄',
    'FiCpu': '🖥️',
    'FiMonitor': '🖥️',
    'FiSmartphone': '📱',
    'FiMessageCircle': '💬',
    'FiSend': '📤',
    'FiBook': '📖',
    'FiFileText': '📄',
    'FiFolder': '📁',
    'FiPackage': '📦',
    'FiGlobe': '🌐',
    'FiInfo': 'ℹ️',
    'FiHelpCircle': '❓',
    'FiStar': '⭐',
    'FiHeart': '❤️',
    'FiClock': '🕐',
    'FiCalendar': '📅',
    'FiCamera': '📷',
    'FiImage': '🖼️',
    'FiVideo': '🎥',
    'FiMusic': '🎵',
    'FiVolume2': '🔊',
    'FiVolumeX': '🔇',
    'FiWifi': '📶',
    'FiBattery': '🔋',
    'FiPower': '⚡',
    'FiSun': '☀️',
    'FiMoon': '🌙',
    'FiCloud': '☁️',
    'FiCloudRain': '🌧️',
    'FiMapPin': '📍',
    'FiNavigation': '🧭',
    'FiShoppingCart': '🛒',
    'FiCreditCard': '💳',
    'FiDollarSign': '💵',
    'FiTrendingUp': '📈',
    'FiTrendingDown': '📉',
    'FiBarChart': '📊',
    'FiPieChart': '🥧',
    'FiDatabase': '🗄️',
    'FiServer': '🖥️',
    'FiHardDrive': '💾',
    'FiPrinter': '🖨️',
    'FiShare': '🔗',
    'FiShare2': '🔗',
    'FiFacebook': '📘',
    'FiTwitter': '🐦',
    'FiLinkedin': '💼',
    'FiGithub': '🐙',
    'FiGitlab': '🦊',
    'FiChrome': '🌐',
    'FiFirefox': '🦊',
    'FiSafari': '🧭',
}

def find_files_with_icons(src_dir):
    """Find all .tsx files that contain @icons imports"""
    files_with_icons = []
    
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if "from '@icons'" in content:
                            files_with_icons.append(file_path)
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
    
    return files_with_icons

def extract_icons_from_import(content):
    """Extract icon names from import statement"""
    icons = []
    
    # Find import statement
    import_match = re.search(r'import\s*\{([^}]+)\}\s*from\s*[\'"]@icons[\'"]', content)
    if import_match:
        import_content = import_match.group(1)
        # Extract individual icon names
        icons = [icon.strip() for icon in import_content.split(',')]
        icons = [icon for icon in icons if icon]  # Remove empty strings
    
    return icons

def replace_icon_usage(content, icon_name, emoji):
    """Replace icon usage with emoji wrapped in span"""
    replacements = 0
    
    # Pattern 1: <FiIcon size={number} />
    pattern1 = rf'<{icon_name}\s+size=\{{([^}}]+)\}}\s*/>'
    content, count1 = re.subn(pattern1, f'<span style={{ fontSize: \\1 }}>{emoji}</span>', content)
    replacements += count1
    
    # Pattern 2: <FiIcon size={number} color="..." />
    pattern2 = rf'<{icon_name}\s+size=\{{([^}}]+)\}}\s+color=[\'"]([^\'"]+)[\'"]\s*/>'
    content, count2 = re.subn(pattern2, f'<span style={{ fontSize: \\1, color: \'\\2\' }}>{emoji}</span>', content)
    replacements += count2
    
    # Pattern 3: <FiIcon />
    pattern3 = rf'<{icon_name}\s*/>'
    content, count3 = re.subn(pattern3, f'<span>{emoji}</span>', content)
    replacements += count3
    
    # Pattern 4: <FiIcon> (self-closing with content)
    pattern4 = rf'<{icon_name}\s*>'
    content, count4 = re.subn(pattern4, f'<span>{emoji}</span>', content)
    replacements += count4
    
    # Pattern 5: styled(FiIcon) - replace with styled span
    pattern5 = rf'styled\({icon_name}\)'
    content, count5 = re.subn(pattern5, 'styled.span', content)
    replacements += count5
    
    return content, replacements

def fix_logger_import(content):
    """Replace old logger import with createModuleLogger"""
    replacements = 0
    
    # Replace import
    if "import { logger } from '../utils/logger';" in content:
        content = content.replace(
            "import { logger } from '../utils/logger';",
            "import { createModuleLogger } from '../utils/consoleMigrationHelper';"
        )
        replacements += 1
    elif "import { logger } from '../../utils/logger';" in content:
        content = content.replace(
            "import { logger } from '../../utils/logger';",
            "import { createModuleLogger } from '../../utils/consoleMigrationHelper';"
        )
        replacements += 1
    elif "import { logger } from './utils/logger';" in content:
        content = content.replace(
            "import { logger } from './utils/logger';",
            "import { createModuleLogger } from './utils/consoleMigrationHelper';"
        )
        replacements += 1
    
    # Replace logger calls with log calls (if log instance exists)
    content = content.replace('logger.', 'log.')
    replacements += content.count('log.') - content.count('logger.')
    
    return content, replacements

def add_logger_instance(content, file_path):
    """Add logger instance if needed"""
    # Check if createModuleLogger is imported but logger is used
    if 'createModuleLogger' in content and 'logger.' in content:
        # Find component definition
        component_match = re.search(r'(const\s+\w+:\s*React\.FC.*?=\s*\()|(function\s+\w+\s*\()', content)
        if component_match and 'const log = createModuleLogger(' not in content:
            # Extract file path for logger name
            relative_path = os.path.relpath(file_path, '/Users/cmuir/P1Import-apps/oauth-playground/src')
            logger_name = relative_path.replace('.tsx', '').replace('/', '.')
            
            # Add logger instance before component
            logger_line = f'\nconst log = createModuleLogger(\'{logger_name}\');\n'
            content = content.replace(component_match.group(0), logger_line + '\n' + component_match.group(0))
    
    return content

def process_file(file_path, dry_run=True):
    """Process a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        content = original_content
        total_replacements = 0
        
        # Extract icons from import
        imported_icons = extract_icons_from_import(content)
        
        if not imported_icons:
            return False, 0
        
        print(f"\nProcessing: {file_path}")
        print(f"Found icons: {', '.join(imported_icons)}")
        
        # Remove @icons import
        import_pattern = r'import\s*\{[^}]+\}\s*from\s*[\'"]@icons[\'"][^;]*;'
        content, import_replacements = re.subn(import_pattern, '', content)
        total_replacements += import_replacements
        
        # Replace each icon usage
        for icon_name in imported_icons:
            emoji = ICON_MAPPINGS.get(icon_name, '❓')  # Default to question mark
            content, icon_replacements = replace_icon_usage(content, icon_name, emoji)
            total_replacements += icon_replacements
            if icon_replacements > 0:
                print(f"  Replaced {icon_replacements} instances of {icon_name} with {emoji}")
        
        # Fix logger import and calls
        content, logger_replacements = fix_logger_import(content)
        total_replacements += logger_replacements
        if logger_replacements > 0:
            print(f"  Fixed logger import/calls: {logger_replacements} replacements")
        
        # Add logger instance if needed
        if 'createModuleLogger' in content and 'const log = createModuleLogger(' not in content:
            content = add_logger_instance(content, file_path)
            print(f"  Added logger instance")
        
        # Write file if not dry run
        if not dry_run and total_replacements > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✅ File updated ({total_replacements} total replacements)")
        elif total_replacements > 0:
            print(f"  🔄 DRY RUN: Would make {total_replacements} replacements")
        else:
            print(f"  ℹ️  No changes needed")
            return False, 0
        
        return True, total_replacements
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False, 0

def main():
    """Main function"""
    src_dir = "/Users/cmuir/P1Import-apps/oauth-playground/src"
    
    print("🔍 Finding files with @icons imports...")
    files_with_icons = find_files_with_icons(src_dir)
    
    print(f"📊 Found {len(files_with_icons)} files with @icons imports")
    
    if not files_with_icons:
        print("✅ No files found with @icons imports")
        return
    
    # Ask if dry run
    dry_run = len(sys.argv) > 1 and sys.argv[1] == '--dry-run'
    if dry_run:
        print("🔍 DRY RUN MODE - No files will be modified")
    else:
        print("⚠️  LIVE MODE - Files will be modified")
        response = input("Continue? (y/N): ")
        if response.lower() != 'y':
            print("❌ Aborted")
            return
    
    print(f"\n🚀 Processing {len(files_with_icons)} files...")
    
    total_files_processed = 0
    total_replacements = 0
    
    for file_path in files_with_icons:
        processed, replacements = process_file(file_path, dry_run)
        if processed:
            total_files_processed += 1
            total_replacements += replacements
    
    print(f"\n📈 SUMMARY:")
    print(f"  Files processed: {total_files_processed}")
    print(f"  Total replacements: {total_replacements}")
    print(f"  Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    
    if not dry_run and total_files_processed > 0:
        print(f"\n✅ Successfully updated {total_files_processed} files!")
    elif dry_run and total_files_processed > 0:
        print(f"\n🔄 Dry run complete. Run without --dry-run to apply changes.")

if __name__ == "__main__":
    main()
