#!/usr/bin/env python3
"""
Test Syntax Fixes Script
Safely tests the syntax fix script before applying changes
"""

import os
import re
import subprocess
import json
from pathlib import Path

def backup_files(file_list, backup_dir):
    """Create backups of files before testing"""
    print("🔄 Creating backups...")
    
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    
    for file_path in file_list[:5]:  # Test with first 5 files
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Create backup path
            rel_path = os.path.relpath(file_path, '/Users/cmuir/P1Import-apps/oauth-playground/src')
            backup_path = os.path.join(backup_dir, rel_path.replace('/', '_'))
            
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(content)
                
            print(f"  ✅ Backed up: {rel_path}")
        except Exception as e:
            print(f"  ❌ Failed to backup {file_path}: {e}")

def test_single_file(file_path):
    """Test syntax fixes on a single file"""
    print(f"\n🧪 Testing: {file_path}")
    
    try:
        # Read original
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # Apply fixes (copied from fix_syntax_errors.py)
        content = original_content
        replacements = 0
        
        # JSX style fixes
        patterns = [
            (r'style=\{\s*fontSize:\s*[\'"](\d+)[\'"]\s*\}', r'style={{ fontSize: \'\1\' }}'),
            (r'style=\{\s*fontSize:\s*(\d+)\s*\}', r'style={{ fontSize: \'\1\' }}'),
            (r'style=\{\{\s*fontSize:\s*(\d+)\s*\}\}', r'style={{ fontSize: \'\1\' }}')
        ]
        
        for pattern, replacement in patterns:
            matches = re.findall(pattern, content)
            if matches:
                content = re.sub(pattern, replacement, content)
                replacements += len(matches)
                print(f"  🔧 Fixed {len(matches)} JSX style errors")
        
        # Test TypeScript compilation
        test_result = test_typescript_compilation(content, file_path)
        
        # Test basic syntax
        syntax_result = test_basic_syntax(content)
        
        return {
            'file': file_path,
            'original_size': len(original_content),
            'fixed_size': len(content),
            'replacements': replacements,
            'typescript_compiles': test_result['success'],
            'syntax_valid': syntax_result['success'],
            'errors': test_result.get('errors', []) + syntax_result.get('errors', [])
        }
        
    except Exception as e:
        return {
            'file': file_path,
            'error': str(e),
            'success': False
        }

def test_typescript_compilation(content, file_path):
    """Test TypeScript compilation using tsc --noEmit"""
    try:
        # Create temporary file
        temp_file = f"/tmp/test_{os.path.basename(file_path)}"
        with open(temp_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Run TypeScript compiler
        result = subprocess.run(
            ['npx', 'tsc', '--noEmit', '--skipLibCheck', temp_file],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        os.remove(temp_file)
        
        return {
            'success': result.returncode == 0,
            'errors': result.stderr.split('\n') if result.stderr else []
        }
        
    except Exception as e:
        return {
            'success': False,
            'errors': [f"TypeScript test failed: {str(e)}"]
        }

def test_basic_syntax(content):
    """Test basic JSX/TypeScript syntax"""
    try:
        # Basic syntax checks
        checks = [
            # Check for unmatched braces
            (content.count('{') == content.count('}'), "Unmatched braces"),
            # Check for unmatched parentheses
            (content.count('(') == content.count(')'), "Unmatched parentheses"),
            # Check for unmatched brackets
            (content.count('[') == content.count(']'), "Unmatched brackets"),
            # Check for basic JSX structure
            ('style={{ fontSize:' in content.replace('style={{ fontSize: \'', ''), "Invalid JSX syntax"),
        ]
        
        errors = []
        for check, error_msg in checks:
            if not check:
                errors.append(error_msg)
        
        return {
            'success': len(errors) == 0,
            'errors': errors
        }
        
    except Exception as e:
        return {
            'success': False,
            'errors': [f"Syntax test failed: {str(e)}"]
        }

def find_problematic_files(src_dir, limit=10):
    """Find a small sample of files to test"""
    files_with_errors = []
    
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') and len(files_with_errors) < limit:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if ('style={ fontSize:' in content or 'logger.' in content):
                            files_with_errors.append(file_path)
                except Exception:
                    pass
    
    return files_with_errors

def main():
    """Main testing function"""
    src_dir = "/Users/cmuir/P1Import-apps/oauth-playground/src"
    backup_dir = "/tmp/syntax_fix_backups"
    
    print("🧪 SYNTAX FIX TESTING SUITE")
    print("=" * 50)
    
    # Find test files
    print("🔍 Finding test files...")
    test_files = find_problematic_files(src_dir, limit=5)
    
    if not test_files:
        print("❌ No files found for testing")
        return
    
    print(f"📊 Found {len(test_files)} files to test")
    
    # Create backups
    backup_files(test_files, backup_dir)
    
    # Test each file
    results = []
    for file_path in test_files:
        result = test_single_file(file_path)
        results.append(result)
    
    # Analyze results
    print("\n📈 TEST RESULTS")
    print("=" * 50)
    
    successful_tests = 0
    total_replacements = 0
    
    for result in results:
        if 'error' in result:
            print(f"❌ {result['file']}: {result['error']}")
        else:
            status = "✅" if (result['typescript_compiles'] and result['syntax_valid']) else "⚠️"
            print(f"{status} {result['file']}")
            print(f"   Replacements: {result['replacements']}")
            print(f"   TypeScript: {'✅' if result['typescript_compiles'] else '❌'}")
            print(f"   Syntax: {'✅' if result['syntax_valid'] else '❌'}")
            
            if result['errors']:
                print(f"   Errors: {len(result['errors'])}")
                for error in result['errors'][:3]:  # Show first 3 errors
                    print(f"     - {error}")
            
            if result['typescript_compiles'] and result['syntax_valid']:
                successful_tests += 1
            
            total_replacements += result.get('replacements', 0)
    
    # Summary
    print(f"\n📊 SUMMARY")
    print("=" * 50)
    print(f"Files tested: {len(results)}")
    print(f"Successful tests: {successful_tests}/{len(results)}")
    print(f"Total replacements: {total_replacements}")
    print(f"Success rate: {successful_tests/len(results)*100:.1f}%")
    
    # Recommendation
    if successful_tests == len(results):
        print("\n✅ RECOMMENDATION: All tests passed! Safe to proceed with full fix.")
        print("🚀 Run: python3 scripts/fix_syntax_errors.py")
    elif successful_tests >= len(results) * 0.8:
        print("\n⚠️ RECOMMENDATION: Most tests passed. Review errors before proceeding.")
        print("🔧 Consider fixing the failing patterns first.")
    else:
        print("\n❌ RECOMMENDATION: Too many failures. Do not proceed with full fix.")
        print("🛠️ Fix the test failures before running the main script.")
    
    print(f"\n📁 Backups saved to: {backup_dir}")

if __name__ == "__main__":
    main()
