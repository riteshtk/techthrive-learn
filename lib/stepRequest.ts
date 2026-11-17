// Search asking the player on the open topic to show a step. A link to the
// page that is already open doesn't remount it, so the player would never
// read the new ?step.

const listeners = new Set<(step: number) => void>();

export const stepRequest = {
  /** `step` is 1-based, as in ?step. */
  send(step: number) {
    listeners.forEach((l) => l(step));
  },
  listen(listener: (step: number) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
