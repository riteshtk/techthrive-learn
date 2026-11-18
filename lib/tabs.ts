/** Where focus goes in a tab list for a key press, or null if the key isn't
    a tab key. Arrows wrap; Home and End jump to the ends. */
export function tabIndexForKey(
  key: string,
  current: number,
  count: number,
  orientation: "horizontal" | "vertical" = "horizontal",
): number | null {
  if (count < 1) return null;
  const [back, forward] =
    orientation === "horizontal"
      ? ["ArrowLeft", "ArrowRight"]
      : ["ArrowUp", "ArrowDown"];
  if (key === back) return (current - 1 + count) % count;
  if (key === forward) return (current + 1) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}
