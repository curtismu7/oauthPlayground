#!/usr/bin/env python3
"""
Critical Linter Issues Fix - Fix duplicate imports and misplaced imports

This script fixes the most critical linter issues that are preventing the build:
1. Duplicate logger imports (local + utils/logger)
2. Import statements inside function bodies
"""

import os
import re
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Set

# Configuration
SRC_DIR = Path("src")

class CriticalLinterFixer:
    def __init__(self):
        self.files_processed = 0
        self.files_fixed = 0
        self.duplicate_imports_fixed = 0
        self.misplaced_imports_fixed = 0
        
    def find_files_to_process(self) -> List[Path]:
        """Find all TypeScript/JavaScript files in the source directory"""
        files = []
        
        if not SRC_DIR.exists():
            print(f"❌ Source directory {SRC_DIR} not found")
            return files
            
        for file_path in SRC_DIR.rglob("*"):
            if file_path.is_file() and file_path.suffix in {".ts", ".tsx", ".js", ".jsx"}:
                # Skip node_modules and other ignored directories
                if any(ignored in str(file_path) for ignored in ["node_modules", ".git", "dist", "build"]):
                    continue
                files.append(file_path)
                
        return sorted(files)
    
    def fix_duplicate_logger_imports(self, content: str, file_path: Path) -> Tuple[str, int]:
        """Fix duplicate logger imports"""
        original_content = content
        fixes_count = 0
        
        # Pattern to find duplicate logger imports
        # Look for files that import logger from both a local path and utils/logger
        logger_import_pattern = r"import\s*\{\s*logger\s*\}\s*from\s*['\"]([^'\"]*)['\"]"
        
        imports = re.findall(logger_import_pattern, content)
        unique_imports = list(set(imports))
        
        if len(imports) > len(unique_imports):
            # We have duplicates - remove the local ones, keep utils/logger
            lines = content.split('\n')
            filtered_lines = []
            seen_imports = set()
            
            for line in lines:
                import_match = re.search(logger_import_pattern, line)
                if import_match:
                    import_path = import_match.group(1)
                    if import_path in seen_imports:
                        # Skip duplicate import
                        fixes_count += 1
                        continue
                    elif 'utils/logger' in import_path:
                        # Keep the utils/logger import
                        seen_imports.add(import_path)
                        filtered_lines.append(line)
                    else:
                        # Remove local logger import
                        fixes_count += 1
                        seen_imports.add(import_path)
                        continue
                else:
                    filtered_lines.append(line)
            
            content = '\n'.join(filtered_lines)
        
        return content, fixes_count
    
    def fix_misplaced_imports(self, content: str, file_path: Path) -> Tuple[str, int]:
        """Fix import statements inside function bodies"""
        original_content = content
        fixes_count = 0
        
        # Pattern to find import statements inside functions
        # Look for "import" statements that are indented (inside functions/classes)
        lines = content.split('\n')
        fixed_lines = []
        
        # Extract all import statements from inside functions
        extracted_imports = []
        in_function = False
        indentation_level = 0
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            # Track when we're inside a function
            if stripped.startswith(('function', 'const', 'let', 'var', 'class')) and '{' in line:
                in_function = True
                indentation_level = len(line) - len(line.lstrip())
            elif stripped == '}' and in_function:
                in_function = False
            elif stripped.startswith('import ') and in_function and len(line) > len(line.lstrip()):
                # This is an import inside a function - extract it
                extracted_imports.append(line.strip())
                fixes_count += 1
                continue
            
            fixed_lines.append(line)
        
        # If we found misplaced imports, move them to the top
        if extracted_imports:
            # Find where to insert the imports (after existing imports)
            insert_point = 0
            for i, line in enumerate(fixed_lines):
                if line.strip() and not line.strip().startswith('//') and not line.strip().startswith('import') and not line.strip().startswith('from'):
                    insert_point = i
                    break
            
            # Insert extracted imports at the top
            for imp in reversed(extracted_imports):
                fixed_lines.insert(insert_point, imp)
        
        content = '\n'.join(fixed_lines)
        
        return content, fixes_count
    
    def process_file(self, file_path: Path) -> bool:
        """Process a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            self.files_processed += 1
            
            # Apply fixes
            modified_content = original_content
            duplicate_fixes = 0
            misplaced_fixes = 0
            
            # Fix duplicate logger imports
            modified_content, duplicate_fixes = self.fix_duplicate_logger_imports(modified_content, file_path)
            
            # Fix misplaced imports
            modified_content, misplaced_fixes = self.fix_misplaced_imports(modified_content, file_path)
            
            total_fixes = duplicate_fixes + misplaced_fixes
            
            if total_fixes > 0:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(modified_content)
                
                self.files_fixed += 1
                self.duplicate_imports_fixed += duplicate_fixes
                self.misplaced_imports_fixed += misplaced_fixes
                
                changes = []
                if duplicate_fixes > 0:
                    changes.append(f"fixed {duplicate_fixes} duplicate imports")
                if misplaced_fixes > 0:
                    changes.append(f"fixed {misplaced_fixes} misplaced imports")
                
                print(f"🔧 {file_path}: {', '.join(changes)}")
                return True
            else:
                print(f"✅ {file_path}: No fixes needed")
                return False
                
        except Exception as e:
            print(f"❌ {file_path}: Error processing file - {e}")
            return False
    
    def run(self) -> None:
        """Run the critical linter fix program"""
        print("🚀 Starting Critical Linter Issues Fix...")
        print(f"📁 Scanning directory: {SRC_DIR}")
        
        files = self.find_files_to_process()
        print(f"📄 Found {len(files)} files to process")
        
        if not files:
            print("❌ No files found to process")
            return
        
        print("\n🔧 Processing files...")
        print("-" * 60)
        
        # Focus on files with known issues first
        priority_files = [
            "src/v8/services/configCheckerServiceV8.ts",
            "src/v8/services/implicitFlowIntegrationServiceV8.ts", 
            "src/v8/services/jarRequestObjectServiceV8.ts",
            "src/v8/services/mfaConfigurationServiceV8.ts",
            "src/v8/services/oidcDiscoveryServiceV8.ts",
            "src/v8u/services/unifiedFlowIntegrationV8U.ts"
        ]
        
        # Process priority files first
        processed_files = set()
        for priority_file in priority_files:
            file_path = SRC_DIR / priority_file
            if file_path.exists():
                self.process_file(file_path)
                processed_files.add(str(file_path))
        
        # Process remaining files
        for file_path in files:
            if str(file_path) not in processed_files:
                self.process_file(file_path)
        
        print("-" * 60)
        print("\n📊 Summary:")
        print(f"   Files processed: {self.files_processed}")
        print(f"   Files modified: {self.files_fixed}")
        print(f"   Duplicate imports fixed: {self.duplicate_imports_fixed}")
        print(f"   Misplaced imports fixed: {self.misplaced_imports_fixed}")
        
        if self.files_fixed > 0:
            print(f"\n✅ Successfully fixed critical issues in {self.files_fixed} files!")
            print("💡 Try running 'npm run dev' again to see if build issues are resolved")
        else:
            print("\n✅ No critical issues found!")

def main():
    """Main entry point"""
    fixer = CriticalLinterFixer()
    fixer.run()

if __name__ == "__main__":
    main()
