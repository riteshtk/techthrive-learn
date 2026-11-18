import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { Icon } from "./Icon";
import type { IconName } from "./icons";

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

/** A static tag. */
export function Chip({
  on = false,
  compact = false,
  icon,
  children,
}: {
  on?: boolean;
  compact?: boolean;
  icon?: IconName;
  children: ReactNode;
}) {
  let className = "tt-chip";
  if (on) className += " tt-chip-on";
  if (compact) className += " tt-chip-compact";
  return (
    <span className={className}>
      {icon && <Icon name={icon} />}
      {children}
    </span>
  );
}

/** One toggle in a single-select filter group. */
export function FilterChip({
  pressed,
  onPress,
  children,
}: {
  pressed: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="tt-fchip"
      aria-pressed={pressed}
      onClick={onPress}
    >
      {children}
    </button>
  );
}

/** A labelled group of filter chips; exactly one is pressed. */
export function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="tt-fgroup">
      {options.map((option) => (
        <FilterChip
          key={option.value}
          pressed={option.value === value}
          onPress={() => onChange(option.value)}
        >
          {option.label}
        </FilterChip>
      ))}
    </div>
  );
}

export type Tone = "cyan" | "green" | "amber" | "violet" | "red";

/** A status word in a pill, like UPDATED or LIVE. */
export function StatusPill({
  tone,
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span className={tone ? `tt-pill tt-${tone}` : "tt-pill"}>{children}</span>
  );
}

/** A status word without a pill. */
export function StatusText({
  tone,
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span className={tone ? `tt-status tt-${tone}` : "tt-status"}>
      {children}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="tt-kbd">{children}</kbd>;
}

/** A labelled text field with a leading icon. */
export function TextInput({
  label,
  icon,
  className,
  ...rest
}: { label: string; icon?: IconName } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "aria-label"
>) {
  return (
    <label className={className ? `tt-input ${className}` : "tt-input"}>
      {icon && <Icon name={icon} />}
      <input aria-label={label} {...rest} />
    </label>
  );
}

/** A labelled slider. */
export function Range({
  label,
  ...rest
}: { label: string } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "aria-label"
>) {
  return (
    <input type="range" className="tt-range" aria-label={label} {...rest} />
  );
}
