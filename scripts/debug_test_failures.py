#!/usr/bin/env python3
"""
Debug Test Failures Script
Shows exactly what's failing in the syntax tests
"""

import os
import re
import subprocess
from pathlib import Path

def debug_single_file(file_path):
    """Debug syntax fixes on a single file with detailed output"""
    print(f"\n🔍 DEBUGGING: {file_path}")
    print("=" * 60)
    
    try:
        # Read original
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        print(f"📊 Original file size: {len(original_content)} characters")
        
        # Find problematic patterns
        jsx_patterns = re.findall(r'style=\{\s*fontSize:[^}]*\}', original_content)
        logger_patterns = re.findall(r'logger\.', original_content)
        
        print(f"🎯 JSX style patterns found: {len(jsx_patterns)}")
        for i, pattern in enumerate(jsx_patterns[:3]):  # Show first 3
            print(f"   {i+1}. {pattern}")
        
        print(f"🎯 Logger patterns found: {len(logger_patterns)}")
        for i, pattern in enumerate(logger_patterns[:3]):  # Show first 3
            print(f"   {i+1}. {pattern}")
        
        # Apply fixes
        content = original_content
        replacements = 0
        
        # JSX style fixes
        patterns = [
            (r'style=\{\s*fontSize:\s*[\'"](\d+)[\'"]\s*\}', r'style={{ fontSize: \'\1\' }}'),
            (r'style=\{\s*fontSize:\s*(\d+)\s*\}', r'style={{ fontSize: \'\1\' }}'),
            (r'style=\{\{\s*fontSize:\s*(\d+)\s*\}\}', r'style={{ fontSize: \'\1\' }}')
        ]
        
        for i, (pattern, replacement) in enumerate(patterns):
            matches = re.findall(pattern, content)
            if matches:
                print(f"\n🔧 Pattern {i+1}: {pattern}")
                print(f"   Matches: {matches}")
                print(f"   Replacement: {replacement}")
                
                before = content
                content = re.sub(pattern, replacement, content)
                
                if before != content:
                    print(f"   ✅ Applied {len(matches)} replacements")
                    replacements += len(matches)
                else:
                    print(f"   ❌ No changes made")
        
        # Show a sample of the changes
        if replacements > 0:
            print(f"\n📝 SAMPLE CHANGES:")
            lines_orig = original_content.split('\n')
            lines_fixed = content.split('\n')
            
            for i, (orig, fixed) in enumerate(zip(lines_orig, lines_fixed)):
                if orig != fixed:
                    print(f"   Line {i+1}:")
                    print(f"     BEFORE: {orig.strip()}")
                    print(f"     AFTER:  {fixed.strip()}")
                    if i >= 2:  # Show max 3 changes
                        break
        
        # Test TypeScript compilation
        print(f"\n🧪 TESTING TYPESCRIPT COMPILATION...")
        temp_file = f"/tmp/debug_{os.path.basename(file_path)}"
        with open(temp_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        try:
            result = subprocess.run(
                ['npx', 'tsc', '--noEmit', '--skipLibCheck', temp_file],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print(f"   ✅ TypeScript compilation: SUCCESS")
            else:
                print(f"   ❌ TypeScript compilation: FAILED")
                print(f"   Errors:")
                for line in result.stderr.split('\n')[:5]:  # Show first 5 errors
                    if line.strip():
                        print(f"     - {line}")
        except Exception as e:
            print(f"   ❌ TypeScript test failed: {e}")
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)
        
        return {
            'file': file_path,
            'replacements': replacements,
            'jsx_patterns': len(jsx_patterns),
            'logger_patterns': len(logger_patterns)
        }
        
    except Exception as e:
        print(f"❌ DEBUG FAILED: {e}")
        return {'file': file_path, 'error': str(e)}

def main():
    """Main debug function"""
    src_dir = "/Users/cmuir/P1Import-apps/oauth-playground/src"
    
    print("🐛 DEBUG TEST FAILURES")
    print("=" * 60)
    
    # Find test files
    test_files = []
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') and len(test_files) < 3:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if ('style={ fontSize:' in content or 'logger.' in content):
                            test_files.append(file_path)
                except Exception:
                    pass
    
    if not test_files:
        print("❌ No files found for debugging")
        return
    
    print(f"📊 Debugging {len(test_files)} files...")
    
    # Debug each file
    results = []
    for file_path in test_files:
        result = debug_single_file(file_path)
        results.append(result)
    
    # Summary
    print(f"\n📈 DEBUG SUMMARY")
    print("=" * 60)
    
    total_replacements = 0
    total_jsx_patterns = 0
    total_logger_patterns = 0
    
    for result in results:
        if 'error' not in result:
            print(f"📁 {result['file']}")
            print(f"   JSX patterns: {result['jsx_patterns']}")
            print(f"   Logger patterns: {result['logger_patterns']}")
            print(f"   Replacements: {result['replacements']}")
            
            total_replacements += result['replacements']
            total_jsx_patterns += result['jsx_patterns']
            total_logger_patterns += result['logger_patterns']
    
    print(f"\n📊 TOTALS:")
    print(f"   JSX patterns: {total_jsx_patterns}")
    print(f"   Logger patterns: {total_logger_patterns}")
    print(f"   Replacements made: {total_replacements}")

if __name__ == "__main__":
    main()
