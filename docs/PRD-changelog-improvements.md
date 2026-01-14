# PRD: Claude Code Changelog-Based Improvements

**Date**: January 14, 2026
**Status**: Completed
**Priority**: High

## Overview

Implement improvements to CodeMap based on Claude Code changelog updates from the past 3 weeks (v2.1.0 - v2.1.7). Focus on features that expose more agent state data and improve visualization accuracy.

## Background

Claude Code v2.1.x introduced several features relevant to CodeMap:

| Version | Feature | Relevance |
|---------|---------|-----------|
| v2.1.6 | `context_window.used_percentage` in status line | Could visualize context pressure |
| v2.1.2 | `agent_type` in SessionStart hook | Better agent identification |
| v2.1.0 | Background task notifications | Visualize backgrounded agents |
| v2.1.3 | 10-minute hook timeout | More reliable hook execution |
| v2.1.0 | `PreToolUse` middleware with `updatedInput` | Richer event data |

## Goals

1. **Improve agent state visualization** - Show more context about what each agent is doing
2. **Add context window indicator** - Visual feedback on context pressure
3. **Support background task state** - Show when agents are backgrounded vs active
4. **Capture richer hook data** - Leverage new hook capabilities

## Non-Goals

- Major UI redesign
- New floor layouts
- Sound system changes

---

## Feature 1: Context Window Pressure Indicator

### Problem
Users have no visibility into how much context window each agent is consuming. An agent near context limit behaves differently.

### Solution
Add a visual indicator above each agent showing context window usage.

### Implementation

**1.1 Hook Changes** (`hooks/thinking-hook.sh`)
- Capture `context_window.used_percentage` from Claude Code status line if available
- Add to thinking event payload

**1.2 Server Changes** (`server/src/types.ts`, `server/src/index.ts`)
- Add `contextUsage?: number` (0-100) to `AgentThinkingState`
- Accept and store from hook events

**1.3 Client Changes** (`client/src/drawing/agent.ts`)
- Draw context bar below agent name
- Color gradient: green (0-50%) → yellow (50-80%) → red (80-100%)
- Width: 30px, Height: 4px

### Acceptance Criteria
- [ ] Context bar visible above agents when data available
- [ ] Color changes based on usage percentage
- [ ] Graceful fallback when data unavailable (no bar shown)

---

## Feature 2: Background Task State

### Problem
When a user presses Ctrl+B to background an agent, CodeMap doesn't reflect this state.

### Solution
Add visual indicator for backgrounded agents.

### Implementation

**2.1 Hook Changes** (`hooks/thinking-hook.sh`)
- Detect background state from hook input if available
- Send `isBackgrounded: true` in event

**2.2 Server Changes**
- Add `isBackgrounded?: boolean` to `AgentThinkingState`

**2.3 Client Changes**
- Draw "BG" badge on backgrounded agents
- Reduce opacity to 70% for backgrounded agents
- Different idle behavior (don't move to coffee shop)

### Acceptance Criteria
- [ ] Backgrounded agents show "BG" indicator
- [ ] Visual distinction from active agents
- [ ] State clears when agent resumes

---

## Feature 3: Agent Type Display

### Problem
All Claude agents show as "Claude 1", "Claude 2" etc. With `agent_type` metadata, we can show more specific names.

### Solution
Display agent type (e.g., "Plan", "Explore", "Bash") when available.

### Implementation

**3.1 Hook Changes** (`hooks/thinking-hook.sh`)
- Capture `agent_type` from SessionStart events
- Include in thinking events

**3.2 Server Changes**
- Add `agentType?: string` to `AgentThinkingState`
- Update display name logic: "Claude Plan 1" instead of "Claude 1"

**3.3 Client Changes**
- Show agent type in name label when available
- Different color schemes per agent type (optional)

### Acceptance Criteria
- [ ] Agent type shown in display name when available
- [ ] Falls back to generic name when not available

---

## Feature 4: Tool Input Preview

### Problem
The current command bubble shows tool name but not what it's operating on.

### Solution
Show abbreviated file path or command in the bubble.

### Implementation

**4.1 Hook Changes** (`hooks/thinking-hook.sh`)
- Capture tool input (file path for Read/Write/Edit, command for Bash)
- Truncate to 20 chars with ellipsis

**4.2 Server Changes**
- Add `toolInput?: string` to `AgentThinkingState`

**4.3 Client Changes**
- Show tool input in secondary line of bubble
- Format: "Read" / "src/app.ts"

### Acceptance Criteria
- [ ] Tool input shown in command bubble
- [ ] Properly truncated for long paths
- [ ] Sensitive data not exposed (no full bash commands)

---

## Implementation Order

1. **Feature 4: Tool Input Preview** - Easiest, immediate value
2. **Feature 3: Agent Type Display** - Simple metadata pass-through
3. **Feature 2: Background Task State** - Moderate complexity
4. **Feature 1: Context Window Indicator** - Requires status line parsing

## Testing Plan

### Unit Tests
- Server: Accept new fields in thinking events
- Client: Render new visual elements correctly

### Integration Tests
- Hook → Server → Client data flow for each new field
- Fallback behavior when fields missing

### Manual Tests
- Start Claude Code with CodeMap running
- Verify new indicators appear
- Background an agent and verify state change
- Use different agent types and verify labels

---

## Implementation Notes (January 14, 2026)

### Completed

**Feature 4: Tool Input Preview** ✅
- Hook extracts filename from Read/Write/Edit, command preview from Bash, pattern from Grep/Glob
- Server stores `toolInput` in `AgentThinkingState`
- Client displays two-line bubble: tool name on top, tool input below in smaller gray text

**Feature 3: Agent Type Display** ✅
- Hook extracts `agent_type` from input JSON
- Server updates displayName to include type: "Claude Plan 1" instead of "Claude 1"
- Persists for agent lifetime once set

### Deferred (data not available in hooks)

**Feature 2: Background Task State** - Deferred
- Background state is not exposed in hook input JSON
- Would require Claude Code to add `is_backgrounded` field to hook events

**Feature 1: Context Window Indicator** - Deferred
- Status line variables (`context_window.used_percentage`) are not available in hooks
- Would require new hook type or status line API endpoint

### Test Results
- All 248 tests pass (126 server + 122 client)
- No breaking changes to existing functionality
- Backward compatible: missing fields result in no visual change

---

## Rollout

1. Implement features incrementally
2. Test each feature in isolation
3. All changes backward compatible (missing fields = no change)
4. No breaking changes to existing hooks
