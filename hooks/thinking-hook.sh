#!/bin/bash
# Universal hook script - works with BOTH Claude Code AND Cursor
# Captures thinking state and sends to visualization server

EVENT_TYPE="$1"  # "thinking-start" or "thinking-end"
SERVER_URL="http://localhost:5174/api/thinking"
LOG_FILE="/tmp/codemap-hook.log"

# Read JSON from stdin
INPUT=$(cat)

# UNIVERSAL: Extract session ID - works for Claude Code OR Cursor
# Claude uses session_id, Cursor uses conversation_id
AGENT_ID=$(echo "$INPUT" | /usr/bin/jq -r '.session_id // .conversation_id // empty' 2>/dev/null)

if [ -z "$AGENT_ID" ]; then
    echo "$(date): SKIP - no session_id/conversation_id" >> "$LOG_FILE"
    exit 0
fi

# UNIVERSAL: Extract tool name - works for both tools
# Claude: tool_name, Cursor: tool_name or command (for shell)
TOOL_NAME=$(echo "$INPUT" | /usr/bin/jq -r '.tool_name // .command // empty' 2>/dev/null)

# Detect source for logging (optional)
SOURCE="unknown"
echo "$INPUT" | /usr/bin/jq -e '.session_id' >/dev/null 2>&1 && SOURCE="claude"
echo "$INPUT" | /usr/bin/jq -e '.conversation_id' >/dev/null 2>&1 && SOURCE="cursor"

# Log for debugging
echo "$(date): [$SOURCE] THINKING $EVENT_TYPE agent=${AGENT_ID:0:8} tool=$TOOL_NAME" >> "$LOG_FILE"

# Build JSON payload with source identifier
if [ -n "$TOOL_NAME" ]; then
    JSON_PAYLOAD="{\"type\":\"$EVENT_TYPE\",\"agentId\":\"$AGENT_ID\",\"source\":\"$SOURCE\",\"timestamp\":$(date +%s000),\"toolName\":\"$TOOL_NAME\"}"
else
    JSON_PAYLOAD="{\"type\":\"$EVENT_TYPE\",\"agentId\":\"$AGENT_ID\",\"source\":\"$SOURCE\",\"timestamp\":$(date +%s000)}"
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
