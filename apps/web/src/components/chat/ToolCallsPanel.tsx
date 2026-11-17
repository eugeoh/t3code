import type { EnvironmentId } from "@t3tools/contracts";
import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";

import { useClientSettings } from "../../hooks/useSettings";
import type { TimelineEntry, WorkLogEntry } from "../../session-logic";
import { formatShortTimestamp } from "../../timestampFormat";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";
import { workEntryDisplayLabel } from "./MessagesTimeline.logic";
import { groupToolCallsByTurn, type ToolCallTurn } from "./ToolCallsPanel.logic";
import { V2ItemInspector } from "./V2ItemInspector";

const STATUS_DOT: Record<NonNullable<WorkLogEntry["toolLifecycleStatus"]>, string> = {
  inProgress: "bg-amber-500",
  completed: "bg-emerald-500",
  failed: "bg-destructive",
  declined: "bg-destructive",
  stopped: "bg-muted-foreground",
  idle: "bg-muted-foreground/50",
};

const STATUS_LABEL: Partial<Record<NonNullable<WorkLogEntry["toolLifecycleStatus"]>, string>> = {
  inProgress: "running",
  failed: "failed",
  declined: "declined",
  stopped: "stopped",
};

export function ToolCallsPanel(props: {
  readonly entries: ReadonlyArray<TimelineEntry>;
  readonly environmentId: EnvironmentId;
  readonly workspaceRoot: string | undefined;
}) {
  const timestampFormat = useClientSettings((settings) => settings.timestampFormat);
  const turns = groupToolCallsByTurn(props.entries);
  const callCount = turns.reduce((total, turn) => total + turn.calls.length, 0);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  if (callCount === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-muted-foreground text-sm">
        No tool calls in this thread yet. Commands, file edits, searches and MCP calls appear here
        as the agent runs them.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-tool-calls-panel>
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2 text-xs">
        <span className="text-muted-foreground">
          {callCount} {callCount === 1 ? "call" : "calls"} across {turns.length}{" "}
          {turns.length === 1 ? "turn" : "turns"}
        </span>
        <div className="flex gap-1">
          <Button
            size="xs"
            variant="ghost"
            onClick={() =>
              setExpanded(new Set(turns.flatMap((turn) => turn.calls.map((call) => call.id))))
            }
          >
            Expand all
          </Button>
          <Button size="xs" variant="ghost" onClick={() => setExpanded(new Set())}>
            Collapse all
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {turns.map((turn, index) => (
          <ToolCallTurnSection
            key={turn.key}
            turn={turn}
            ordinal={index + 1}
            expanded={expanded}
            onToggle={toggle}
            environmentId={props.environmentId}
            workspaceRoot={props.workspaceRoot}
            formatTime={(iso) => formatShortTimestamp(iso, timestampFormat)}
          />
        ))}
      </div>
    </div>
  );
}

function ToolCallTurnSection(props: {
  readonly turn: ToolCallTurn;
  readonly ordinal: number;
  readonly expanded: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
  readonly environmentId: EnvironmentId;
  readonly workspaceRoot: string | undefined;
  readonly formatTime: (iso: string) => string;
}) {
  const { turn } = props;
  return (
    <section className="border-b last:border-b-0">
      <h3 className="sticky top-0 z-10 flex items-center gap-2 bg-background/95 px-3 py-1.5 font-medium text-muted-foreground text-xs">
        <span>Turn {props.ordinal}</span>
        <span className="font-normal">
          {turn.calls.length} {turn.calls.length === 1 ? "call" : "calls"}
          {turn.running > 0 ? ` · ${turn.running} running` : ""}
          {turn.failed > 0 ? ` · ${turn.failed} failed` : ""}
        </span>
      </h3>
      <ol>
        {turn.calls.map((call, index) => {
          const open = props.expanded.has(call.id);
          const status = call.toolLifecycleStatus ?? "completed";
          const statusLabel = STATUS_LABEL[status];
          return (
            <li key={call.id} className="px-2">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => props.onToggle(call.id)}
                className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-xs hover:bg-muted/50"
              >
                <ChevronRightIcon
                  className={cn("size-3 shrink-0 text-muted-foreground", open && "rotate-90")}
                />
                <span className="w-5 shrink-0 text-right text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <span
                  aria-hidden
                  className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[status])}
                />
                <span className="min-w-0 flex-1 truncate font-mono">
                  {workEntryDisplayLabel(call, props.workspaceRoot)}
                </span>
                {statusLabel ? (
                  <span
                    className={cn(
                      "shrink-0",
                      status === "failed" ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {statusLabel}
                  </span>
                ) : null}
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {props.formatTime(call.createdAt)}
                </span>
              </button>
              {open && call.projectedItem ? (
                <div className="mb-2 ml-9 mr-1">
                  <V2ItemInspector
                    projectedItem={call.projectedItem}
                    environmentId={props.environmentId}
                    cwd={props.workspaceRoot}
                    workspaceRoot={props.workspaceRoot}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
