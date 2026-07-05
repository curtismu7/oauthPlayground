#!/usr/bin/env bash
# logs-viewer.sh — Interactive log file viewer
# Displays available logs and lets user select which to tail

# Colors
BOLD='\033[1m'
CYAN='\033[1;36m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Find and display available log files
show_log_options() {
  local log_dir="${1:-.}"
  local pattern="${2:-*.log}"

  echo ""
  echo -e "${CYAN}${BOLD}═════════════════════════════════════════════════════════════════${NC}"
  echo -e "  ${CYAN}📋 Available Log Files${NC}"
  echo -e "${CYAN}${BOLD}═════════════════════════════════════════════════════════════════${NC}"
  echo ""

  # Find all log files
  local -a logs=()
  local count=0

  # Check for OAuth logs
  if [ -f "/tmp/oauth-backend.log" ]; then
    logs+=("/tmp/oauth-backend.log")
    echo -e "  ${GREEN}[1]${NC} Backend Log         ${YELLOW}/tmp/oauth-backend.log${NC}"
    ((count++))
  fi

  if [ -f "/tmp/oauth-frontend.log" ]; then
    logs+=("/tmp/oauth-frontend.log")
    echo -e "  ${GREEN}[2]${NC} Frontend Log        ${YELLOW}/tmp/oauth-frontend.log${NC}"
    ((count++))
  fi

  # Check for Docker logs
  if command -v docker &>/dev/null 2>&1; then
    local containers=$(docker ps --format "{{.Names}}" 2>/dev/null | grep -E "oauth|playground" || true)
    if [ -n "$containers" ]; then
      while IFS= read -r container; do
        logs+=("docker:$container")
        echo -e "  ${GREEN}[((count+1))]${NC} Docker: $container   ${YELLOW}(live)${NC}"
        ((count++))
      done <<< "$containers"
    fi
  fi

  # Check for application logs in logs directory
  if [ -d "./logs" ]; then
    local app_logs=$(find ./logs -name "*.log" -type f 2>/dev/null | head -10)
    if [ -n "$app_logs" ]; then
      while IFS= read -r logfile; do
        logs+=("$logfile")
        local basename=$(basename "$logfile")
        echo -e "  ${GREEN}[((count+1))]${NC} $basename     ${YELLOW}$logfile${NC}"
        ((count++))
      done <<< "$app_logs"
    fi
  fi

  echo ""
  echo -e "  ${GREEN}[0]${NC} All logs (combination)"
  echo -e "  ${GREEN}[q]${NC} Quit"
  echo ""
  echo -e "${CYAN}${BOLD}═════════════════════════════════════════════════════════════════${NC}"
  echo ""

  # Return array size and array
  echo "${#logs[@]}"
  printf '%s\n' "${logs[@]}"
}

# Tail selected logs
tail_logs() {
  local -a selected_logs=()

  read -p "Select log(s) to view (e.g., 1,2 or 0 for all, q to quit): " choice

  case "$choice" in
    q|Q)
      echo "Goodbye!"
      return 1
      ;;
    0)
      # All logs
      echo ""
      echo -e "${YELLOW}${BOLD}Tailing all available logs...${NC} (Press Ctrl+C to stop)"
      echo ""

      local all_logs=()
      [ -f "/tmp/oauth-backend.log" ] && all_logs+=("/tmp/oauth-backend.log")
      [ -f "/tmp/oauth-frontend.log" ] && all_logs+=("/tmp/oauth-frontend.log")

      if [ ${#all_logs[@]} -gt 0 ]; then
        tail -f "${all_logs[@]}"
      else
        echo "No logs found"
        return 1
      fi
      ;;
    *)
      # Parse comma-separated selections
      IFS=',' read -ra indices <<< "$choice"
      for idx in "${indices[@]}"; do
        idx=$((idx - 1))
        if [ $idx -ge 0 ] && [ $idx -lt 10 ]; then
          selected_logs+=("Log $((idx + 1))")
        fi
      done

      if [ ${#selected_logs[@]} -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}${BOLD}Tailing selected logs...${NC} (Press Ctrl+C to stop)"
        echo ""

        local tail_files=()
        [ -f "/tmp/oauth-backend.log" ] && tail_files+=("/tmp/oauth-backend.log")
        [ -f "/tmp/oauth-frontend.log" ] && tail_files+=("/tmp/oauth-frontend.log")

        if [ ${#tail_files[@]} -gt 0 ]; then
          tail -f "${tail_files[@]}"
        fi
      else
        echo "Invalid selection"
        return 1
      fi
      ;;
  esac
}

# Main
show_log_options
tail_logs
