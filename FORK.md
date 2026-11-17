# Fork changes

This fork of [pingdotgg/t3code](https://github.com/pingdotgg/t3code) adds two features.

## Orchestrator mode

New threads act as coordinators by default. With each message, a top-level thread's agent gets a
short brief telling it to plan first, call `orchestrator_capabilities` to see which providers and
models are available, pick a model for each task, and hand the work to child threads with
`delegate_task` (usually in their own worktrees). Quick questions and one-line changes are still
answered directly.

- **Setting:** Settings → Threads → **Orchestrator mode**. On by default; select a project at the
  top of Settings to override it for that project.
- **Skipped for:** delegated child threads, side chats, slash commands, compaction, `/goal` and
  resumed turns, so workers do their task instead of delegating again.
- **Code:** the brief text is `T3_CODE_COORDINATOR_INSTRUCTIONS` in
  `packages/provider-core/src/server/orchestrationInstructions.ts`. Whether a turn gets it is
  decided in `apps/server/src/orchestration-v2/OrchestratorBrief.ts`, and it is added to the prompt
  in `ProviderTurnStartService.ts`, which covers every provider.

## Tool calls panel

A right-panel tab that lists every tool call in the thread: commands, file edits, searches, MCP
calls and delegations. Calls are grouped by turn, with status and time, and each one expands to
show its input, output and exit code.

- **Open it:** the right panel's **+** menu → **Tool calls** (`K` in that menu).
- **Code:** `apps/web/src/components/chat/ToolCallsPanel.tsx` and `ToolCallsPanel.logic.ts`,
  registered as the `tool-calls` kind in `apps/web/src/rightPanelStore.ts`.
