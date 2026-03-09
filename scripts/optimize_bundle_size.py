#!/usr/bin/env python3
"""
Bundle Size Optimization Script

This script analyzes and optimizes the bundle size by:
1. Identifying large components
2. Adding lazy loading where appropriate
3. Optimizing imports
4. Suggesting code splitting strategies
"""

import os
import re
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Set, Tuple

# Configuration
SRC_DIR = Path("src")
LARGE_COMPONENT_THRESHOLD = 1000  # lines
MASSIVE_COMPONENT_THRESHOLD = 5000  # lines

class BundleOptimizer:
    def __init__(self):
        self.large_components = []
        self.massive_components = []
        self.optimization_suggestions = []
        
    def find_large_components(self) -> List[Tuple[Path, int]]:
        """Find components that are too large"""
        large_files = []
        
        if not SRC_DIR.exists():
            print(f"❌ Source directory {SRC_DIR} not found")
            return large_files
            
        for file_path in SRC_DIR.rglob("*"):
            if file_path.is_file() and file_path.suffix in {".ts", ".tsx"}:
                # Skip node_modules and other ignored directories
                if any(ignored in str(file_path) for ignored in ["node_modules", ".git", "dist", "build", "locked"]):
                    continue
                    
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        line_count = sum(1 for _ in f)
                        
                        if line_count > MASSIVE_COMPONENT_THRESHOLD:
                            self.massive_components.append((file_path, line_count))
                        elif line_count > LARGE_COMPONENT_THRESHOLD:
                            self.large_components.append((file_path, line_count))
                            
                except Exception as e:
                    print(f"❌ Error reading {file_path}: {e}")
                    
        return sorted(self.large_components + self.massive_components, key=lambda x: x[1], reverse=True)
    
    def analyze_imports(self, file_path: Path) -> Dict[str, List[str]]:
        """Analyze imports in a file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            imports = {
                'react': [],
                'components': [],
                'services': [],
                'utils': [],
                'pages': [],
                'other': []
            }
            
            # Find import statements
            import_pattern = r"import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['\"]([^'\"]+)['\"]"
            matches = re.findall(import_pattern, content)
            
            for import_path in matches:
                if 'react' in import_path:
                    imports['react'].append(import_path)
                elif '/components/' in import_path:
                    imports['components'].append(import_path)
                elif '/services/' in import_path:
                    imports['services'].append(import_path)
                elif '/utils/' in import_path:
                    imports['utils'].append(import_path)
                elif '/pages/' in import_path:
                    imports['pages'].append(import_path)
                else:
                    imports['other'].append(import_path)
                    
            return imports
            
        except Exception as e:
            print(f"❌ Error analyzing imports in {file_path}: {e}")
            return {}
    
    def suggest_lazy_loading(self, file_path: Path, line_count: int) -> List[str]:
        """Suggest lazy loading opportunities"""
        suggestions = []
        imports = self.analyze_imports(file_path)
        
        # Suggest lazy loading for large component imports
        for component_import in imports['components']:
            if 'UnifiedFlowSteps' in component_import:
                suggestions.append(f"Lazy load UnifiedFlowSteps: const UnifiedFlowSteps = lazy(() => import('{component_import}'))")
                
        # Suggest lazy loading for large service imports
        for service_import in imports['services']:
            if 'postmanCollectionGenerator' in service_import:
                suggestions.append(f"Lazy load PostmanCollectionGenerator: const PostmanGenerator = lazy(() => import('{service_import}'))")
                
        # Suggest lazy loading for large page imports
        for page_import in imports['pages']:
            if line_count > 2000:  # Only for very large files
                suggestions.append(f"Consider lazy loading page: const {Path(page_import).stem} = lazy(() => import('{page_import}'))")
                
        return suggestions
    
    def check_current_lazy_loading(self, file_path: Path) -> bool:
        """Check if file already uses lazy loading"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                return 'lazy(' in content and 'import(' in content
        except Exception:
            return False
    
    def generate_optimization_report(self) -> None:
        """Generate optimization report"""
        print("🔍 Analyzing bundle size optimization opportunities...")
        print("=" * 60)
        
        large_components = self.find_large_components()
        
        if not large_components:
            print("✅ No large components found!")
            return
            
        print(f"\n📊 Found {len(large_components)} large components:")
        print("-" * 40)
        
        for i, (file_path, line_count) in enumerate(large_components[:10], 1):
            relative_path = file_path.relative_to(SRC_DIR)
            has_lazy_loading = self.check_current_lazy_loading(file_path)
            status = "🔄" if has_lazy_loading else "⚠️"
            
            print(f"{i:2d}. {status} {relative_path} ({line_count:,} lines)")
            
            if not has_lazy_loading and line_count > MASSIVE_COMPONENT_THRESHOLD:
                suggestions = self.suggest_lazy_loading(file_path, line_count)
                for suggestion in suggestions:
                    print(f"    💡 {suggestion}")
                    
        print("\n🎯 Optimization Summary:")
        print("-" * 25)
        
        massive_count = len(self.massive_components)
        large_count = len(self.large_components)
        
        print(f"Massive components (>5k lines): {massive_count}")
        print(f"Large components (>1k lines): {large_count}")
        
        if massive_count > 0:
            print(f"\n🚨 CRITICAL: {massive_count} massive components need immediate attention!")
            
        if large_count > 0:
            print(f"\n⚡ RECOMMENDED: {large_count} components could benefit from lazy loading")
            
    def run_build_analysis(self) -> None:
        """Run build and analyze bundle sizes"""
        print("\n🏗️ Running build analysis...")
        print("-" * 30)
        
        try:
            result = subprocess.run(
                ["npm", "run", "build"],
                capture_output=True,
                text=True,
                timeout=120
            )
            
            if result.returncode == 0:
                output = result.stdout
                
                # Extract bundle sizes
                bundle_pattern = r"dist/assets/([^\.]+)\.[^\.]+\.js\s+([0-9.]+)\s+(kB|MB)"
                bundles = re.findall(bundle_pattern, output)
                
                print("\n📦 Bundle Analysis:")
                print("-" * 20)
                
                total_size = 0
                for name, size, unit in bundles:
                    size_mb = float(size) / 1024 if unit == 'kB' else float(size)
                    total_size += size_mb
                    
                    if size_mb > 1.0:  # Show bundles larger than 1MB
                        print(f"📄 {name}: {size:.2f} {unit}")
                        
                print(f"\n📊 Total bundle size: {total_size:.2f} MB")
                
                if total_size > 5.0:
                    print("🚨 Bundle size is too large! Immediate optimization needed.")
                elif total_size > 2.0:
                    print("⚡ Bundle size could be optimized.")
                else:
                    print("✅ Bundle size is acceptable.")
                    
            else:
                print(f"❌ Build failed: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            print("❌ Build timed out")
        except Exception as e:
            print(f"❌ Error running build: {e}")
    
    def run(self) -> None:
        """Run the optimization analysis"""
        print("🚀 Bundle Size Optimization Analysis")
        print("=" * 50)
        
        # Analyze components
        self.generate_optimization_report()
        
        # Run build analysis
        self.run_build_analysis()
        
        print("\n🎯 Next Steps:")
        print("-" * 15)
        print("1. Add lazy loading to massive components")
        print("2. Split large components into smaller modules")
        print("3. Optimize imports and remove unused code")
        print("4. Consider code splitting by routes")
        print("5. Use dynamic imports for heavy dependencies")

def main():
    """Main entry point"""
    optimizer = BundleOptimizer()
    optimizer.run()

if __name__ == "__main__":
    main()
