#!/usr/bin/env python3
"""
Script to fix logger calls across the codebase to include second parameter
"""

import os
import re
import json
from pathlib import Path

def fix_logger_calls_in_file(file_path):
    """Fix logger calls in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern to match logger calls without second parameter
        # logger.info('message');
        # logger.error('error message');
        # logger.warn('warning message');
        # logger.debug('debug message');
        
        patterns = [
            # logger.info('message');
            (r'logger\.info\(([^,)]+)\);', r'logger.info(\1, "Logger info");'),
            
            # logger.error('error');
            (r'logger\.error\(([^,)]+)\);', r'logger.error(\1, "Logger error");'),
            
            # logger.warn('warning');
            (r'logger\.warn\(([^,)]+)\);', r'logger.warn(\1, "Logger warning");'),
            
            # logger.debug('debug');
            (r'logger\.debug\(([^,)]+)\);', r'logger.debug(\1, "Logger debug");'),
            
            # Multi-line logger calls
            (r'logger\.info\(\s*([^,)]+)\s*\);', r'logger.info(\1, "Logger info");'),
            (r'logger\.error\(\s*([^,)]+)\s*\);', r'logger.error(\1, "Logger error");'),
            (r'logger\.warn\(\s*([^,)]+)\s*\);', r'logger.warn(\1, "Logger warning");'),
            (r'logger\.debug\(\s*([^,)]+)\s*\);', r'logger.debug(\1, "Logger debug");'),
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
            print(f"Fixed {changes_made} logger calls in {file_path}")
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
        
        fixes = fix_logger_calls_in_file(file_path)
        if fixes > 0:
            total_fixes += fixes
            files_processed += 1
    
    print(f"\nSummary:")
    print(f"Files processed: {files_processed}")
    print(f"Total logger calls fixed: {total_fixes}")

if __name__ == "__main__":
    main()
