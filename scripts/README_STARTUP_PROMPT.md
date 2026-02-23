# Startup Prompt Script

## Overview
The `startup-prompt.sh` script provides an interactive menu for clearing cache and killing processes during application startup.

## Usage

### Basic Usage
```bash
npm run start:prompt
```

### Direct Execution
```bash
./scripts/startup-prompt.sh
```

## Options Available

### 1. Normal Startup
- **Description**: Start the application without any cache clearing
- **Use Case**: When you want to start normally with existing cache

### 2. Clear dist Directory Only
- **Description**: Removes the `dist/` directory only
- **Use Case**: When build artifacts are causing issues but you want to keep Vite cache
- **Command**: `rm -rf dist`

### 3. Clear Vite Cache Only
- **Description**: Removes the `node_modules/.vite` directory only
- **Use Case**: When Vite cache is corrupted but build artifacts are fine
- **Command**: `rm -rf node_modules/.vite`

### 4. Clear Both dist and Vite Cache
- **Description**: Removes both `dist/` and `node_modules/.vite` directories
- **Use Case**: When you need a fresh build but don't want to kill running processes
- **Commands**: `rm -rf dist` and `rm -rf node_modules/.vite`

### 5. Kill Running Processes Only
- **Description**: Kills all running Vite and NPM processes
- **Use Case**: When processes are stuck or you need to free up ports
- **Command**: `pkill -f "vite\|npm"`

### 6. Full Reset
- **Description**: Kills processes AND clears all cache
- **Use Case**: When you want a completely fresh start
- **Commands**: `pkill -f "vite\|npm"`, `rm -rf dist`, `rm -rf node_modules/.vite`

### 7. Exit
- **Description**: Exit without starting the application
- **Use Case**: When you decide not to start after seeing the status

## Features

### Status Detection
The script automatically detects:
- **Running Processes**: Checks for Vite and NPM processes
- **Cache Status**: Checks if `dist/` and `node_modules/.vite` exist
- **Color-coded Output**: Green for existing, Red for not found

### Interactive Menu
- **Numbered Options**: Easy to select with single digit
- **Clear Descriptions**: Each option explains what it does
- **Confirmation Feedback**: Shows what actions were taken

### Safety Features
- **Error Handling**: Graceful handling of missing directories
- **Process Safety**: Only kills processes that are actually running
- **Exit Options**: Safe exit without making changes

## Example Output

```
========================================
    OAuth Playground Startup Options
========================================

Current Status:
  Vite processes running: Yes
  NPM processes running: No

Cache Status:
  dist directory: Exists
  Vite cache: Exists

Select startup options:
1) Normal startup (no cache clearing)
2) Clear dist directory only
3) Clear Vite cache only
4) Clear both dist and Vite cache
5) Kill running processes only
6) Full reset (kill processes + clear all cache)
7) Exit without starting

Enter your choice (1-7): 6

Performing full reset...
  Killing running processes...
  ✓ Processes killed
  Clearing caches...
  ✓ dist directory cleared
  ✓ Vite cache cleared

✓ Startup options applied

Starting development server...
```

## Technical Details

### Commands Executed

#### Clear dist directory
```bash
rm -rf dist
```

#### Clear Vite cache
```bash
rm -rf node_modules/.vite
```

#### Kill processes
```bash
pkill -f "vite\|npm"
```

### Process Detection
```bash
# Check for Vite processes
pgrep -f "vite"

# Check for NPM processes  
pgrep -f "npm"
```

### Directory Checks
```bash
# Check if dist exists
[ -d "dist" ]

# Check if Vite cache exists
[ -d "node_modules/.vite" ]
```

## Integration with Development Workflow

### Recommended Usage Patterns

#### **Daily Development**
- Use option 1 (Normal startup) for regular development
- Use option 3 (Clear Vite cache) if you encounter build issues
- Use option 5 (Kill processes) if ports are stuck

#### **After Major Changes**
- Use option 6 (Full reset) after pulling large changes
- Use option 4 (Clear both) if you updated dependencies
- Use option 2 (Clear dist) if you modified build configuration

#### **Troubleshooting**
- Use option 6 (Full reset) for persistent issues
- Use option 5 (Kill processes) for port conflicts
- Use option 3 (Clear Vite cache) for module resolution issues

## Benefits

### **Efficiency**
- **Quick Access**: All common startup actions in one menu
- **No Memorization**: Don't need to remember complex commands
- **Safety**: Prevents accidental deletion of wrong files

### **Clarity**
- **Status Visibility**: See what's running before making decisions
- **Clear Actions**: Each option explains exactly what it does
- **Feedback**: Confirmation of what was actually done

### **Flexibility**
- **Granular Control**: Choose exactly what to clear/kill
- **Safe Exit**: Option to back out without changes
- **Combination Options**: Mix and match actions as needed

## Troubleshooting

### Script Not Executable
```bash
chmod +x scripts/startup-prompt.sh
```

### Permission Denied
```bash
# Make sure script has execute permissions
ls -la scripts/startup-prompt.sh

# Add execute permissions if needed
chmod +x scripts/startup-prompt.sh
```

### Processes Not Killing
```bash
# Check if processes are actually running
ps aux | grep vite
ps aux | grep npm

# Force kill if needed
pkill -9 -f "vite\|npm"
```

### Cache Still Present
```bash
# Check directory permissions
ls -la dist/
ls -la node_modules/.vite/

# Manual removal if script fails
sudo rm -rf dist
sudo rm -rf node_modules/.vite
```

## Integration with Package.json

The script is integrated into npm scripts:

```json
{
  "scripts": {
    "start:prompt": "./scripts/startup-prompt.sh"
  }
}
```

This allows you to run:
```bash
npm run start:prompt
```

## Best Practices

### **When to Use Each Option**

1. **Option 1 (Normal)**: Daily development, no issues
2. **Option 2 (dist only)**: Build artifacts corrupted
3. **Option 3 (Vite cache only)**: Module resolution issues
4. **Option 4 (Both)**: After dependency updates
5. **Option 5 (Kill only)**: Port conflicts, stuck processes
6. **Option 6 (Full reset)**: After major changes, persistent issues
7. **Option 7 (Exit)**: When you change your mind

### **Safety Tips**
- **Option 6** is safest for troubleshooting unknown issues
- **Option 5** is good for port conflicts without losing cache
- **Option 3** is least destructive for Vite-specific issues
- **Option 2** is good when only build output is problematic

### **Performance Considerations**
- **Full reset** takes longest but is most thorough
- **Clear Vite cache** is usually sufficient for module issues
- **Kill processes** is fastest for port conflicts
- **Normal startup** is fastest when no issues exist
