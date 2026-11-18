/* eslint-disable @next/next/no-img-element -- static brand SVGs; next/image
   adds nothing on a statically exported site. */
import { withBase } from "@/lib/paths";

// The brand kit's own SVG files (public/brand/), used exactly as supplied.
// Both the on-dark and on-light files are in the page; CSS shows the one
// that matches the theme, so the theme toggle switches the logo too.
const FILES = {
  lockup: {
    dark: "/brand/lockup-horizontal_on-dark.svg",
    light: "/brand/lockup-horizontal_on-light.svg",
    width: 1342.86,
    height: 300,
  },
  // The top bar's logo: a logo with the name under 290 px wide uses the
  // compact lockup (brand guide; PRD decision 4).
  compact: {
    dark: "/brand/lockup-compact_on-dark.svg",
    light: "/brand/lockup-compact_on-light.svg",
    width: 1338.69,
    height: 300,
  },
  mark: {
    dark: "/brand/mark-small_on-dark.svg",
    light: "/brand/mark-small_on-light.svg",
    width: 1006.68,
    height: 1000,
  },
} as const;

export function BrandImage({
  kind,
  height,
  alt,
  className,
}: {
  kind: keyof typeof FILES;
  /** Rendered height in CSS pixels; width follows the file's proportions. */
  height: number;
  /** Empty when the image is decorative. */
  alt: string;
  className?: string;
}) {
  const file = FILES[kind];
  const width = Math.round((file.width / file.height) * height);
  return (
    <span className={`brand-image ${className ?? ""}`}>
      <img
        className="on-dark"
        src={withBase(file.dark)}
        alt={alt}
        width={width}
        height={height}
      />
      <img
        className="on-light"
        src={withBase(file.light)}
        alt={alt}
        width={width}
        height={height}
      />
    </span>
  );
}
