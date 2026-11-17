import { withBase } from "@/lib/paths";

// The brand kit's own SVG files (public/brand/), used exactly as supplied.
// Each comes in an on-dark and an on-light version; the device's colour
// scheme picks one, matching the site theme.
const FILES = {
  lockup: {
    dark: "/brand/lockup-horizontal_on-dark.svg",
    light: "/brand/lockup-horizontal_on-light.svg",
    width: 1342.86,
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
    <picture className={className}>
      <source
        srcSet={withBase(file.light)}
        media="(prefers-color-scheme: light)"
      />
      <img src={withBase(file.dark)} alt={alt} width={width} height={height} />
    </picture>
  );
}
