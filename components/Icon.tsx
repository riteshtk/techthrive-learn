import { UI_ICON_PATHS, type UiIcon } from "@/lib/icons";

/** A decorative interface icon; the control around it carries the name. */
export function Icon({ name, size = 16 }: { name: UiIcon; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path d={UI_ICON_PATHS[name]} />
    </svg>
  );
}
