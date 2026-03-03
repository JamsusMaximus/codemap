#!/bin/bash
# Git post-commit hook for CodeMap
# Notifies the server to refresh the hotel layout after each commit

CODEMAP_BASE="${CODEMAP_SERVER_URL:-http://localhost:5174}"
SERVER_URL="${CODEMAP_BASE}/api/git-commit"
LOG_FILE="/tmp/codemap-hook.log"

# Build auth header if API key is set
AUTH_HEADER=""
if [ -n "$CODEMAP_API_KEY" ]; then
    AUTH_HEADER="-H \"Authorization: Bearer $CODEMAP_API_KEY\""
fi

# Send notification to server (fire and forget, don't block git)
eval curl -s -X POST "$SERVER_URL" \
    -H "Content-Type: application/json" \
    $AUTH_HEADER \
    -d '{}' \
    --max-time 2 \
    > /dev/null 2>&1 &

echo "$(date): Git commit detected - notified CodeMap server" >> "$LOG_FILE"

exit 0
