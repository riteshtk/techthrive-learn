"use client";

import Link from "next/link";
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
import { BrandImage } from "@/components/BrandImage";
import { Icon } from "@/components/Icon";
import { levelLabel } from "@/lib/roadmap";
import { searchTopics, type NavRoadmap, type SearchEntry } from "@/lib/search";
import { currentTheme, setTheme, subscribeTheme } from "@/lib/theme";
import { useProgress } from "@/lib/useProgress";

type Props = { roadmaps: NavRoadmap[]; search: SearchEntry[] };

/** Header with the course drawer, Cmd/Ctrl+K search and the theme toggle. */
export function AppShell({ roadmaps, search }: Props) {
  const drawerRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLDialogElement>(null);

  // Cmd+K / Ctrl+K anywhere, or "/" when not typing, opens search.
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
      const dialog = searchRef.current;
      if (!dialog) return;
      if (dialog.open) dialog.close();
      else {
        drawerRef.current?.close();
        dialog.showModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="shell-header">
        <div className="shell-inner">
          <button
            type="button"
            className="icon-button"
            aria-label="Open the course menu"
            aria-haspopup="dialog"
            onClick={() => drawerRef.current?.showModal()}
          >
            <Icon name="menu" size={18} />
          </button>
          <Link href="/" className="brand">
            <BrandImage kind="lockup" height={26} alt="Tech & Thrive" />
            <span>Learn</span>
          </Link>
          <button
            type="button"
            className="search-button"
            aria-haspopup="dialog"
            aria-keyshortcuts="Meta+K Control+K"
            onClick={() => searchRef.current?.showModal()}
          >
            <Icon name="search" />
            <span className="search-label">Search topics</span>
            <kbd aria-hidden="true">⌘K</kbd>
          </button>
          <ThemeToggle />
        </div>
      </header>
      <CourseDrawer ref={drawerRef} roadmaps={roadmaps} />
      <SearchDialog ref={searchRef} entries={search} />
    </>
  );
}

function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => null);
  const next = theme === "light" ? "dark" : "light";
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={theme ? `Switch to ${next} theme` : "Switch theme"}
      onClick={() => setTheme(next)}
      data-testid="theme-toggle"
    >
      <Icon name={theme === "light" ? "moon" : "sun"} size={18} />
    </button>
  );
}

function CourseDrawer({
  ref,
  roadmaps,
}: {
  ref: React.Ref<HTMLDialogElement>;
  roadmaps: NavRoadmap[];
}) {
  const pathname = usePathname();
  const allIds = roadmaps.flatMap((r) => r.topics.map((t) => t.id));
  const done = useProgress(allIds);
  const titleId = useId();

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby={titleId}
      onClick={(e) => {
        // A click on the backdrop (the dialog itself) closes it.
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className="drawer-body">
        <div className="drawer-head">
          <h2 id={titleId}>Roadmaps</h2>
          <form method="dialog">
            <button className="icon-button" aria-label="Close the course menu">
              <Icon name="close" size={18} />
            </button>
          </form>
        </div>
        {roadmaps.map((roadmap) => {
          const count = done
            ? roadmap.topics.filter((t) => done.includes(t.id)).length
            : null;
          return (
            <section key={roadmap.id} className="drawer-roadmap">
              <h3>
                <Link href={`/roadmaps/${roadmap.id}/`} onClick={closeDialogOf}>
                  {roadmap.title}
                </Link>
                <span
                  className="drawer-count"
                  data-testid={`drawer-count-${roadmap.id}`}
                >
                  {count === null ? "" : `${count}/${roadmap.topics.length}`}
                </span>
              </h3>
              <ol>
                {roadmap.topics.map((topic) => {
                  const href = `/topics/${topic.id}/`;
                  const current = pathname === href;
                  const isDone = done?.includes(topic.id) ?? false;
                  return (
                    <li key={topic.id}>
                      <Link
                        href={href}
                        aria-current={current ? "page" : undefined}
                        onClick={closeDialogOf}
                      >
                        <span className="drawer-tick" data-done={isDone}>
                          {isDone ? <Icon name="check" size={12} /> : null}
                        </span>
                        <span>{topic.title}</span>
                        <span className="meta">
                          {levelLabel[topic.level as keyof typeof levelLabel]}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
        <p className="drawer-foot">
          <Link href="/" onClick={closeDialogOf}>
            All roadmaps
          </Link>
          <span className="meta">
            {done === null ? "" : `${done.length} of ${allIds.length} done`}
          </span>
        </p>
      </div>
    </dialog>
  );
}

/** Closes the dialog a link sits in, as it navigates. */
function closeDialogOf(event: React.MouseEvent<HTMLElement>) {
  event.currentTarget.closest("dialog")?.close();
}

function SearchDialog({
  ref,
  entries,
}: {
  ref: React.Ref<HTMLDialogElement>;
  entries: SearchEntry[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchTopics(entries, query), [entries, query]);
  const listId = useId();
  const labelId = useId();
  const optionId = (i: number) => `${listId}-${i}`;

  const hrefOf = (i: number) => {
    const r = results[i];
    if (!r) return undefined;
    return `/topics/${r.id}/${r.step ? `?step=${r.step}` : ""}`;
  };

  function go(i: number, dialog: HTMLDialogElement | null) {
    const href = hrefOf(i);
    if (!href) return;
    dialog?.close();
    router.push(href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(active, event.currentTarget.closest("dialog"));
    }
  }

  return (
    <dialog
      ref={ref}
      className="search"
      aria-labelledby={labelId}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      onClose={() => {
        setQuery("");
        setActive(0);
      }}
    >
      <div className="search-body">
        <label id={labelId} className="search-field">
          <Icon name="search" size={18} />
          <span className="sr-only">Search topics</span>
          <input
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={
              results.length ? optionId(active) : undefined
            }
            aria-autocomplete="list"
            placeholder="Search topics, steps and parts…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            autoComplete="off"
          />
          <kbd>Esc</kbd>
        </label>
        <ul
          id={listId}
          role="listbox"
          className="search-results"
          aria-label="Results"
        >
          {results.map((r, i) => (
            <li
              key={`${r.id}-${r.step ?? 0}`}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={(e) => go(i, e.currentTarget.closest("dialog"))}
            >
              <span className="result-title">{r.title}</span>
              <span className="meta">
                {r.roadmap} · {r.detail}
              </span>
            </li>
          ))}
        </ul>
        {results.length === 0 ? (
          <p className="search-empty" role="status">
            No topics match “{query}”.
          </p>
        ) : null}
      </div>
    </dialog>
  );
}
