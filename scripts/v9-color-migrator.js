#!/usr/bin/env node

/**
 * V9 Color Migration Script
 * Automatically migrates hardcoded hex colors to V9 color standards
 */

import fs from 'fs';
import path from 'path';

// V9 Color mappings
const V9_COLOR_MAPPINGS = {
  // Primary colors
  '#3b82f6': 'COLORS.PRIMARY.BLUE',
  '#2563eb': 'COLORS.PRIMARY.BLUE_DARK', 
  '#1d4ed8': 'COLORS.PRIMARY.BLUE_DARK',
  '#60a5fa': 'COLORS.PRIMARY.BLUE_LIGHT',
  
  '#10b981': 'COLORS.PRIMARY.GREEN',
  '#059669': 'COLORS.PRIMARY.GREEN_DARK',
  '#34d399': 'COLORS.PRIMARY.GREEN_LIGHT',
  '#22c55e': 'COLORS.PRIMARY.GREEN',
  '#16a34a': 'COLORS.PRIMARY.GREEN_DARK',
  
  '#ef4444': 'COLORS.PRIMARY.RED',
  '#dc2626': 'COLORS.PRIMARY.RED_DARK',
  '#f87171': 'COLORS.PRIMARY.RED_LIGHT',
  '#b91c1c': 'COLORS.PRIMARY.RED_DARK',
  '#991b1b': 'COLORS.PRIMARY.RED_DARK',
  
  '#f59e0b': 'COLORS.PRIMARY.YELLOW',
  '#d97706': 'COLORS.PRIMARY.YELLOW_DARK',
  '#fbbf24': 'COLORS.PRIMARY.YELLOW_LIGHT',
  '#facc15': 'COLORS.PRIMARY.YELLOW',
  
  // Text colors
  '#1f2937': 'COLORS.TEXT.GRAY_DARK',
  '#374151': 'COLORS.TEXT.GRAY_DARK',
  '#111827': 'COLORS.TEXT.GRAY_DARK',
  '#0f172a': 'COLORS.TEXT.GRAY_DARK',
  '#0c4a6e': 'COLORS.TEXT.GRAY_DARK',
  
  '#6b7280': 'COLORS.TEXT.GRAY_MEDIUM',
  '#475569': 'COLORS.TEXT.GRAY_MEDIUM',
  '#64748b': 'COLORS.TEXT.GRAY_MEDIUM',
  '#9ca3af': 'COLORS.TEXT.GRAY_LIGHT',
  
  '#e5e7eb': 'COLORS.TEXT.GRAY_LIGHTER',
  '#d1d5db': 'COLORS.TEXT.GRAY_LIGHTER',
  '#e2e8f0': 'COLORS.TEXT.GRAY_LIGHTER',
  '#cbd5f5': 'COLORS.TEXT.GRAY_LIGHTER',
  '#bae6fd': 'COLORS.TEXT.GRAY_LIGHTER',
  '#bfdbfe': 'COLORS.TEXT.GRAY_LIGHTER',
  
  '#ffffff': 'COLORS.BG.WHITE',
  '#f8fafc': 'COLORS.BG.GRAY_LIGHT',
  '#f1f5f9': 'COLORS.BG.GRAY_MEDIUM',
  '#eff6ff': 'COLORS.BG.GRAY_LIGHT',
  '#f0f9ff': 'COLORS.BG.GRAY_LIGHT',
  '#e0f2fe': 'COLORS.BG.GRAY_LIGHT',
  
  // Success/Error/Warning backgrounds
  '#d1fae5': 'COLORS.BG.SUCCESS',
  '#ecfdf5': 'COLORS.BG.SUCCESS',
  '#dcfce7': 'COLORS.BG.SUCCESS',
  '#bbf7d0': 'COLORS.BG.SUCCESS_BORDER',
  
  '#fef2f2': 'COLORS.BG.ERROR',
  '#fee2e2': 'COLORS.BG.ERROR',
  '#fecaca': 'COLORS.BG.ERROR_BORDER',
  
  '#fef3c7': 'COLORS.BG.WARNING',
  '#fffbeb': 'COLORS.BG.WARNING',
  '#fde68a': 'COLORS.BG.WARNING_BORDER',
  
  // Other common colors
  '#000000': 'COLORS.TEXT.BLACK',
  '#000': 'COLORS.TEXT.BLACK',
  '#fff': 'COLORS.TEXT.WHITE',
  '#ffffff': 'COLORS.TEXT.WHITE',
  '#1a202c': 'COLORS.TEXT.BLACK',
  '#2d3748': 'COLORS.TEXT.GRAY_MEDIUM',
  '#0369a1': 'COLORS.PRIMARY.BLUE',
  '#1e40af': 'COLORS.PRIMARY.BLUE_DARK',
  '#166534': 'COLORS.PRIMARY.GREEN',
  '#065f46': 'COLORS.PRIMARY.GREEN_DARK',
  '#92400e': 'COLORS.PRIMARY.YELLOW_DARK',
  '#0284c7': 'COLORS.PRIMARY.BLUE',
  '#0891b2': 'COLORS.PRIMARY.BLUE',
  '#0e7490': 'COLORS.PRIMARY.BLUE_DARK',
};

class V9ColorMigrator {
  constructor() {
    this.processedFiles = 0;
    this.migratedColors = 0;
    this.errors = [];
  }

  findTargetFiles() {
    const files = [];
    const TARGET_DIRECTORIES = ['src/pages', 'src/components'];
    const TARGET_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];
    
    for (const dir of TARGET_DIRECTORIES) {
      if (!fs.existsSync(dir)) continue;
      
      const getAllFiles = (currentDir) => {
        const items = fs.readdirSync(currentDir);
        for (const item of items) {
          const fullPath = path.join(currentDir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            getAllFiles(fullPath);
          } else if (TARGET_EXTENSIONS.includes(path.extname(fullPath))) {
            files.push(fullPath);
          }
        }
      };
      
      getAllFiles(dir);
    }
    
    return files;
  }

  hasV9Import(content) {
    return content.includes('COLORS') || content.includes('v9/ColorStandards');
  }

  addV9Import(content, filePath) {
    if (content.includes('import { COLORS }')) {
      return content;
    }
    
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find last import
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '' && insertIndex > 0) {
        break;
      }
    }
    
    // Calculate relative path
    const fileDir = path.dirname(filePath);
    const relativePath = path.relative(fileDir, 'src/platform/ColorStandards').replace(/\\/g, '/');
    
    lines.splice(insertIndex, 0, `import { COLORS } from '${relativePath}';`);
    return lines.join('\n');
  }

  migrateColors(content) {
    let migratedContent = content;
    let colorCount = 0;

    for (const [hexColor, v9Color] of Object.entries(V9_COLOR_MAPPINGS)) {
      const regex = new RegExp(hexColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = migratedContent.match(regex);
      if (matches) {
        migratedContent = migratedContent.replace(regex, v9Color);
        colorCount += matches.length;
      }
    }

    return { content: migratedContent, colorCount };
  }

  processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;

      if (!this.hasV9Import(content)) {
        content = this.addV9Import(content, filePath);
      }

      const { content: migratedContent, colorCount } = this.migrateColors(content);

      if (migratedContent !== originalContent) {
        fs.writeFileSync(filePath, migratedContent, 'utf8');
        this.processedFiles++;
        this.migratedColors += colorCount;
        
        console.log(`✅ ${filePath} - migrated ${colorCount} colors`);
      } else {
        console.log(`⚪ ${filePath} - no changes needed`);
      }

    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      console.log(`❌ ${filePath} - ERROR: ${error.message}`);
    }
  }

  run() {
    console.log('🚀 Starting V9 Color Migration...\n');
    
    const files = this.findTargetFiles();
    console.log(`📁 Found ${files.length} files to process\n`);

    for (const file of files) {
      this.processFile(file);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Files processed: ${this.processedFiles}`);
    console.log(`🎨 Colors migrated: ${this.migratedColors}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      this.errors.forEach(({ file, error }) => {
        console.log(`  ${file}: ${error}`);
      });
    }

    console.log('\n🎉 Migration completed!');
  }
}

// Run the migrator
const migrator = new V9ColorMigrator();
migrator.run();

export default V9ColorMigrator;
