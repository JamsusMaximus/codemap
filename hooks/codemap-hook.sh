#!/bin/bash
# CodeMap Unified Hook
# Works with Claude Code, Cursor, and other compatible tools
# Handles both file activity and thinking state events

EVENT_TYPE="$1"  # read-start, read-end, write-start, write-end, thinking-start, thinking-end
SERVER_BASE="http://localhost:5174/api"
LOG_FILE="/tmp/codemap-hook.log"

# Read JSON from stdin
INPUT=$(cat)

# Extract session ID (Claude: session_id, Cursor: conversation_id)
AGENT_ID=$(echo "$INPUT" | /usr/bin/jq -r '.session_id // .conversation_id // empty' 2>/dev/null)

if [ -z "$AGENT_ID" ]; then
    echo "$(date): SKIP - no agent ID" >> "$LOG_FILE"
    exit 0
fi

# Extract tool name
TOOL_NAME=$(echo "$INPUT" | /usr/bin/jq -r '.tool_name // .command // empty' 2>/dev/null)

# Detect source (claude or cursor)
SOURCE="unknown"
echo "$INPUT" | /usr/bin/jq -e '.session_id' >/dev/null 2>&1 && SOURCE="claude"
echo "$INPUT" | /usr/bin/jq -e '.conversation_id' >/dev/null 2>&1 && SOURCE="cursor"

# Extract file path for file activity events
FILE_PATH=$(echo "$INPUT" | /usr/bin/jq -r '.tool_input.file_path // .file_path // empty' 2>/dev/null)

TIMESTAMP=$(date +%s000)

# Determine event category and send appropriate request
case "$EVENT_TYPE" in
    read-start|read-end|write-start|write-end)
        # File activity event
        echo "$(date): [$SOURCE] FILE $EVENT_TYPE agent=${AGENT_ID:0:8} file=$(basename "$FILE_PATH" 2>/dev/null)" >> "$LOG_FILE"

        if [ -n "$FILE_PATH" ]; then
            /usr/bin/curl -s -X POST "$SERVER_BASE/activity" \
                -H "Content-Type: application/json" \
                -d "{\"type\":\"$EVENT_TYPE\",\"filePath\":\"$FILE_PATH\",\"agentId\":\"$AGENT_ID\",\"source\":\"$SOURCE\",\"timestamp\":$TIMESTAMP}" \
                --connect-timeout 1 --max-time 2 \
                >/dev/null 2>&1 &
        fi

        # Also send thinking event for agent state tracking
        if [ -n "$TOOL_NAME" ]; then
            THINKING_TYPE="thinking-end"
            [[ "$EVENT_TYPE" == *"-end" ]] && THINKING_TYPE="thinking-start"

            /usr/bin/curl -s -X POST "$SERVER_BASE/thinking" \
                -H "Content-Type: application/json" \
                -d "{\"type\":\"$THINKING_TYPE\",\"agentId\":\"$AGENT_ID\",\"source\":\"$SOURCE\",\"timestamp\":$TIMESTAMP,\"toolName\":\"$TOOL_NAME\"}" \
                --connect-timeout 1 --max-time 2 \
                >/dev/null 2>&1 &
        fi
        ;;

    thinking-start|thinking-end)
        # Thinking state event
        echo "$(date): [$SOURCE] THINKING $EVENT_TYPE agent=${AGENT_ID:0:8} tool=$TOOL_NAME" >> "$LOG_FILE"

        PAYLOAD="{\"type\":\"$EVENT_TYPE\",\"agentId\":\"$AGENT_ID\",\"source\":\"$SOURCE\",\"timestamp\":$TIMESTAMP"
        [ -n "$TOOL_NAME" ] && PAYLOAD="$PAYLOAD,\"toolName\":\"$TOOL_NAME\""
        PAYLOAD="$PAYLOAD}"

        /usr/bin/curl -s -X POST "$SERVER_BASE/thinking" \
            -H "Content-Type: application/json" \
            -d "$PAYLOAD" \
            --connect-timeout 1 --max-time 2 \
            >/dev/null 2>&1 &
        ;;

    *)
        echo "$(date): UNKNOWN event type: $EVENT_TYPE" >> "$LOG_FILE"
        ;;
esac

# Always exit successfully to not block the tool
exit 0
