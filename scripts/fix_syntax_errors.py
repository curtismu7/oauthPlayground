#!/usr/bin/env python3
"""
Fix Syntax Errors Script
Fixes JSX syntax errors created by the icons cleanup script
"""

import os
import re
from pathlib import Path

def fix_jsx_style_syntax(content):
    """Fix JSX style syntax errors"""
    replacements = 0
    
    # Pattern 1: Fix style={ fontSize: '24' } -> style={{ fontSize: '24' }}
    pattern1 = r'style=\{\s*fontSize:\s*[\'"](\d+)[\'"]\s*\}'
    def replace_style1(match):
        nonlocal replacements
        replacements += 1
        size = match.group(1)
        return f'style={{ fontSize: \'{size}\' }}'
    
    content = re.sub(pattern1, replace_style1, content)
    
    # Pattern 2: Fix style={ fontSize: 24 } -> style={{ fontSize: '24' }}
    pattern2 = r'style=\{\s*fontSize:\s*(\d+)\s*\}'
    def replace_style2(match):
        nonlocal replacements
        replacements += 1
        size = match.group(1)
        return f'style={{ fontSize: \'{size}\' }}'
    
    content = re.sub(pattern2, replace_style2, content)
    
    # Pattern 3: Fix style={{ fontSize: 24 }} -> style={{ fontSize: '24' }}
    pattern3 = r'style=\{\{\s*fontSize:\s*(\d+)\s*\}\}'
    def replace_style3(match):
        nonlocal replacements
        replacements += 1
        size = match.group(1)
        return f'style={{ fontSize: \'{size}\' }}'
    
    content = re.sub(pattern3, replace_style3, content)
    
    # Pattern 4: Fix style={{ fontSize: '24'  -> style={{ fontSize: '24' }} (missing closing brace)
    pattern4 = r'style=\{\{\s*fontSize:\s*[\'"](\d+)[\'"]\s*$'
    def replace_style4(match):
        nonlocal replacements
        replacements += 1
        size = match.group(1)
        return f'style={{ fontSize: \'{size}\' }}'
    
    content = re.sub(pattern4, replace_style4, content, flags=re.MULTILINE)
    
    return content, replacements

def fix_logger_issues(content, file_path):
    """Fix logger import and instance issues"""
    replacements = 0
    
    # Check if file has logger calls but no logger import/instance
    has_logger_calls = 'logger.' in content
    has_logger_import = 'import { logger }' in content or 'import logger' in content
    has_create_module_logger = 'createModuleLogger' in content
    has_log_instance = 'const log = createModuleLogger' in content
    
    if has_logger_calls and not has_logger_import and not has_create_module_logger:
        # Calculate correct relative path to consoleMigrationHelper
        src_dir = '/Users/cmuir/P1Import-apps/oauth-playground/src'
        relative_path = os.path.relpath(file_path, src_dir)
        
        # Calculate the depth to determine the correct relative path
        depth = relative_path.count(os.sep)
        import_path = '../' * depth + 'utils/consoleMigrationHelper'
        
        # Find the first import statement
        import_pattern = r'(import\s+.*?from\s+[\'"][^\'"]+[\'"];?\s*\n)'
        import_match = re.search(import_pattern, content)
        
        if import_match:
            # Add logger import after the first import
            logger_import = f"import {{ createModuleLogger }} from '{import_path}';\n"
            logger_instance = f"\nconst log = createModuleLogger('{relative_path}');\n"
            
            content = content.replace(import_match.group(1), import_match.group(1) + logger_import + logger_instance)
            replacements += 2
        
        # Replace logger calls with log calls
        content = content.replace('logger.', 'log.')
        replacements += content.count('log.') - content.count('logger.')
    
    return content, replacements

def find_files_with_syntax_errors(src_dir):
    """Find files with syntax errors"""
    files_with_errors = []
    
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # Check for common syntax errors
                        if ('style={ fontSize:' in content or 
                            'logger.' in content):
                            files_with_errors.append(file_path)
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
    
    return files_with_errors

def process_file(file_path, dry_run=True):
    """Process a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        content = original_content
        total_replacements = 0
        
        # Fix JSX style syntax
        content, style_replacements = fix_jsx_style_syntax(content)
        total_replacements += style_replacements
        
        # Fix logger issues
        content, logger_replacements = fix_logger_issues(content, file_path)
        total_replacements += logger_replacements
        
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
    
    print("🔍 Finding files with syntax errors...")
    files_with_errors = find_files_with_syntax_errors(src_dir)
    
    print(f"📊 Found {len(files_with_errors)} files with syntax errors")
    
    if not files_with_errors:
        print("✅ No files with syntax errors found")
        return
    
    # Ask if dry run
    import sys
    dry_run = len(sys.argv) > 1 and sys.argv[1] == '--dry-run'
    if dry_run:
        print("🔍 DRY RUN MODE - No files will be modified")
    else:
        print("⚠️  LIVE MODE - Files will be modified")
        response = input("Continue? (y/N): ")
        if response.lower() != 'y':
            print("❌ Aborted")
            return
    
    print(f"\n🚀 Processing {len(files_with_errors)} files...")
    
    total_files_processed = 0
    total_replacements = 0
    
    for file_path in files_with_errors:
        print(f"\nProcessing: {file_path}")
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
