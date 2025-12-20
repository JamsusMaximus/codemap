#!/bin/bash
# Universal hook script - works with BOTH Claude Code AND Cursor
# Captures file activity and sends to visualization server

EVENT_TYPE="$1"  # "read-start", "read-end", "write-start", "write-end"
SERVER_URL="http://localhost:5174/api/activity"
THINKING_URL="http://localhost:5174/api/thinking"
LOG_FILE="/tmp/codemap-hook.log"

# Read JSON from stdin
INPUT=$(cat)

# UNIVERSAL: Extract session ID - works for Claude Code OR Cursor
AGENT_ID=$(echo "$INPUT" | /usr/bin/jq -r '.session_id // .conversation_id // empty' 2>/dev/null)

if [ -z "$AGENT_ID" ]; then
    echo "$(date): SKIP - no session_id/conversation_id" >> "$LOG_FILE"
    exit 0
fi

# UNIVERSAL: Extract file path - works for both tools
# Claude: .tool_input.file_path, Cursor: .file_path
FILE_PATH=$(echo "$INPUT" | /usr/bin/jq -r '.tool_input.file_path // .file_path // empty' 2>/dev/null)

# For search events (Grep/Glob), extract the pattern instead
if [[ "$EVENT_TYPE" == search-* ]]; then
    # Grep: .tool_input.pattern, Glob: .tool_input.pattern
    SEARCH_PATTERN=$(echo "$INPUT" | /usr/bin/jq -r '.tool_input.pattern // empty' 2>/dev/null)
    SEARCH_PATH=$(echo "$INPUT" | /usr/bin/jq -r '.tool_input.path // "." // empty' 2>/dev/null)
    FILE_PATH="${SEARCH_PATH}:${SEARCH_PATTERN}"
fi

# UNIVERSAL: Extract tool name
TOOL_NAME=$(echo "$INPUT" | /usr/bin/jq -r '.tool_name // .hook_event_name // empty' 2>/dev/null)

# Detect source for logging
SOURCE="unknown"
echo "$INPUT" | /usr/bin/jq -e '.session_id' >/dev/null 2>&1 && SOURCE="claude"
echo "$INPUT" | /usr/bin/jq -e '.conversation_id' >/dev/null 2>&1 && SOURCE="cursor"

# Log for debugging
echo "$(date): [$SOURCE] FILE $EVENT_TYPE agent=${AGENT_ID:0:8} file=$(basename "$FILE_PATH" 2>/dev/null)" >> "$LOG_FILE"

if [ -n "$FILE_PATH" ]; then
    # Send file activity event to server (non-blocking with timeout)
    /usr/bin/curl -s -X POST "$SERVER_URL" \
        -H "Content-Type: application/json" \
        -d "{\"type\":\"$EVENT_TYPE\",\"filePath\":\"$FILE_PATH\",\"agentId\":\"$AGENT_ID\",\"source\":\"$SOURCE\",\"timestamp\":$(date +%s000)}" \
        --connect-timeout 1 \
        --max-time 2 \
        >/dev/null 2>&1 &
fi

# Also send thinking event so server knows the current tool
if [ -n "$TOOL_NAME" ]; then
    THINKING_TYPE="thinking-end"
    if [[ "$EVENT_TYPE" == *"-end" ]]; then
        THINKING_TYPE="thinking-start"
    fi
    /usr/bin/curl -s -X POST "$THINKING_URL" \
        -H "Content-Type: application/json" \
        -d "{\"type\":\"$THINKING_TYPE\",\"agentId\":\"$AGENT_ID\",\"source\":\"$SOURCE\",\"timestamp\":$(date +%s000),\"toolName\":\"$TOOL_NAME\"}" \
        --connect-timeout 1 \
        --max-time 2 \
        >/dev/null 2>&1 &
fi

# Always exit successfully to not block Claude Code
exit 0
