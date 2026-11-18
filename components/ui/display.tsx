import Link from "next/link";
import type { ReactNode } from "react";
import { StatusPill, type Tone } from "./controls";
import { Icon } from "./Icon";
import type { IconName } from "./icons";

/** A labelled progress bar; value is clamped to 0–max. */
export function ProgressBar({
  label,
  value,
  max = 100,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  const clamped = Math.min(Math.max(value, 0), max);
  const pct = max > 0 ? (clamped / max) * 100 : 0;
  return (
    <div
      className="tt-bar"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
    >
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

/** A neutral 36 px icon square. */
export function IconSquare({ icon }: { icon: IconName }) {
  return (
    <span className="tt-sq">
      <Icon name={icon} />
    </span>
  );
}

/** The ember "you are here / live now" dot. Once per screen. */
export function LiveDot() {
  return <span className="tt-live" aria-hidden="true" />;
}

/** A 9 px dot in a content colour, for legends. */
export function LegendDot({ tone }: { tone: Tone | "blue" }) {
  return <span className={`tt-key tt-${tone}`} aria-hidden="true" />;
}

/** A small card with a label and a figure. */
export function StatCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="tt-card tt-stat">
      <span className="tt-lbl-s">{label}</span>
      <span className="tt-num">{value}</span>
    </div>
  );
}

/** A row that is a link when it has an href. Variants stack it into a
    Continue card or a recommendation. */
export function ActionRow({
  href,
  variant,
  className,
  children,
}: {
  href?: string;
  variant?: "resume" | "rec";
  className?: string;
  children: ReactNode;
}) {
  let cls = "tt-crow";
  if (variant) cls += ` tt-crow-${variant}`;
  if (className) cls += ` ${className}`;
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <div className={cls}>{children}</div>
  );
}

/** One changed fact: status, text and source line. */
export function FactChangeItem({
  status,
  tone,
  text,
  source,
}: {
  status: string;
  tone: Tone;
  text: ReactNode;
  source: ReactNode;
}) {
  return (
    <li className="tt-chg">
      <StatusPill tone={tone}>{status}</StatusPill>
      <div>
        <p className="tt-chg-text">{text}</p>
        <p className="tt-chg-source">{source}</p>
      </div>
    </li>
  );
}

/** Numbered steps; done steps show a tick read as "Done". */
export function OrderedSteps({
  steps,
}: {
  steps: readonly { key: string; done?: boolean; content: ReactNode }[];
}) {
  return (
    <ol className="tt-steps">
      {steps.map((step, index) => (
        <li
          key={step.key}
          className={step.done ? "tt-step tt-step-done" : "tt-step"}
        >
          <span className="tt-sdot">
            {step.done ? (
              <>
                <Icon name="check" />
                <span className="sr-only">Done: </span>
              </>
            ) : (
              index + 1
            )}
          </span>
          <div>{step.content}</div>
        </li>
      ))}
    </ol>
  );
}

/** A rule with a cyan tick, a title and a detail line. */
export function RuleItem({
  title,
  detail,
}: {
  title: ReactNode;
  detail?: ReactNode;
}) {
  return (
    <div className="tt-rule">
      <Icon name="check" />
      <div>
        <p className="tt-rule-title">{title}</p>
        {detail && <p className="tt-rule-detail">{detail}</p>}
      </div>
    </div>
  );
}

/** A numbered "how it works" step. */
export function HowStep({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="tt-how">
      <span className="tt-hn" aria-hidden="true">
        {n}
      </span>
      <div>{children}</div>
    </div>
  );
}

/** A list item with a green tick. */
export function CheckListItem({ children }: { children: ReactNode }) {
  return (
    <li className="tt-check">
      <Icon name="check" />
      <span>{children}</span>
    </li>
  );
}

/** "Nothing here" in a large card. */
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="tt-card-l tt-empty" role="status">
      <p className="tt-h4">{title}</p>
      {children && <p className="tt-body-s tt-empty-body">{children}</p>}
    </div>
  );
}

/** Eyebrow, page title, lede and optional actions on the right. */
export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="tt-pagehead">
      <div>
        {eyebrow && <p className="tt-lbl">{eyebrow}</p>}
        <h1 className="tt-h1">{title}</h1>
        {lede && <p className="tt-body tt-lede">{lede}</p>}
      </div>
      {actions && <div className="tt-pagehead-actions">{actions}</div>}
    </header>
  );
}

/** A small note at the foot of a page. */
export function FootNote({ children }: { children: ReactNode }) {
  return <p className="tt-cap tt-foot">{children}</p>;
}
