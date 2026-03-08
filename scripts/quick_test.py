#!/usr/bin/env python3
"""
Quick Test Script
Test our updated patterns on 3 files
"""

import os
import re

def quick_test_patterns():
    """Test patterns on a few files"""
    src_dir = "/Users/cmuir/P1Import-apps/oauth-playground/src"
    
    # Find 3 files with issues
    test_files = []
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') and len(test_files) < 3:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'style={ fontSize:' in content:
                            test_files.append(file_path)
                except Exception:
                    pass
    
    print(f"🧪 Testing {len(test_files)} files...")
    
    for file_path in test_files:
        print(f"\n📁 {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Count original issues
            original_issues = len(re.findall(r'style=\{\s*fontSize:', content))
            print(f"   Original issues: {original_issues}")
            
            # Apply our patterns
            content = re.sub(r'style=\{\s*fontSize:\s*[\'"](\d+)[\'"]\s*\}', r'style={{ fontSize: \'\1\' }}', content)
            content = re.sub(r'style=\{\s*fontSize:\s*(\d+)\s*\}', r'style={{ fontSize: \'\1\' }}', content)
            
            # Count remaining issues
            remaining_issues = len(re.findall(r'style=\{\s*fontSize:', content))
            print(f"   Remaining issues: {remaining_issues}")
            print(f"   Fixed: {original_issues - remaining_issues}")
            
            if remaining_issues == 0:
                print(f"   ✅ SUCCESS")
            else:
                print(f"   ⚠️  Still has issues")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    quick_test_patterns()
