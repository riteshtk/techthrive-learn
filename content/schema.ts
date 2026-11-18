// A small runtime schema: each content type is described once, its
// TypeScript type is inferred from that description (Infer<>), and the same
// description checks the untrusted file at build time. Problems name the
// field as a path, e.g. steps[3].trace[1].from. Unknown fields are reported,
// so a misspelt key never passes silently.

export type Issue = {
  file: string;
  field: string;
  message: string;
  /** Warnings print but don't fail the build. */
  level?: "error" | "warning";
};

export type Report = (field: string, message: string) => void;

export interface Schema<T> {
  readonly _type?: T;
  /** Reports problems at `path`; returns whether the value had the type. */
  check(value: unknown, path: string, report: Report): boolean;
}

export type Infer<S> = S extends Schema<infer T> ? T : never;

const at = (path: string, key: string | number) =>
  typeof key === "number" ? `${path}[${key}]` : path ? `${path}.${key}` : key;

const describe = (value: unknown) =>
  value === null
    ? "null"
    : Array.isArray(value)
      ? "a list"
      : typeof value === "string"
        ? `"${value.length > 40 ? `${value.slice(0, 40)}…` : value}"`
        : typeof value;

export function string(
  rules: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    /** Says what the pattern means, for the message. */
    patternHint?: string;
  } = {},
): Schema<string> {
  const { min = 1, max, pattern, patternHint } = rules;
  return {
    check(value, path, report) {
      if (typeof value !== "string") {
        report(path, `must be text, not ${describe(value)}`);
        return false;
      }
      const length = value.trim().length;
      if (length < min)
        report(
          path,
          min === 1
            ? "must not be empty"
            : `must be at least ${min} characters`,
        );
      if (max !== undefined && value.length > max)
        report(path, `is ${value.length} characters; the limit is ${max}`);
      if (pattern && !pattern.test(value))
        report(path, `${describe(value)} is not ${patternHint ?? pattern}`);
      return true;
    },
  };
}

export function number(
  rules: { int?: boolean; min?: number; max?: number } = {},
): Schema<number> {
  return {
    check(value, path, report) {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        report(path, `must be a number, not ${describe(value)}`);
        return false;
      }
      if (rules.int && !Number.isInteger(value))
        report(path, `must be a whole number, not ${value}`);
      if (rules.min !== undefined && value < rules.min)
        report(path, `must be at least ${rules.min}, not ${value}`);
      if (rules.max !== undefined && value > rules.max)
        report(path, `must be at most ${rules.max}, not ${value}`);
      return true;
    },
  };
}

export function boolean(): Schema<boolean> {
  return {
    check(value, path, report) {
      if (typeof value === "boolean") return true;
      report(path, `must be true or false, not ${describe(value)}`);
      return false;
    },
  };
}

export function oneOf<const T extends readonly string[]>(
  values: T,
): Schema<T[number]> {
  return {
    check(value, path, report) {
      if (typeof value === "string" && values.includes(value)) return true;
      report(
        path,
        `${describe(value)} must be one of: ${values.map((v) => `"${v}"`).join(", ")}`,
      );
      return false;
    },
  };
}

export function array<T>(
  item: Schema<T>,
  rules: { min?: number; max?: number; length?: number } = {},
): Schema<T[]> {
  return {
    check(value, path, report) {
      if (!Array.isArray(value)) {
        report(path, `must be a list, not ${describe(value)}`);
        return false;
      }
      const n = value.length;
      if (rules.length !== undefined && n !== rules.length)
        report(path, `must have exactly ${rules.length} items, not ${n}`);
      if (rules.min !== undefined && n < rules.min)
        report(path, `must have at least ${rules.min} items, not ${n}`);
      if (rules.max !== undefined && n > rules.max)
        report(path, `must have at most ${rules.max} items, not ${n}`);
      value.forEach((v, i) => item.check(v, at(path, i), report));
      return true;
    },
  };
}

export function tuple<const T extends readonly Schema<unknown>[]>(
  ...items: T
): Schema<{ [K in keyof T]: Infer<T[K]> }> {
  return {
    check(value, path, report) {
      if (!Array.isArray(value) || value.length !== items.length) {
        report(path, `must be a list of exactly ${items.length} items`);
        return false;
      }
      items.forEach((s, i) => s.check(value[i], at(path, i), report));
      return true;
    },
  };
}

export function record<T>(
  key: Schema<string>,
  item: Schema<T>,
): Schema<Record<string, T>> {
  return {
    check(value, path, report) {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        report(path, `must be an object, not ${describe(value)}`);
        return false;
      }
      for (const [k, v] of Object.entries(value)) {
        key.check(k, at(path, k), report);
        item.check(v, at(path, k), report);
      }
      return true;
    },
  };
}

const OPTIONAL = Symbol("optional");
export type Optional<T> = Schema<T> & { [OPTIONAL]: true };

export function optional<T>(schema: Schema<T>): Optional<T> {
  return {
    [OPTIONAL]: true,
    check: (value, path, report) =>
      value === undefined || schema.check(value, path, report),
  };
}

type Shape = Record<string, Schema<unknown>>;
type OptionalKeys<S extends Shape> = {
  [K in keyof S]: S[K] extends Optional<unknown> ? K : never;
}[keyof S];
type RequiredKeys<S extends Shape> = Exclude<keyof S, OptionalKeys<S>>;
type Flatten<T> = { [K in keyof T]: T[K] } & {};
export type ObjectOf<S extends Shape> = Flatten<
  { [K in RequiredKeys<S>]: Infer<S[K]> } & {
    [K in OptionalKeys<S>]?: Infer<S[K]>;
  }
>;

export function object<S extends Shape>(shape: S): Schema<ObjectOf<S>> {
  return {
    check(value, path, report) {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        report(path, `must be an object, not ${describe(value)}`);
        return false;
      }
      const v = value as Record<string, unknown>;
      for (const [key, schema] of Object.entries(shape)) {
        if (v[key] === undefined && !(OPTIONAL in schema)) {
          report(at(path, key), "is missing");
          continue;
        }
        schema.check(v[key], at(path, key), report);
      }
      for (const key of Object.keys(v))
        if (!(key in shape)) report(at(path, key), "is not a known field");
      return true;
    },
  };
}

/** Runs a schema over one file's default export. */
export function checkFile<T>(
  schema: Schema<T>,
  file: string,
  data: unknown,
  issues: Issue[],
): data is T {
  let ok = true;
  schema.check(data, "", (field, message) => {
    ok = false;
    issues.push({ file, field: field || "(file)", message });
  });
  return ok;
}

export function formatIssue(issue: Issue): string {
  return `${issue.file} › ${issue.field}: ${issue.message}`;
}
