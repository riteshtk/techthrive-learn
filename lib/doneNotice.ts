// The "Marked X as done" notice, handed from the topic page to the roadmap
// page across a client-side navigation. In memory only: a reload or a shared
// link never replays it.

let topicId: string | null = null;
const listeners = new Set<() => void>();

export const doneNotice = {
  get: (): string | null => topicId,
  set(id: string | null) {
    topicId = id;
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
