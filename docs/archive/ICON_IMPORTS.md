# Icon Import Management

This project includes automated tools to ensure all React Icons are properly imported, preventing runtime errors like "FiBarChart2 is not defined".

## 🔧 Tools Available

### 1. Automated Script
- **Location**: `scripts/check-icon-imports.js`
- **Purpose**: Scans all TSX/TS files and automatically adds missing icon imports
- **Features**:
  - Detects all `<FiIconName>` usage in your code
  - Compares with existing imports from `react-icons/fi`
  - Automatically adds missing imports in alphabetical order
  - Processes entire codebase recursively

### 2. NPM Scripts
```bash
# Check and fix missing icon imports
npm run icons:check

# Alias for icons:check (same functionality)
npm run icons:fix

# Quick shell script
./scripts/check-icons.sh
```

### 3. VS Code Tasks
- **Task Name**: "Check Icon Imports"
- **Task Name**: "Fix Icon Imports"
- Access via: `Cmd+Shift+P` → "Tasks: Run Task"

### 4. Pre-commit Hook
Automatically runs `npm run icons:fix` before each commit, ensuring no missing imports reach the repository.

## 🚀 Usage Examples

### Before Commit
```bash
# The pre-commit hook runs automatically, but you can also run manually:
npm run icons:fix
git add .
git commit -m "feat: add new feature with icons"
```

### During Development
```bash
# After adding new icons to components
npm run icons:fix
```

### CI/CD Pipeline
The script can be integrated into CI to ensure all PRs have proper icon imports:
```yaml
- name: Check icon imports
  run: npm run icons:check
```

## 📋 What the Script Does

1. **Scans** all `.ts` and `.tsx` files in the specified directory
2. **Extracts** all icon usage patterns like `<FiBarChart2 />`
3. **Compares** with existing imports from `react-icons/fi`
4. **Adds** missing imports automatically, sorted alphabetically
5. **Reports** summary of files checked and updated

## 🎯 Benefits

- ✅ **Prevents Runtime Errors**: No more "FiBarChart2 is not defined" errors
- ✅ **Automatic**: No manual import management needed
- ✅ **Pre-commit Safety**: Catches issues before they reach the repo
- ✅ **Fast**: Scans entire codebase in seconds
- ✅ **Non-destructive**: Only adds missing imports, never removes existing ones

## 🐛 Troubleshooting

### Script reports "Could not find react-icons/fi import"
This means the file uses icons but doesn't have any react-icons/fi import yet. The script will skip these files. You need to add at least one icon import manually first:

```tsx
import { FiSomeIcon } from 'react-icons/fi';
```

Then run the script again to add the rest.

### Icons not being detected
Make sure icons follow the pattern `<FiIconName />`. The script only detects:
- `<FiIconName />`
- `<FiIconName>`
- Nested in JSX: `<div><FiIconName /></div>`

## 📝 Example Output

```
🔍 Scanning for missing icon imports in: src

🔍 Found missing icons in MyComponent.tsx: BarChart, Trash
✅ Updated imports in MyComponent.tsx
✅ All icons are already imported in OtherComponent.tsx

📊 Summary:
   Files with icons: 699
   Files updated: 61

✨ All missing icon imports have been added!
💡 Run this script before committing to ensure all icons are imported.
```

## 🔄 Integration with Development Workflow

1. **Add new icons** to your components
2. **Run** `npm run icons:fix` (or let pre-commit handle it)
3. **Commit** with confidence that all icons are imported

This ensures a smooth development experience without worrying about missing icon imports!
