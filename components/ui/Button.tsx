import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./icons";

// Buttons and button-styled links, on their own so a page that only needs
// a button doesn't load every control (the JavaScript budget counts).

export type ButtonVariant = "default" | "primary" | "live" | "ghost";

type ButtonLook = {
  variant?: ButtonVariant;
  size?: "md" | "sm";
  iconOnly?: boolean;
  icon?: IconName;
  /** An icon after the label, like the arrow on "Resume →". */
  trailingIcon?: IconName;
};

export function buttonClass({
  variant = "default",
  size = "md",
  iconOnly = false,
}: ButtonLook): string {
  let className = "tt-btn";
  if (variant !== "default") className += ` tt-btn-${variant}`;
  if (size === "sm") className += " tt-btn-sm";
  if (iconOnly) className += " tt-btn-icon";
  return className;
}

function ButtonContent({
  icon,
  trailingIcon,
  children,
}: Pick<ButtonLook, "icon" | "trailingIcon"> & { children?: ReactNode }) {
  return (
    <>
      {icon && <Icon name={icon} />}
      {children}
      {trailingIcon && <Icon name={trailingIcon} />}
    </>
  );
}

/** A real <button>. Icon-only buttons need an aria-label. */
export function Button({
  variant,
  size,
  iconOnly,
  icon,
  trailingIcon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonLook & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = buttonClass({ variant, size, iconOnly });
  return (
    <button
      type={type}
      className={className ? `${base} ${className}` : base}
      {...rest}
    >
      <ButtonContent icon={icon} trailingIcon={trailingIcon}>
        {children}
      </ButtonContent>
    </button>
  );
}

/** A link styled as a button. Internal hrefs go through next/link, which
    adds the base path. */
export function ButtonLink({
  href,
  variant,
  size,
  icon,
  trailingIcon,
  className,
  children,
  ...rest
}: ButtonLook & {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  const base = buttonClass({ variant, size });
  return (
    <Link
      href={href}
      className={className ? `${base} ${className}` : base}
      {...rest}
    >
      <ButtonContent icon={icon} trailingIcon={trailingIcon}>
        {children}
      </ButtonContent>
    </Link>
  );
}
