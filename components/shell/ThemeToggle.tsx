"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { currentTheme, setTheme, subscribeTheme } from "@/lib/theme";

/** Sun while dark, moon while light; the label says what a press does. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => null);
  const next = theme === "light" ? "dark" : "light";
  return (
    <Button
      variant="ghost"
      size="sm"
      iconOnly
      icon={theme === "light" ? "moon" : "sun"}
      aria-label={theme ? `Switch to ${next} theme` : "Switch theme"}
      title={theme ? `Switch to ${next} theme` : undefined}
      onClick={() => setTheme(next)}
      data-testid="theme-toggle"
    />
  );
}
