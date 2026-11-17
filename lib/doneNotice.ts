// The "Marked X as done" notice, handed from the topic page to the roadmap
// page across a client-side navigation. In memory only: a reload or a shared
// link never replays it.

export type DoneNotice = {
  topicId: string;
  /** Already done before this press, so there is nothing to undo. */
  already: boolean;
};

let notice: DoneNotice | null = null;
const listeners = new Set<() => void>();

export const doneNotice = {
  get: (): DoneNotice | null => notice,
  set(next: DoneNotice | null) {
    notice = next;
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
