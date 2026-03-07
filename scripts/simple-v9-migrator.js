const fs = require('fs');
const path = require('path');

console.log('Starting V9 Color Migration...');

// Simple color mappings
const colors = {
  '#3b82f6': 'V9_COLORS.PRIMARY.BLUE',
  '#2563eb': 'V9_COLORS.PRIMARY.BLUE_DARK',
  '#10b981': 'V9_COLORS.PRIMARY.GREEN',
  '#059669': 'V9_COLORS.PRIMARY.GREEN_DARK',
  '#ef4444': 'V9_COLORS.PRIMARY.RED',
  '#dc2626': 'V9_COLORS.PRIMARY.RED_DARK',
  '#f59e0b': 'V9_COLORS.PRIMARY.YELLOW',
  '#d97706': 'V9_COLORS.PRIMARY.YELLOW_DARK',
  '#1f2937': 'V9_COLORS.TEXT.GRAY_DARK',
  '#374151': 'V9_COLORS.TEXT.GRAY_DARK',
  '#6b7280': 'V9_COLORS.TEXT.GRAY_MEDIUM',
  '#475569': 'V9_COLORS.TEXT.GRAY_MEDIUM',
  '#64748b': 'V9_COLORS.TEXT.GRAY_MEDIUM',
  '#e5e7eb': 'V9_COLORS.TEXT.GRAY_LIGHTER',
  '#d1d5db': 'V9_COLORS.TEXT.GRAY_LIGHTER',
  '#e2e8f0': 'V9_COLORS.TEXT.GRAY_LIGHTER',
  '#f8fafc': 'V9_COLORS.BG.GRAY_LIGHT',
  '#ffffff': 'V9_COLORS.BG.WHITE',
  '#000000': 'V9_COLORS.TEXT.BLACK'
};

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    let colorCount = 0;

    // Add import if needed
    if (!content.includes('V9_COLORS') && content.includes('#')) {
      const lines = content.split('\n');
      let importIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import')) {
          importIndex = i + 1;
        } else if (lines[i].trim() === '' && importIndex > 0) {
          break;
        }
      }
      
      const relativePath = path.relative(path.dirname(filePath), 'src/services/v9/V9ColorStandards').replace(/\\/g, '/');
      lines.splice(importIndex, 0, `import { V9_COLORS } from '${relativePath}';`);
      content = lines.join('\n');
      changed = true;
    }

    // Replace colors
    for (const [hex, v9] of Object.entries(colors)) {
      const regex = new RegExp(hex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (regex.test(content)) {
        content = content.replace(regex, v9);
        changed = true;
        colorCount++;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${filePath} - ${colorCount} colors`);
      return true;
    }
  } catch (error) {
    console.log(`❌ ${filePath} - ${error.message}`);
  }
  return false;
}

function findFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const files = [];
  
  if (!fs.existsSync(dir)) return files;
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findFiles(fullPath, extensions));
    } else if (extensions.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Process files
const targetDirs = ['src/pages', 'src/components'];
let totalFiles = 0;
let processedFiles = 0;

for (const dir of targetDirs) {
  const files = findFiles(dir);
  totalFiles += files.length;
  
  for (const file of files) {
    if (processFile(file)) {
      processedFiles++;
    }
  }
}

console.log(`\n📊 Summary: ${processedFiles}/${totalFiles} files processed`);
console.log('🎉 Migration completed!');
