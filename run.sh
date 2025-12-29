#!/bin/bash

###############################################################################
# ⚠️ CRITICAL FILE - DO NOT DELETE OR MOVE ⚠️
# 
# This file is the primary entry point for starting the OAuth Playground application.
# It delegates to scripts/dev/start-full-stack.sh which contains the actual logic.
#
# PROTECTION:
# - This file MUST exist in the root directory
# - It is referenced in documentation and user workflows
# - Moving or deleting this file will break the startup process
# - Updates should be made to this file (it can be edited)
#
# If you need to modify startup logic, edit scripts/dev/start-full-stack.sh instead.
# Only edit this file if you need to change the wrapper behavior itself.
#
###############################################################################

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Path to the actual startup script
START_SCRIPT="${SCRIPT_DIR}/scripts/dev/start-full-stack.sh"

# Check if the startup script exists
if [ ! -f "$START_SCRIPT" ]; then
    echo "❌ Error: Startup script not found at $START_SCRIPT"
    echo "Please ensure scripts/dev/start-full-stack.sh exists"
    exit 1
fi

# Execute the startup script with all arguments passed through
exec "$START_SCRIPT" "$@"
