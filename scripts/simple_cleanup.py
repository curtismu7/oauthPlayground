#!/usr/bin/env python3
"""
Simple @icons Cleanup Script
"""

import os
import re
from pathlib import Path

# Basic icon mappings
ICON_MAPPINGS = {
    'FiAlertCircle': '⚠️',
    'FiCheckCircle': '✅',
    'FiX': '❌',
    'FiCopy': '📋',
    'FiSettings': '⚙️',
    'FiRefreshCw': '🔄',
    'FiHome': '🏠',
    'FiArrowRight': '➡️',
    'FiArrowLeft': '⬅️',
    'FiPlus': '➕',
    'FiTrash2': '🗑️',
    'FiExternalLink': '🔗',
    'FiUser': '👤',
    'FiShield': '🛡️',
    'FiZap': '⚡',
    'FiMessageCircle': '💬',
    'FiSend': '📤',
    'FiBook': '📖',
    'FiGlobe': '🌐',
    'FiInfo': 'ℹ️',
    'FiKey': '🔑',
    'FiEye': '👁️',
    'FiEyeOff': '🙈',
    'FiDownload': '📥',
    'FiUpload': '📤',
    'FiChevronDown': '⬇️',
    'FiChevronUp': '⬆️',
    'FiActivity': '🔄',
    'FiCpu': '🖥️',
    'FiSmartphone': '📱',
}

def main():
    src_dir = "/Users/cmuir/P1Import-apps/oauth-playground/src"
    
    print("🔍 Finding files with @icons imports...")
    files_with_icons = []
    
    # Find all .tsx files
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
    
    print(f"📊 Found {len(files_with_icons)} files with @icons imports")
    
    if not files_with_icons:
        print("✅ No files found with @icons imports")
        return
    
    # Show first 10 files
    print("\n📋 First 10 files to process:")
    for i, file_path in enumerate(files_with_icons[:10]):
        relative_path = os.path.relpath(file_path, src_dir)
        print(f"  {i+1}. {relative_path}")
    
    if len(files_with_icons) > 10:
        print(f"  ... and {len(files_with_icons) - 10} more files")
    
    print(f"\n🚀 Ready to process {len(files_with_icons)} files!")
    print("💡 Run: python3 scripts/cleanup_icons.py (without --dry-run) to apply changes")

if __name__ == "__main__":
    main()
