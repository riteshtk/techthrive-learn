import { ICON_PATHS, type IconName } from "./icons";

const SIZE_CLASS = { m: "", s: " tt-ic-s", l: " tt-ic-l" } as const;

/** A decorative icon; the control around it carries the name. */
export function Icon({
  name,
  size = "s",
}: {
  name: IconName;
  size?: keyof typeof SIZE_CLASS;
}) {
  return (
    <svg
      className={`tt-ic${SIZE_CLASS[size]}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
