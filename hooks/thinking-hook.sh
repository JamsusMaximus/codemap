#!/bin/bash
# Claude Code hook script - captures thinking state and sends to visualization server
# Supports multiple agent instances with unique IDs

EVENT_TYPE="$1"  # "thinking-start" or "thinking-end"
SERVER_URL="http://localhost:5174/api/thinking"
LOG_FILE="/tmp/codemap-hook.log"

# Read JSON from stdin (contains tool info)
INPUT=$(cat)

# Extract tool name from input JSON
TOOL_NAME=$(echo "$INPUT" | /usr/bin/jq -r '.tool_name // empty' 2>/dev/null)

# Use session_id from input if available, otherwise fall back to PID-based ID
SESSION_ID=$(echo "$INPUT" | /usr/bin/jq -r '.session_id // empty' 2>/dev/null)

if [ -n "$SESSION_ID" ]; then
    # Use session_id - unique per Claude Code conversation
    AGENT_ID_FILE="/tmp/codemap-agent-session-${SESSION_ID}.id"
else
    # Fallback: use grandparent PID
    GRANDPARENT_PID=$(ps -o ppid= -p $PPID 2>/dev/null | tr -d ' ')
    AGENT_ID_FILE="/tmp/codemap-agent-${GRANDPARENT_PID:-$PPID}.id"
fi

if [ -f "$AGENT_ID_FILE" ]; then
    AGENT_ID=$(cat "$AGENT_ID_FILE")
else
    # Generate new UUID for this agent instance
    AGENT_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
    echo "$AGENT_ID" > "$AGENT_ID_FILE"
fi

# Log for debugging
echo "$(date): THINKING EVENT=$EVENT_TYPE AGENT=$AGENT_ID TOOL=$TOOL_NAME" >> "$LOG_FILE"

# Build JSON payload
if [ -n "$TOOL_NAME" ]; then
    JSON_PAYLOAD="{\"type\":\"$EVENT_TYPE\",\"agentId\":\"$AGENT_ID\",\"timestamp\":$(date +%s000),\"toolName\":\"$TOOL_NAME\"}"
else
    JSON_PAYLOAD="{\"type\":\"$EVENT_TYPE\",\"agentId\":\"$AGENT_ID\",\"timestamp\":$(date +%s000)}"
fi

# Send event to server (non-blocking with timeout)
/usr/bin/curl -s -X POST "$SERVER_URL" \
    -H "Content-Type: application/json" \
    -d "$JSON_PAYLOAD" \
    --connect-timeout 1 \
    --max-time 2 \
    >/dev/null 2>&1 &

# Always exit successfully to not block Claude Code
exit 0
