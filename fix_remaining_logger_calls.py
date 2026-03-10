#!/usr/bin/env python3
"""
Script to fix remaining logger calls with complex patterns
"""

import os
import re
import json
from pathlib import Path

def fix_complex_logger_calls_in_file(file_path):
    """Fix complex logger calls in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern to match logger calls with objects as second parameter
        # logger.info('message', { object });
        # logger.error('error', { error });
        
        patterns = [
            # logger.info('message', { object });
            (r'logger\.info\(([^,]+),\s*({[^}]+})\);', r'logger.info(\1, JSON.stringify(\2), "Logger info");'),
            
            # logger.error('error', { error });
            (r'logger\.error\(([^,]+),\s*({[^}]+})\);', r'logger.error(\1, JSON.stringify(\2), "Logger error");'),
            
            # logger.warn('warning', { warning });
            (r'logger\.warn\(([^,]+),\s*({[^}]+})\);', r'logger.warn(\1, JSON.stringify(\2), "Logger warning");'),
            
            # logger.debug('debug', { debug });
            (r'logger\.debug\(([^,]+),\s*({[^}]+})\);', r'logger.debug(\1, JSON.stringify(\2), "Logger debug");'),
            
            # logger calls with error parameter (unknown type)
            (r'logger\.error\(([^,]+),\s*error\);', r'logger.error(\1, error instanceof Error ? error.message : "Unknown error", "Logger error");'),
            
            # logger calls with single error parameter
            (r'logger\.error\(([^,]+),\s*([^,)]+)(?![,)]);', r'logger.error(\1, typeof \2 === "string" ? \2 : JSON.stringify(\2), "Logger error");'),
            
            # logger calls with mixed parameters
            (r'logger\.info\(([^,]+),\s*([^,)]+)(?![,)]);', r'logger.info(\1, typeof \2 === "string" ? \2 : JSON.stringify(\2), "Logger info");'),
            
            # logger.warn with single parameter
            (r'logger\.warn\(([^,]+),\s*([^,)]+)(?![,)]);', r'logger.warn(\1, typeof \2 === "string" ? \2 : JSON.stringify(\2), "Logger warning");'),
            
            # logger.debug with single parameter
            (r'logger\.debug\(([^,]+),\s*([^,)]+)(?![,)]);', r'logger.debug(\1, typeof \2 === "string" ? \2 : JSON.stringify(\2), "Logger debug");'),
        ]
        
        changes_made = 0
        for pattern, replacement in patterns:
            matches = re.findall(pattern, content, re.MULTILINE | re.DOTALL)
            if matches:
                content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)
                changes_made += len(matches)
        
        # Write back if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed {changes_made} complex logger calls in {file_path}")
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
        
        fixes = fix_complex_logger_calls_in_file(file_path)
        if fixes > 0:
            total_fixes += fixes
            files_processed += 1
    
    print(f"\nSummary:")
    print(f"Files processed: {files_processed}")
    print(f"Total complex logger calls fixed: {total_fixes}")

if __name__ == "__main__":
    main()
