export type ContinueTarget = {
  topicId: string;
  label: "Continue" | "Start again";
};

/** The first topic not yet done; once all are done, back to topic 1. */
export function continueTarget(
  topicIds: readonly string[],
  done: readonly string[],
): ContinueTarget | undefined {
  const first = topicIds[0];
  if (first === undefined) return undefined;
  const next = topicIds.find((id) => !done.includes(id));
  return next === undefined
    ? { topicId: first, label: "Start again" }
    : { topicId: next, label: "Continue" };
}

export const levelLabel = {
  basics: "Basics",
  intermediate: "Intermediate",
  advanced: "Advanced",
} as const;
