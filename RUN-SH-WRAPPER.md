# Base Directory run.sh Wrapper

This `run.sh` script in the base directory is a **wrapper** that forwards to the actual development script.

## 📍 Purpose

Provides a simple, memorable way to start the servers without needing to remember the full path to the development script.

## 🚀 Usage

```bash
# From the base directory (oauth-playground/)
./run.sh              # Interactive mode
./run.sh -quick       # Quick mode (no prompts)  
./run.sh -default     # Default mode (use existing config)
./run.sh --help       # Show help
```

## 📁 What It Does

1. **Detects script location** - Finds the correct development script path
2. **Validates script exists** - Ensures `scripts/development/run.sh` is available
3. **Makes script executable** - Ensures proper permissions
4. **Forwards all arguments** - Passes all command-line arguments to the development script
5. **Executes development script** - Runs the actual server management logic

## 🔗 Actual Script Location

The real server management logic is in:
```
scripts/development/run.sh
```

## 📋 Benefits

- ✅ **Easy to remember** - Just `./run.sh` from anywhere in the project
- ✅ **All features available** - Same options and functionality as the development script
- ✅ **Forward-compatible** - Will work with future updates to the development script
- ✅ **Error handling** - Clear error messages if the development script is missing

## 🔄 Migration

The old `run.sh` was deprecated and backed up to `run.sh.backup`. The new wrapper provides a clean interface to the modern development script.

## 📚 More Information

See `scripts/development/run.sh --help` for comprehensive documentation of all available options and features.
