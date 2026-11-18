"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { tabIndexForKey } from "@/lib/tabs";
import { Icon } from "./Icon";
import type { IconName } from "./icons";

export type TabItem<T extends string> = {
  value: T;
  label: ReactNode;
  icon?: IconName;
};

/** Tabs that switch a panel: arrow keys move and select (automatic
    activation), and only the selected tab is in the tab order. Render the
    panel with tabPanelProps() and the same idBase so each points at the
    other. */
export function SegmentedTabs<T extends string>({
  label,
  items,
  value,
  onChange,
  idBase,
  className,
}: {
  label: string;
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  idBase: string;
  className?: string;
}) {
  const base = idBase;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = Math.max(
    0,
    items.findIndex((item) => item.value === value),
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = tabIndexForKey(event.key, current, items.length);
    if (next === null) return;
    event.preventDefault();
    const item = items[next];
    if (!item) return;
    onChange(item.value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={className ? `tt-tabs ${className}` : "tt-tabs"}
      onKeyDown={onKeyDown}
    >
      {items.map((item, index) => {
        const selected = index === current;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${item.value}`}
            aria-selected={selected}
            aria-controls={`${base}-panel`}
            tabIndex={selected ? 0 : -1}
            className="tt-tab"
            onClick={() => onChange(item.value)}
          >
            {item.icon && <Icon name={item.icon} />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/** Props for the panel a SegmentedTabs controls. */
export function tabPanelProps(idBase: string, value: string) {
  return {
    role: "tabpanel" as const,
    id: `${idBase}-panel`,
    "aria-labelledby": `${idBase}-tab-${value}`,
    tabIndex: 0,
  };
}
