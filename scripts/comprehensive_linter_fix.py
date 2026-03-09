#!/usr/bin/env python3
"""
Comprehensive Linter Fix - Handle all fixable linter issues automatically

This script runs Biome with --write flag to automatically fix all fixable issues
including import organization, formatting, and simple lint fixes.
"""

import os
import subprocess
import sys
from pathlib import Path
from typing import List, Dict

# Configuration
SRC_DIR = Path("src")

class ComprehensiveLinterFixer:
    def __init__(self):
        self.files_processed = 0
        self.files_fixed = 0
        self.errors_before = 0
        self.errors_after = 0
        
    def get_error_count(self) -> int:
        """Get current error count from Biome"""
        try:
            result = subprocess.run(
                ["npx", "@biomejs/biome", "check", "--max-diagnostics=0", str(SRC_DIR)],
                capture_output=True,
                text=True,
                cwd="."
            )
            
            # Parse output to find error count
            for line in result.stdout.split('\n'):
                if 'Found' in line and 'errors' in line:
                    parts = line.split()
                    for i, part in enumerate(parts):
                        if part == 'Found' and i + 1 < len(parts):
                            try:
                                return int(parts[i + 1])
                            except ValueError:
                                continue
            return 0
        except Exception:
            return 0
    
    def run_biome_fix(self) -> bool:
        """Run Biome with --write to fix all fixable issues"""
        print("🔧 Running comprehensive Biome fix...")
        
        try:
            # Get error count before
            self.errors_before = self.get_error_count()
            print(f"📊 Errors before fix: {self.errors_before}")
            
            # Run Biome with write flag
            result = subprocess.run(
                [
                    "npx", "@biomejs/biome", "check", 
                    "--write",
                    "--max-diagnostics=1000",
                    "--files-max-size=500000",
                    str(SRC_DIR)
                ],
                capture_output=True,
                text=True,
                cwd="."
            )
            
            # Get error count after
            self.errors_after = self.get_error_count()
            print(f"📊 Errors after fix: {self.errors_after}")
            
            # Parse output for summary
            fixed_files = 0
            if result.stdout:
                for line in result.stdout.split('\n'):
                    if 'Fixed' in line or 'wrote' in line:
                        fixed_files += 1
            
            self.files_fixed = fixed_files
            
            print(f"📈 Files fixed: {fixed_files}")
            print(f"📉 Errors reduced: {self.errors_before - self.errors_after}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error running Biome fix: {e}")
            return False
    
    def analyze_remaining_issues(self) -> Dict[str, int]:
        """Analyze remaining linter issues by category"""
        print("\n🔍 Analyzing remaining issues...")
        
        try:
            result = subprocess.run(
                ["npx", "@biomejs/biome", "check", "--max-diagnostics=200", str(SRC_DIR)],
                capture_output=True,
                text=True,
                cwd="."
            )
            
            categories = {}
            
            for line in result.stdout.split('\n'):
                if 'lint/' in line:
                    # Extract category from lint/category/error
                    if '/' in line:
                        parts = line.split('/')
                        if len(parts) >= 2:
                            category = parts[1].split('/')[0]
                            categories[category] = categories.get(category, 0) + 1
            
            return categories
            
        except Exception as e:
            print(f"❌ Error analyzing issues: {e}")
            return {}
    
    def generate_priority_plan(self, categories: Dict[str, int]) -> List[str]:
        """Generate a prioritized plan for remaining issues"""
        plan = []
        
        # Priority order based on impact and difficulty
        priority_order = [
            ("correctness", "High Priority: Code correctness issues"),
            ("security", "High Priority: Security vulnerabilities"),
            ("a11y", "Medium Priority: Accessibility improvements"),
            ("complexity", "Medium Priority: Code complexity"),
            ("suspicious", "Low Priority: Suspicious code patterns"),
            ("style", "Low Priority: Style issues"),
            ("nursery", "Low Priority: Experimental rules"),
        ]
        
        print("\n📋 Remaining Issues Analysis:")
        print("-" * 50)
        
        for category, description in priority_order:
            if category in categories:
                count = categories[category]
                print(f"  {category.upper()}: {count} issues - {description}")
                plan.append(f"{category}: {count} issues")
        
        return plan
    
    def run(self) -> None:
        """Main execution"""
        print("🚀 Starting Comprehensive Linter Fix...")
        print(f"📁 Target directory: {SRC_DIR}")
        
        # Run the comprehensive fix
        if self.run_biome_fix():
            print("\n✅ Comprehensive fix completed!")
            
            # Analyze remaining issues
            categories = self.analyze_remaining_issues()
            
            if categories:
                plan = self.generate_priority_plan(categories)
                
                print(f"\n📊 Summary:")
                print(f"   Errors before: {self.errors_before}")
                print(f"   Errors after: {self.errors_after}")
                print(f"   Errors fixed: {self.errors_before - self.errors_after}")
                print(f"   Files modified: {self.files_fixed}")
                
                if self.errors_before > self.errors_after:
                    improvement = ((self.errors_before - self.errors_after) / self.errors_before) * 100
                    print(f"   Improvement: {improvement:.1f}%")
                
                print(f"\n🎯 Next Steps:")
                if self.errors_after > 0:
                    print("   1. Focus on correctness and security issues first")
                    print("   2. Address accessibility improvements")
                    print("   3. Handle complexity and style issues")
                    print("   4. Consider creating specialized automation scripts")
                else:
                    print("   🎉 All issues resolved!")
            else:
                print("\n🎉 No remaining issues found!")
        else:
            print("\n❌ Comprehensive fix failed!")

def main():
    """Main entry point"""
    fixer = ComprehensiveLinterFixer()
    fixer.run()

if __name__ == "__main__":
    main()
