#!/bin/bash
# Claude Code hook script - captures file activity and sends to visualization server
# Includes agentId to track which agent is accessing which file

EVENT_TYPE="$1"  # "read-start", "read-end", "write-start", "write-end"
SERVER_URL="http://localhost:5174/api/activity"
THINKING_URL="http://localhost:5174/api/thinking"
LOG_FILE="/tmp/codemap-hook.log"

# Read JSON from stdin
INPUT=$(cat)

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

# Extract file_path and tool_name using jq
FILE_PATH=$(echo "$INPUT" | /usr/bin/jq -r '.tool_input.file_path // empty')
TOOL_NAME=$(echo "$INPUT" | /usr/bin/jq -r '.tool_name // empty')

# Log for debugging
echo "$(date): EVENT=$EVENT_TYPE AGENT=$AGENT_ID FILE=$FILE_PATH TOOL=$TOOL_NAME" >> "$LOG_FILE"

if [ -n "$FILE_PATH" ]; then
    # Send file activity event to server (non-blocking with timeout)
    /usr/bin/curl -s -X POST "$SERVER_URL" \
        -H "Content-Type: application/json" \
        -d "{\"type\":\"$EVENT_TYPE\",\"filePath\":\"$FILE_PATH\",\"agentId\":\"$AGENT_ID\",\"timestamp\":$(date +%s000)}" \
        --connect-timeout 1 \
        --max-time 2 \
        >/dev/null 2>&1 &
fi

# Also send thinking event so server knows the current tool
# This ensures agent state is always updated even if thinking hook fails
if [ -n "$TOOL_NAME" ]; then
    THINKING_TYPE="thinking-end"
    if [[ "$EVENT_TYPE" == *"-end" ]]; then
        THINKING_TYPE="thinking-start"
    fi
    /usr/bin/curl -s -X POST "$THINKING_URL" \
        -H "Content-Type: application/json" \
        -d "{\"type\":\"$THINKING_TYPE\",\"agentId\":\"$AGENT_ID\",\"timestamp\":$(date +%s000),\"toolName\":\"$TOOL_NAME\"}" \
        --connect-timeout 1 \
        --max-time 2 \
        >/dev/null 2>&1 &
fi

# Always exit successfully to not block Claude Code
exit 0
