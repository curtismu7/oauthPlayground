#!/usr/bin/env python3
"""
Logger Fix Program - Automatically replace console/log calls with proper logger system

This script scans the codebase and:
1. Finds files with console/log calls without logger import
2. Adds logger import where needed
3. Replaces console.log/warn/error with logger methods
4. Replaces log.info/warn/error/success/debug with logger methods
5. Handles multiple file types and patterns
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Dict, Set, Tuple

# Configuration
SRC_DIR = Path("src")
IGNORE_PATTERNS = [
    "*.lock",
    "*.backup",
    "*.old",
    "node_modules",
    ".git",
    "dist",
    "build"
]

# File patterns to process
INCLUDE_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}

# Logger import patterns
LOGGER_IMPORTS = [
    "import { logger } from '../utils/logger';",
    "import { logger } from './utils/logger';",
    "import { logger } from '@/utils/logger';",
    "import logger from '../utils/logger';",
    "import logger from './utils/logger';",
    "import logger from '@/utils/logger';",
]

# Console/log patterns to replace
REPLACEMENTS = [
    # console calls
    (r'console\.log\(', 'logger.info('),
    (r'console\.warn\(', 'logger.warn('),
    (r'console\.error\(', 'logger.error('),
    (r'console\.info\(', 'logger.info('),
    (r'console\.debug\(', 'logger.debug('),
    
    # log calls (without logger import)
    (r'blog\.info\(', 'logger.info('),  # Handle 'log.' that might be typos
    (r'blog\.warn\(', 'logger.warn('),
    (r'blog\.error\(', 'logger.error('),
    (r'blog\.debug\(', 'logger.debug('),
    (r'blog\.success\(', 'logger.success('),
    
    # Standard log calls
    (r'(?<!logger\.)log\.info\(', 'logger.info('),
    (r'(?<!logger\.)log\.warn\(', 'logger.warn('),
    (r'(?<!logger\.)log\.error\(', 'logger.error('),
    (r'(?<!logger\.)log\.debug\(', 'logger.debug('),
    (r'(?<!logger\.)log\.success\(', 'logger.success('),
    (r'(?<!logger\.)log\.flow\(', 'logger.flow('),
    (r'(?<!logger\.)log\.auth\(', 'logger.auth('),
    (r'(?<!logger\.)log\.config\(', 'logger.config('),
    (r'(?<!logger\.)log\.api\(', 'logger.api('),
    (r'(?<!logger\.)log\.storage\(', 'logger.storage('),
    (r'(?<!logger\.)log\.ui\(', 'logger.ui('),
    (r'(?<!logger\.)log\.security\(', 'logger.security('),
]

class LoggerFixer:
    def __init__(self):
        self.files_processed = 0
        self.files_modified = 0
        self.console_calls_fixed = 0
        self.imports_added = 0
        
    def find_files_to_process(self) -> List[Path]:
        """Find all relevant files in the source directory"""
        files = []
        
        if not SRC_DIR.exists():
            print(f"❌ Source directory {SRC_DIR} not found")
            return files
            
        for file_path in SRC_DIR.rglob("*"):
            # Skip directories and ignored patterns
            if file_path.is_dir():
                continue
                
            # Check if file should be processed
            if file_path.suffix in INCLUDE_EXTENSIONS:
                # Skip files that match ignore patterns
                skip = False
                for pattern in IGNORE_PATTERNS:
                    if pattern in str(file_path):
                        skip = True
                        break
                if not skip:
                    files.append(file_path)
                    
        return sorted(files)
    
    def has_logger_import(self, content: str) -> bool:
        """Check if file already has logger import"""
        return any(import_line in content for import_line in LOGGER_IMPORTS)
    
    def has_console_or_log_calls(self, content: str) -> bool:
        """Check if file has console or log calls that need fixing"""
        patterns = [
            r'console\.(log|warn|error|info|debug)\(',
            r'(?<!logger\.)log\.(info|warn|error|debug|success|flow|auth|config|api|storage|ui|security)\(',
            r'blog\.(info|warn|error|debug|success)\(',
        ]
        return any(re.search(pattern, content) for pattern in patterns)
    
    def determine_best_import(self, file_path: Path) -> str:
        """Determine the best logger import based on file location"""
        # Calculate relative path to utils/logger
        file_parts = file_path.parts
        try:
            utils_index = file_parts.index('src')
            file_after_src = file_parts[utils_index + 1:]
            
            # Count how many directories deep we are
            depth = len(file_after_src) - 1
            
            if depth == 0:
                # Directly in src
                return "import { logger } from './utils/logger';"
            elif depth == 1:
                # One level deep
                return "import { logger } from '../utils/logger';"
            else:
                # Multiple levels deep
                relative_path = '../' * (depth - 1) + 'utils/logger'
                return f"import {{ logger }} from '{relative_path}';"
        except (ValueError, IndexError):
            # Fallback to absolute import
            return "import { logger } from '@/utils/logger';"
    
    def add_logger_import(self, content: str, file_path: Path) -> Tuple[str, bool]:
        """Add logger import to the file content"""
        if self.has_logger_import(content):
            return content, False
            
        # Find the best place to add the import (after other imports)
        import_line = self.determine_best_import(file_path)
        
        # Look for import patterns to find insertion point
        import_patterns = [
            r"(import.*from.*['\"].*['\"]\s*;\s*\n)",
            r"(import.*;\s*\n)",
        ]
        
        for pattern in import_patterns:
            matches = list(re.finditer(pattern, content, re.MULTILINE))
            if matches:
                # Insert after the last import
                last_match = matches[-1]
                insertion_point = last_match.end()
                return (
                    content[:insertion_point] + 
                    import_line + "\n" + 
                    content[insertion_point:], 
                    True
                )
        
        # Fallback: add after the first line (usually comments or imports)
        lines = content.split('\n')
        if len(lines) > 1:
            lines.insert(1, import_line)
            return '\n'.join(lines), True
        
        # Last resort: add at the beginning
        return import_line + '\n' + content, True
    
    def fix_console_and_log_calls(self, content: str) -> Tuple[str, int]:
        """Replace console and log calls with logger calls"""
        fixed_content = content
        fixes_count = 0
        
        for pattern, replacement in REPLACEMENTS:
            matches = list(re.finditer(pattern, fixed_content))
            if matches:
                # Replace all occurrences
                fixed_content = re.sub(pattern, replacement, fixed_content)
                fixes_count += len(matches)
        
        return fixed_content, fixes_count
    
    def process_file(self, file_path: Path) -> bool:
        """Process a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            self.files_processed += 1
            
            # Check if file needs fixes
            needs_import = not self.has_logger_import(original_content)
            has_calls_to_fix = self.has_console_or_log_calls(original_content)
            
            if not needs_import and not has_calls_to_fix:
                print(f"✅ {file_path}: No fixes needed")
                return False
            
            # Apply fixes
            modified_content = original_content
            import_added = False
            calls_fixed = 0
            
            # Add logger import if needed
            if needs_import and has_calls_to_fix:
                modified_content, import_added = self.add_logger_import(modified_content, file_path)
                if import_added:
                    self.imports_added += 1
            
            # Fix console and log calls
            if has_calls_to_fix:
                modified_content, calls_fixed = self.fix_console_and_log_calls(modified_content)
                self.console_calls_fixed += calls_fixed
            
            # Write back if changes were made
            if modified_content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(modified_content)
                
                self.files_modified += 1
                
                changes = []
                if import_added:
                    changes.append("added logger import")
                if calls_fixed > 0:
                    changes.append(f"fixed {calls_fixed} console/log calls")
                
                print(f"🔧 {file_path}: {', '.join(changes)}")
                return True
            else:
                print(f"✅ {file_path}: No changes needed")
                return False
                
        except Exception as e:
            print(f"❌ {file_path}: Error processing file - {e}")
            return False
    
    def run(self) -> None:
        """Run the logger fix program"""
        print("🚀 Starting Logger Fix Program...")
        print(f"📁 Scanning directory: {SRC_DIR}")
        
        files = self.find_files_to_process()
        print(f"📄 Found {len(files)} files to process")
        
        if not files:
            print("❌ No files found to process")
            return
        
        print("\n🔧 Processing files...")
        print("-" * 60)
        
        for file_path in files:
            self.process_file(file_path)
        
        print("-" * 60)
        print("\n📊 Summary:")
        print(f"   Files processed: {self.files_processed}")
        print(f"   Files modified: {self.files_modified}")
        print(f"   Logger imports added: {self.imports_added}")
        print(f"   Console/log calls fixed: {self.console_calls_fixed}")
        
        if self.files_modified > 0:
            print(f"\n✅ Successfully fixed {self.files_modified} files!")
            print("💡 Run 'npx @biomejs/biome check' to verify the fixes")
        else:
            print("\n✅ No files needed fixing!")

def main():
    """Main entry point"""
    fixer = LoggerFixer()
    fixer.run()

if __name__ == "__main__":
    main()
