import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type SurfaceProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

function surface(base: string, name: string) {
  function Surface<T extends ElementType = "div">({
    as,
    className,
    ...rest
  }: SurfaceProps<T>) {
    const Tag: ElementType = as ?? "div";
    return (
      <Tag className={className ? `${base} ${className}` : base} {...rest} />
    );
  }
  Surface.displayName = name;
  return Surface;
}

/** Stat cards (radius 20). */
export const Card = surface("tt-card", "Card");
/** Most large panels (radius 28, padding 22). */
export const CardLarge = surface("tt-card-l", "CardLarge");
/** Home's tiles (radius 22, padding 20, column gap 14). */
export const Tile = surface("tt-tile", "Tile");
/** A sunken block (radius 16). */
export const Well = surface("tt-well", "Well");
/** A raised-2 panel (radius 14). */
export const Panel2 = surface("tt-panel-2", "Panel2");
/** The brand dot field, 22 px pitch. */
export const DotField = surface("tt-field", "DotField");

export type TintTone = "amber" | "violet" | "green" | "red" | "cyan";

/** A tinted callout surface. */
export function Tint({
  tone,
  className,
  children,
}: {
  tone: TintTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`tt-tint tt-tint-${tone}${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  );
}

export function Divider() {
  return <hr className="tt-hr" />;
}
