"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { Icon } from "@/components/ui/Icon";
import { withBase } from "@/lib/paths";
import {
  parseSearchIndex,
  resultHref,
  search,
  SEARCH_INDEX_PATH,
  type SearchDoc,
  type SearchKind,
} from "@/lib/search";
import { stepRequest } from "@/lib/stepRequest";

type IndexState =
  | { status: "idle" | "loading" | "error" }
  | { status: "ready"; docs: SearchDoc[] };

const KIND_LABEL: Record<SearchKind, string> = {
  topic: "Topic",
  lesson: "Lesson",
  step: "Step",
  fact: "Fact",
};

// One fetch per page load, shared by every open of the dialog.
let indexPromise: Promise<SearchDoc[]> | null = null;
function loadIndex(): Promise<SearchDoc[]> {
  indexPromise ??= fetch(withBase(SEARCH_INDEX_PATH))
    .then((res) => {
      if (!res.ok) throw new Error(`search index: HTTP ${res.status}`);
      return res.json();
    })
    .then(parseSearchIndex)
    .catch((error: unknown) => {
      indexPromise = null; // let the next open try again
      throw error;
    });
  return indexPromise;
}

const subscribeNothing = () => () => {};
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform);

/** The search button and its dialog. Cmd/Ctrl+K anywhere, or "/" when not
    typing, opens it. The index loads the first time it opens. */
export function SearchDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [index, setIndex] = useState<IndexState>({ status: "idle" });
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const mac = useSyncExternalStore(subscribeNothing, isMac, () => true);
  const listId = useId();
  const titleId = useId();
  const optionId = (i: number) => `${listId}-${i}`;

  const results = useMemo(
    () => (index.status === "ready" ? search(index.docs, query) : []),
    [index, query],
  );

  function open() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    if (index.status === "ready" || index.status === "loading") return;
    setIndex({ status: "loading" });
    loadIndex().then(
      (docs) => setIndex({ status: "ready", docs }),
      () => setIndex({ status: "error" }),
    );
  }

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const typing = (event.target as HTMLElement).closest(
        "input, textarea, select, [contenteditable]",
      );
      const shortcut =
        (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) ||
        (event.key === "/" && !typing);
      if (!shortcut) return;
      event.preventDefault();
      const dialog = dialogRef.current;
      if (dialog?.open) dialog.close();
      else open();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function go(i: number) {
    const result = results[i];
    if (!result) return;
    dialogRef.current?.close();
    // The page already open keeps its player, which moves and updates ?step.
    if (result.step && pathname === result.path) stepRequest.send(result.step);
    else router.push(resultHref(result));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // A search field eats Escape to clear itself; close the dialog instead.
    if (event.key === "Escape") {
      event.preventDefault();
      dialogRef.current?.close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(active);
    }
  }

  return (
    <>
      <button
        type="button"
        className="tt-srch"
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+K Control+K /"
        onClick={open}
      >
        <Icon name="search" />
        <span className="tt-srch-label">Search topics, lessons, facts</span>
        <kbd className="tt-srch-kbd" aria-hidden="true">
          {mac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>
      <dialog
        ref={dialogRef}
        className="tt-search"
        aria-labelledby={titleId}
        onClick={(e) => {
          // A click on the backdrop (the dialog itself) closes it.
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        onClose={() => {
          setQuery("");
          setActive(0);
        }}
      >
        <h2 id={titleId} className="sr-only">
          Search
        </h2>
        <label className="tt-input tt-search-field">
          <Icon name="search" />
          <span className="sr-only">Search topics, lessons and facts</span>
          <input
            type="search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-activedescendant={
              results.length ? optionId(active) : undefined
            }
            aria-autocomplete="list"
            placeholder="Search topics, lessons, facts"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            autoComplete="off"
          />
          <kbd className="tt-kbd" aria-hidden="true">
            Esc
          </kbd>
        </label>
        <ul
          id={listId}
          role="listbox"
          className="tt-search-results"
          aria-label="Results"
        >
          {results.map((r, i) => (
            <li
              key={`${r.kind}-${r.path}-${r.step ?? 0}-${r.title}`}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(i)}
            >
              <span className="tt-lbl-s tt-search-kind">
                {KIND_LABEL[r.kind]}
              </span>
              <span className="tt-search-text">
                <span className="tt-search-title">{r.title}</span>
                <span className="tt-search-context">{r.context}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="tt-search-status" role="status">
          {index.status === "loading" || index.status === "idle"
            ? "Loading search…"
            : index.status === "error"
              ? "Search couldn’t load. Close it and try again."
              : results.length === 0
                ? `Nothing matches “${query}”.`
                : ""}
        </p>
      </dialog>
    </>
  );
}
