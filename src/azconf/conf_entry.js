export default class ConfEntry {
  constructor(key_str, value) {
    try {
      this._parseKeyString(key_str);
    } catch(err) {
      err.message = `invalid config key string '${key_str}': ${err.message}`;
    }

    this._value = normalizeValue(value);
  }

  isApplicable(env, domain) {
    // first compare env
    if (env === this.env || this.env === null) {
      // then compare domain
      if (domain === this.domain || this.domain === null) {
        return true;
      }
    }

    return false;
  }

  //
  // Accessors
  //

  get env() {
    return this._env;
  }

  get domain() {
    return this._domain;
  }

  get key() {
    return this._key_segments.join(".");
  }

  get key_segments() {
    return this._key_segments;
  }

  get key_string() {
    return `${this.env || "*"}.${this.domain || "*"}.${this.key}`;
  }

  get value() {
    return this._value;
  }

  get specificity() {
    let score = 0;
    if (this.env)    score += 1;    // add one point if env is specified
    if (this.domain) score += 10;   // add 10 points if domain is specified
    return score;
  }

  toString() {
    return `${this.key_string}: ${this.value}`;
  }

  //
  // Static Methods
  //

  static sort(entries) {
    const with_idx = entries.map((e, idx) => ({ idx: idx, entry: e }));
    with_idx.sort((a, b) => {
      const a_entry = a.entry;
      const b_entry = b.entry;
      const a_key_segs = a_entry.key_segments;
      const b_key_segs = b_entry.key_segments;

      // first compare each key segments lexically
      for (let f_idx = 0; f_idx < a_key_segs.length &&
        f_idx < b_key_segs.length; f_idx++) {
        compare = a_key_segs[f_idx].localeCompare(b_key_segs[f_idx]);
        if (compare !== 0) return compare;
      }

      // if one key is a child of the other, then compare the segment length
      // (e.g. a.b.c vs a.b.c.d)
      let compare = a_key_segs.length - b_key_segs.length;
      if (compare !== 0) return compare;

      // then compare specificity if key segments are the same
      compare = a_entry.specificity - b_entry.specificity;
      if (compare !== 0) return compare;

      // then compare env if specificities are the same
      compare = nullCompare(a_entry.env, b_entry.env);
      if (compare !== 0) return compare;

      // then compare domain if envs are the same
      compare = nullCompare(a_entry.domain, b_entry.domain);
      if (compare !== 0) return compare;

      // if everything is the same, then preserve the original order in the array
      return a.idx - b.idx;
    });
    return with_idx.map(e => e.entry);
  }

  //
  // Private Methods
  //

  _parseKeyString(key_str) {
    const sanitized = key_str.trim().replace(/\r?\n|\r/g, "");
    const key_parts = sanitized.split(".");

    if (key_parts.length < 3) {
      throw new Error("must be in the format '<env>.<domain>.<key>'");
    }

    this._env    = normalizeKeyPart(key_parts[0], true);
    this._domain = normalizeKeyPart(key_parts[1], true);
    this._key_segments = [];
    for (let i = 2; i < key_parts.length; i++) {
      this._key_segments.push(normalizeKeyPart(key_parts[i], false));
    }
  }
}

//
// Helper Methods
//

function normalizeValue(value) {
  if (value === null || value === undefined || value === "") return null;
  return value;
}

function normalizeKeyPart(part, allow_wildcard) {
  const trimmed = part.trim();
  if (trimmed.length === 0) {
    throw new Error("must provide env, domain and key");
  } else if (trimmed === "*") {
    if (!allow_wildcard) throw new Error("cannot use wildcard inside key");
    return null;
  }

  return trimmed;
}

function nullCompare(a, b) {
  if (a === b) return 0;
  else if (a === null) return -1;
  else if (b === null) return 1;
  else return a.localeCompare(b);
}