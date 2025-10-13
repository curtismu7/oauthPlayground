#!/bin/bash

# OAuth Playground - Unified Shutdown Script
# Stops frontend (Vite) and backend (Express) instances started by helper scripts.

set -euo pipefail

FRONTEND_PORT=${FRONTEND_PORT:-3000}
BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PID_FILE=".frontend.pid"
BACKEND_PID_FILE=".backend.pid"

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() {
	echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
	echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅${NC} $1"
}

warn() {
	echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️${NC} $1"
}

error() {
	echo -e "${RED}[$(date +'%H:%M:%S')] ❌${NC} $1"
}

kill_pid_file() {
	local pid_file=$1
	local service=$2

	if [[ -f "$pid_file" ]]; then
		local pid
		pid=$(cat "$pid_file")
		if kill -0 "$pid" 2>/dev/null; then
			info "Stopping $service (PID $pid) from PID file"
			kill "$pid" 2>/dev/null || true
			sleep 2
			if kill -0 "$pid" 2>/dev/null; then
				warn "$service did not exit, sending SIGKILL"
				kill -9 "$pid" 2>/dev/null || true
			fi
			success "$service stopped"
		else
			warn "$service PID $pid no longer running"
		fi
		rm -f "$pid_file"
	else
		info "No PID file for $service"
	fi
}

kill_port() {
	local port=$1
	local service=$2
	local pids

	pids=$(lsof -ti:$port 2>/dev/null || true)
	if [[ -n "$pids" ]]; then
		info "Terminating $service processes on port $port"
		while read -r pid; do
			if [[ -n "$pid" ]]; then
				kill "$pid" 2>/dev/null || true
			fi
		done <<< "$pids"
		sleep 1

		# Force kill any holdouts
		pids=$(lsof -ti:$port 2>/dev/null || true)
		if [[ -n "$pids" ]]; then
			warn "$service still running on port $port; forcing kill"
			while read -r pid; do
				if [[ -n "$pid" ]]; then
					kill -9 "$pid" 2>/dev/null || true
				fi
			done <<< "$pids"
		fi
		success "$service on port $port terminated"
	else
		info "No processes listening on port $port"
	fi
}

info "Stopping OAuth Playground services..."

kill_pid_file "$FRONTEND_PID_FILE" "Frontend" || true
kill_pid_file "$BACKEND_PID_FILE" "Backend" || true

kill_port "$FRONTEND_PORT" "Frontend" || true
kill_port "$BACKEND_PORT" "Backend" || true

success "All known services stopped."
