"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";

// The dialog and its index load the first time search is asked for, so
// pages don't carry them (issue #4; the JavaScript budget).
const SearchPanel = dynamic(() => import("./SearchPanel"), { ssr: false });

const subscribeNothing = () => () => {};
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform);

/** The search button. Cmd/Ctrl+K anywhere, or "/" when not typing, also
    opens search. */
export function SearchDialog() {
  const [requests, setRequests] = useState(0);
  const mac = useSyncExternalStore(subscribeNothing, isMac, () => true);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = (event.target as HTMLElement).closest(
        "input, textarea, select, [contenteditable]",
      );
      const shortcut =
        (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) ||
        (event.key === "/" && !typing);
      if (!shortcut) return;
      event.preventDefault();
      setRequests((n) => n + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        className="tt-srch"
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+K Control+K /"
        onClick={() => setRequests((n) => n + 1)}
      >
        <Icon name="search" />
        <span className="tt-srch-label">Search topics, lessons, facts</span>
        <kbd className="tt-srch-kbd" aria-hidden="true">
          {mac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>
      {requests > 0 && <SearchPanel requests={requests} />}
    </>
  );
}
