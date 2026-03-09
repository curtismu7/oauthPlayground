#!/usr/bin/env python3
"""
Import Organization Automation - Fix all import organization issues

This script automatically fixes Biome import organization issues across the entire codebase
using Biome's built-in formatter with import sorting enabled.
"""

import os
import subprocess
import sys
from pathlib import Path
from typing import List

# Configuration
SRC_DIR = Path("src")

class ImportOrganizer:
    def __init__(self):
        self.files_processed = 0
        self.files_fixed = 0
        
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
    
    def fix_imports_with_biome(self, file_path: Path) -> bool:
        """Use Biome to fix import organization for a single file"""
        try:
            # Run Biome with import organization enabled
            result = subprocess.run(
                [
                    "npx", "@biomejs/biome", "format", 
                    "--write", 
                    "--import-sort-order=source",
                    str(file_path)
                ],
                capture_output=True,
                text=True,
                cwd="."
            )
            
            self.files_processed += 1
            
            # Check if Biome made changes (exit code 1 means changes were made)
            if result.returncode == 1:
                self.files_fixed += 1
                print(f"🔧 {file_path}: Fixed import organization")
                return True
            elif result.returncode == 0:
                print(f"✅ {file_path}: No changes needed")
                return True
            else:
                print(f"❌ {file_path}: Error - {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ {file_path}: Exception - {e}")
            return False
    
    def run_batch_fix(self, batch_size: int = 50) -> None:
        """Run Biome on batches of files for better performance"""
        files = self.find_files_to_process()
        print(f"📁 Found {len(files)} files to process")
        
        if not files:
            print("❌ No files found to process")
            return
        
        print(f"\n🔧 Processing files in batches of {batch_size}...")
        print("-" * 60)
        
        # Process files in batches
        for i in range(0, len(files), batch_size):
            batch = files[i:i + batch_size]
            batch_files = [str(f) for f in batch]
            
            try:
                # Run Biome on the entire batch
                result = subprocess.run(
                    [
                        "npx", "@biomejs/biome", "format",
                        "--write",
                        "--import-sort-order=source"
                    ] + batch_files,
                    capture_output=True,
                    text=True,
                    cwd="."
                )
                
                # Update counters
                self.files_processed += len(batch)
                
                # Parse output to see which files were changed
                if result.stdout:
                    for line in result.stdout.split('\n'):
                        if 'Fixed' in line or 'wrote' in line:
                            self.files_fixed += 1
                
                print(f"📦 Batch {i//batch_size + 1}/{(len(files)-1)//batch_size + 1}: {len(batch)} files processed")
                
            except Exception as e:
                print(f"❌ Batch {i//batch_size + 1} failed: {e}")
        
        print("-" * 60)
        print("\n📊 Summary:")
        print(f"   Files processed: {self.files_processed}")
        print(f"   Files fixed: {self.files_fixed}")
        
        if self.files_fixed > 0:
            print(f"\n✅ Successfully fixed imports in {self.files_fixed} files!")
        else:
            print("\n✅ All imports already organized!")

def main():
    """Main entry point"""
    print("🚀 Starting Import Organization Automation...")
    print(f"📁 Scanning directory: {SRC_DIR}")
    
    organizer = ImportOrganizer()
    organizer.run_batch_fix()

if __name__ == "__main__":
    main()
