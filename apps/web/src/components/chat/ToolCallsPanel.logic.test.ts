import { RunId } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import type { TimelineEntry, WorkLogEntry } from "../../session-logic";
import { groupToolCallsByTurn } from "./ToolCallsPanel.logic";

const work = (
  id: string,
  runId: string | null,
  itemType: NonNullable<WorkLogEntry["itemType"]>,
  toolLifecycleStatus: NonNullable<WorkLogEntry["toolLifecycleStatus"]> = "completed",
): TimelineEntry => ({
  id,
  kind: "work",
  createdAt: "2026-11-17T00:00:00.000Z",
  entry: {
    id,
    createdAt: "2026-11-17T00:00:00.000Z",
    runId: runId === null ? null : RunId.make(runId),
    label: id,
    tone: "tool",
    itemType,
    toolLifecycleStatus,
    projectedItem: {} as never,
  },
});

describe("groupToolCallsByTurn", () => {
  it("groups consecutive tool calls by run and skips non-tool entries", () => {
    const turns = groupToolCallsByTurn([
      work("cmd-1", "run-1", "command_execution", "failed"),
      work("thought", "run-1", "reasoning"),
      work("edit-1", "run-1", "file_change", "inProgress"),
      { id: "msg", kind: "message", createdAt: "2026-11-17T00:00:00.000Z" } as TimelineEntry,
      work("mcp-1", "run-2", "dynamic_tool"),
    ]);
    expect(
      turns.map(({ runId, calls, running, failed }) => ({
        runId,
        ids: calls.map((call) => call.id),
        running,
        failed,
      })),
    ).toEqual([
      { runId: "run-1", ids: ["cmd-1", "edit-1"], running: 1, failed: 1 },
      { runId: "run-2", ids: ["mcp-1"], running: 0, failed: 0 },
    ]);
  });
});
