import type { RunId } from "@t3tools/contracts";

import type { TimelineEntry, WorkLogEntry } from "../../session-logic";

const TOOL_CALL_ITEM_TYPES: ReadonlySet<WorkLogEntry["itemType"]> = new Set([
  "command_execution",
  "file_change",
  "file_search",
  "web_search",
  "dynamic_tool",
  "subagent",
  "thread_created",
  "approval_request",
  "user_input_request",
  "error",
]);

export interface ToolCallTurn {
  readonly key: string;
  readonly runId: RunId | null;
  readonly calls: ReadonlyArray<WorkLogEntry>;
  readonly running: number;
  readonly failed: number;
}

/** Tool calls in timeline order, split into one group per consecutive run. */
export function groupToolCallsByTurn(entries: ReadonlyArray<TimelineEntry>): ToolCallTurn[] {
  const turns: Array<{ key: string; runId: RunId | null; calls: WorkLogEntry[] }> = [];
  for (const entry of entries) {
    if (entry.kind !== "work") continue;
    const call = entry.entry;
    if (call.projectedItem === undefined || !TOOL_CALL_ITEM_TYPES.has(call.itemType)) continue;
    const runId = call.runId ?? null;
    const current = turns.at(-1);
    if (current !== undefined && current.runId === runId) current.calls.push(call);
    else turns.push({ key: call.id, runId, calls: [call] });
  }
  return turns.map((turn) => ({
    ...turn,
    running: turn.calls.filter((call) => call.toolLifecycleStatus === "inProgress").length,
    failed: turn.calls.filter((call) => call.toolLifecycleStatus === "failed").length,
  }));
}
