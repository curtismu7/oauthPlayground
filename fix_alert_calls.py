#!/usr/bin/env python3
"""
Script to replace alert() calls with modern notification approach
"""

import os
import re
import json
from pathlib import Path

def fix_alert_calls_in_file(file_path):
    """Fix alert calls in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern to match alert() calls
        # alert('message');
        # alert("message");
        
        patterns = [
            # Simple alert calls
            (r'alert\([\'"]([^\'"]+)[\'"]\);', 
             r'console.warn("Alert: \1");'),
            
            # Alert calls with variables
            (r'alert\(([^)]+)\);', 
             r'console.warn("Alert:", \1);'),
        ]
        
        changes_made = 0
        for pattern, replacement in patterns:
            matches = re.findall(pattern, content)
            if matches:
                content = re.sub(pattern, replacement, content)
                changes_made += len(matches)
        
        # Write back if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed {changes_made} alert calls in {file_path}")
            return changes_made
        
        return 0
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to process all files"""
    base_dir = Path("/Users/cmuir/P1Import-apps/oauth-playground/src")
    
    # Find all TypeScript/TSX files
    ts_files = list(base_dir.rglob("*.ts")) + list(base_dir.rglob("*.tsx"))
    
    total_fixes = 0
    files_processed = 0
    
    for file_path in ts_files:
        # Skip certain directories
        if any(skip in str(file_path) for skip in ['node_modules', '.git', 'dist', 'build']):
            continue
        
        fixes = fix_alert_calls_in_file(file_path)
        if fixes > 0:
            total_fixes += fixes
            files_processed += 1
    
    print(f"\nSummary:")
    print(f"Files processed: {files_processed}")
    print(f"Total alert calls fixed: {total_fixes}")

if __name__ == "__main__":
    main()
