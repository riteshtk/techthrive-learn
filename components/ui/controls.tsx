import type { InputHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./icons";

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
