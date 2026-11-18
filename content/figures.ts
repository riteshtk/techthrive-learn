// Finds the figures in a piece of display text, so the content check can
// insist each one is in the facts register (PRD P3: "the build fails if a
// figure on screen has no register entry").
//
// A figure is a number as written, with its currency sign, decimals,
// thousands separators and a unit stuck to it: "₹50,000", "$0.063", "90%",
// "20k", "1.25×", "v1.0", "2027", "2026-07-28". These are not figures:
// - small counts written bare (0–12): "6 turns", "Lesson 2", "3 questions";
// - numbers inside a name: ASI01, LLM03, OAuth2, 2D, pass^4, gen_ai, and
//   the last four digits of a masked card (••••4417).

const FIGURE =
  /(?<![\p{L}\p{N}^_.,•])(?:\d{4}-\d{2}-\d{2}(?!\d)|(?:v(?=\d))?[₹$€£]?\d(?:[\d,]*\d)?(?:\.\d+)?(?:%|×|(?:x|k|K|m|M|bn|ms|s|h)(?![\p{L}\p{N}_]))?)(?![\p{L}\p{N}_])/gu;

/** Bare whole numbers this small are counts, not figures. */
const SMALL = 12;

export function figuresIn(text: string): string[] {
  const out: string[] = [];
  for (const match of text.matchAll(FIGURE)) {
    const figure = match[0];
    if (/^\d+$/.test(figure) && Number(figure) <= SMALL) continue;
    out.push(figure);
  }
  return out;
}

const SCALE: Record<string, number> = { k: 1e3, m: 1e6, bn: 1e9 };

/** A comparable key: "20k", "20,000" and "20000" are all "20000";
    currency, percent and other units are kept. */
export function figureKey(figure: string): string {
  const m = figure.match(
    /^(v)?([₹$€£])?([\d,]+(?:\.\d+)?)(%|×|x|k|m|bn|ms|s|h)?$/i,
  );
  if (!m) return figure.toLowerCase();
  const [, version, currency = "", digits = "", rawUnit = ""] = m;
  if (version) return `v${digits}`;
  const unit = rawUnit.toLowerCase();
  let n = Number(digits.replace(/,/g, ""));
  let kept = unit;
  if (unit in SCALE) {
    n *= SCALE[unit] ?? 1;
    kept = "";
  }
  if (unit === "x") kept = "×";
  return `${currency}${Number(n.toPrecision(12))}${kept}`;
}

/** The keys of every figure in a fact value. */
export function figureKeys(value: string): Set<string> {
  return new Set(figuresIn(value).map(figureKey));
}
