import type { StandardSchemaV1Issue } from "@tanstack/react-form";

export function firstIssueMessage(
  issuesByField: Record<string, StandardSchemaV1Issue[]> | undefined,
) {
  return Object.values(issuesByField ?? {}).flat()[0]?.message;
}
