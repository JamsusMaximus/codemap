#!/bin/bash
# Git post-commit hook for CodeMap
# Notifies the server to refresh the hotel layout after each commit

SERVER_URL="http://localhost:5174/api/git-commit"
LOG_FILE="/tmp/codemap-hook.log"

# Send notification to server (fire and forget, don't block git)
curl -s -X POST "$SERVER_URL" \
    -H "Content-Type: application/json" \
    -d '{}' \
    --max-time 2 \
    > /dev/null 2>&1 &

echo "$(date): Git commit detected - notified CodeMap server" >> "$LOG_FILE"

exit 0
