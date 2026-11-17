import {
  isDelegatedAppThread,
  type OrchestrationV2ThreadProjection,
  type ServerSettings,
} from "@t3tools/contracts";
import { T3_CODE_COORDINATOR_INSTRUCTIONS } from "@t3tools/provider-core/server/orchestrationInstructions";
import { resolveProjectSettings } from "@t3tools/shared/projectSettings";

/** The coordinator brief for one turn, or "" when the thread is a worker or the prompt must stay verbatim. */
export function orchestratorBriefFor(input: {
  readonly thread: Pick<
    OrchestrationV2ThreadProjection["thread"],
    "lineage" | "delegatedFrom" | "projectId"
  >;
  readonly settings: ServerSettings;
  readonly prompt: string;
  /** Compaction, /goal and resumes reach the provider unwrapped. */
  readonly verbatim: boolean;
}): string {
  if (input.verbatim || input.prompt.trimStart().startsWith("/")) return "";
  if (isDelegatedAppThread(input.thread) || input.thread.lineage.sideChat === true) return "";
  return resolveProjectSettings(input.settings, input.thread.projectId).settings.orchestratorMode
    ? T3_CODE_COORDINATOR_INSTRUCTIONS
    : "";
}
