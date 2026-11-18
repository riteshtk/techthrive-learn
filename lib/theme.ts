// Dark unless the learner picks light with the theme switch (PRD P1): the
// device's preference is not consulted. The choice is stored under one
// versioned key and applied as <html data-theme="…"> before first paint
// (THEME_SCRIPT in the layout), so it holds across every page.

export type Theme = "dark" | "light";

export const THEME_KEY = "ttl-learn:theme:v1";

/** Runs in <head> before the page paints, so there is no flash. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

/** The theme in effect: the stored choice, else dark. */
export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked: the choice lasts for this page.
  }
}

/** Calls back when the theme changes, here or in another tab. */
export function subscribeTheme(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_KEY) return;
    const theme = event.newValue === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
  };
  window.addEventListener("storage", onStorage);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStorage);
  };
}
