// Dark by default, light when the device asks, unless the learner picks one
// with the toggle. The choice is stored under one versioned key and applied
// as <html data-theme="…"> before first paint (THEME_SCRIPT in the layout).

export type Theme = "dark" | "light";

export const THEME_KEY = "ttl-learn:theme:v1";

/** Runs in <head> before the page paints, so there is no flash. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

const LIGHT_QUERY = "(prefers-color-scheme: light)";

/** The theme in effect: the stored choice, or what the device asks for. */
export function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "dark" || chosen === "light") return chosen;
  return window.matchMedia(LIGHT_QUERY).matches ? "light" : "dark";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked: the choice lasts for this page.
  }
}

/** Calls back when the theme attribute or the device preference changes. */
export function subscribeTheme(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  const query = window.matchMedia(LIGHT_QUERY);
  query.addEventListener("change", callback);
  return () => {
    observer.disconnect();
    query.removeEventListener("change", callback);
  };
}
