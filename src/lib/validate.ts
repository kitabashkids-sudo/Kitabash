// Minimal schema validation (no external deps). Every API body goes through this.
export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

type Check<T> = (v: unknown, path: string) => T;

const fail = (path: string, msg: string): never => {
  throw new HttpError(400, `${path || 'body'}: ${msg}`);
};

export const v = {
  str(opts: { min?: number; max?: number; optional?: boolean; pattern?: RegExp; trim?: boolean } = {}): Check<string> {
    return (val, p) => {
      if (val === undefined || val === null) {
        if (opts.optional) return '' as string;
        return fail(p, 'is required');
      }
      if (typeof val !== 'string') return fail(p, 'must be text');
      const s = opts.trim === false ? val : val.trim();
      if (opts.min !== undefined && s.length < opts.min) fail(p, `must be at least ${opts.min} characters`);
      if (s.length > (opts.max ?? 20000)) fail(p, `must be at most ${opts.max ?? 20000} characters`);
      if (opts.pattern && !opts.pattern.test(s)) fail(p, 'has an invalid format');
      return s;
    };
  },
  int(opts: { min?: number; max?: number; optional?: boolean } = {}): Check<number | null> {
    return (val, p) => {
      if (val === undefined || val === null || val === '') {
        if (opts.optional) return null;
        return fail(p, 'is required');
      }
      const n = typeof val === 'string' ? Number(val) : val;
      if (typeof n !== 'number' || !Number.isInteger(n)) return fail(p, 'must be a whole number');
      if (opts.min !== undefined && n < opts.min) fail(p, `must be ≥ ${opts.min}`);
      if (opts.max !== undefined && n > opts.max) fail(p, `must be ≤ ${opts.max}`);
      return n;
    };
  },
  bool(opts: { optional?: boolean } = {}): Check<boolean> {
    return (val, p) => {
      if (val === undefined || val === null) return opts.optional ? false : fail(p, 'is required');
      if (typeof val !== 'boolean') return fail(p, 'must be true or false');
      return val;
    };
  },
  oneOf<T extends string>(values: readonly T[], opts: { optional?: boolean } = {}): Check<T> {
    return (val, p) => {
      if ((val === undefined || val === null) && opts.optional) return values[0];
      if (typeof val !== 'string' || !values.includes(val as T)) return fail(p, `must be one of ${values.join(', ')}`);
      return val as T;
    };
  },
  arr<T>(item: Check<T>, opts: { max?: number; optional?: boolean; min?: number } = {}): Check<T[]> {
    return (val, p) => {
      if (val === undefined || val === null) return opts.optional ? [] : fail(p, 'is required');
      if (!Array.isArray(val)) return fail(p, 'must be a list');
      if (val.length > (opts.max ?? 500)) fail(p, `must have at most ${opts.max ?? 500} items`);
      if (opts.min && val.length < opts.min) fail(p, `must have at least ${opts.min} items`);
      return val.map((x, i) => item(x, `${p}[${i}]`));
    };
  },
  obj<S extends Record<string, Check<any>>>(shape: S, opts: { optional?: boolean } = {}): Check<{ [K in keyof S]: ReturnType<S[K]> }> {
    return (val, p) => {
      if (val === undefined || val === null) {
        if (opts.optional) return undefined as any;
        return fail(p, 'is required');
      }
      if (typeof val !== 'object' || Array.isArray(val)) return fail(p, 'must be an object');
      const out: any = {};
      for (const k of Object.keys(shape)) out[k] = shape[k]((val as any)[k], p ? `${p}.${k}` : k);
      return out;
    };
  },
  /** Free-form JSON (validated later by a domain-specific validator). Size-capped. */
  json(opts: { optional?: boolean; maxBytes?: number } = {}): Check<any> {
    return (val, p) => {
      if (val === undefined) return opts.optional ? undefined : fail(p, 'is required');
      if (JSON.stringify(val).length > (opts.maxBytes ?? 200_000)) fail(p, 'is too large');
      return val;
    };
  },
};

export function parse<T>(check: Check<T>, body: unknown): T {
  return check(body, '');
}
