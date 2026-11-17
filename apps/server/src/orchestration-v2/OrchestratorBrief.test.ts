import { DEFAULT_SERVER_SETTINGS, ProjectId, ThreadId } from "@t3tools/contracts";
import { T3_CODE_COORDINATOR_INSTRUCTIONS } from "@t3tools/provider-core/server/orchestrationInstructions";
import { describe, expect, it } from "@effect/vitest";

import { orchestratorBriefFor } from "./OrchestratorBrief.ts";

const projectId = ProjectId.make("project-orchestrator");
const threadId = ThreadId.make("thread-orchestrator");
const parentThreadId = ThreadId.make("thread-orchestrator-parent");
const topLevel = {
  projectId,
  lineage: { parentThreadId: null, relationshipToParent: null, rootThreadId: threadId },
} as const;

describe("orchestratorBriefFor", () => {
  it.each([
    { name: "a top-level thread", thread: topLevel, briefed: true },
    {
      name: "a delegated subagent",
      thread: {
        projectId,
        lineage: { parentThreadId, relationshipToParent: "subagent", rootThreadId: parentThreadId },
      },
      briefed: false,
    },
    {
      name: "a task delegated from a linked environment",
      thread: { ...topLevel, delegatedFrom: { threadId: parentThreadId } },
      briefed: false,
    },
    {
      name: "a side chat",
      thread: {
        projectId,
        lineage: {
          parentThreadId,
          relationshipToParent: "fork",
          rootThreadId: parentThreadId,
          sideChat: true,
        },
      },
      briefed: false,
    },
  ] as const)("briefs $name: $briefed", ({ thread, briefed }) => {
    expect(
      orchestratorBriefFor({
        thread: thread as never,
        settings: DEFAULT_SERVER_SETTINGS,
        prompt: "Add team invitations",
        verbatim: false,
      }),
    ).toBe(briefed ? T3_CODE_COORDINATOR_INSTRUCTIONS : "");
  });

  it("keeps slash commands and verbatim turns unwrapped", () => {
    const brief = (prompt: string, verbatim: boolean) =>
      orchestratorBriefFor({
        thread: topLevel,
        settings: DEFAULT_SERVER_SETTINGS,
        prompt,
        verbatim,
      });
    expect(brief("  /compact", false)).toBe("");
    expect(brief("Continue", true)).toBe("");
  });

  it("follows the environment default and a project override", () => {
    const brief = (settings: typeof DEFAULT_SERVER_SETTINGS) =>
      orchestratorBriefFor({ thread: topLevel, settings, prompt: "Ship it", verbatim: false });
    expect(brief({ ...DEFAULT_SERVER_SETTINGS, orchestratorMode: false })).toBe("");
    expect(
      brief({
        ...DEFAULT_SERVER_SETTINGS,
        projectSettingsOverrides: { [projectId]: { orchestratorMode: false } },
      }),
    ).toBe("");
    expect(
      brief({
        ...DEFAULT_SERVER_SETTINGS,
        orchestratorMode: false,
        projectSettingsOverrides: { [projectId]: { orchestratorMode: true } },
      }),
    ).toBe(T3_CODE_COORDINATOR_INSTRUCTIONS);
  });
});
