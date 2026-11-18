// Shared by the threat model's server page and client component.

export const STATUS = {
  mitigated: "Mitigated",
  partial: "Partial",
  open: "Open",
} as const;

export type Status = keyof typeof STATUS;

/** How an entry moved since the last edition: "still #1", "↑ from 6". */
export function rankChange(
  item: { was?: number; wasName?: string },
  rank: number,
): { text: string; up: boolean } {
  const moved =
    item.was === undefined
      ? "new"
      : item.was === rank
        ? `still #${rank}`
        : item.was > rank
          ? `↑ from ${item.was}`
          : `↓ from ${item.was}`;
  if (item.wasName) return { text: `renamed · ${moved}`, up: true };
  return {
    text: moved,
    up: item.was === undefined || (item.was !== rank && item.was > rank),
  };
}
