import ConfEntry from "./conf_entry";

export default class ConfMap {
  constructor(entries_or_map) {
    if (Array.isArray(entries_or_map)) {
      this._map = buildMap(entries_or_map);
    } else {
      this._map = entries_or_map || {};
    }
  }

  get(key) {
    const val = this.entry(key);
    return (val instanceof ConfEntry) ? val.value : val;
  }

  entry(key) {
    const val = deepSearch(this._map, key);
    if (val) {
      // return ConfEntry or a ConfMap of the subtree
      return (val instanceof ConfEntry) ? val : new ConfMap(val);
    } else {
      // return null if entry is not found
      return null;
    }
  }

  get entries() {
    return deepList(this._map);
  }

  merge(other) {
    other.entries.forEach(o => deepAdd(this._map, o.key_segments, o, true));
    return this;
  }
}

//
// Helper Methods
//

function buildMap(entries) {
  const map = {};
  entries.forEach(e => deepAdd(map, e.key_segments, e));
  return map;
}

function deepAdd(target, key_segs, entry, overwrite) {
  const current_seg = key_segs[0];
  const current_val = target[current_seg];

  if (key_segs.length > 1) {
    // if there is more key segments to process, then process the next segment
    if (current_val instanceof ConfEntry) {
      // throw an error if there is already an config value at this key
      throw new Error(`key conflict: '${entry.key}' already has a value`);
    }

    // pass entry to the next segment
    target[current_seg] = deepAdd(current_val || {},
      key_segs.slice(1), entry, overwrite);
  } else {
    // this is the last key segment, then attempt to assign the entry
    if (!current_val) {
      // assign entry if there is nothing at the current key
      target[current_seg] = entry;
    } else if (current_val instanceof ConfEntry) {
      // overwrite the existing entry if needed
      if (overwrite || entry.specificity >= current_val.specificity) {
        target[current_seg] = entry;
      }
    } else {
      // throw an error if there is child entry at this key
      throw new Error(`key conflict: '${entry.key}' already has at least one child entry`);
    }
  }

  return target;
}

function deepSearch(map, key) {
  const segs = key.split(".");
  return segs.reduce((last, seg) => {
    // return null if there was nothing at the last segment
    // or if the last segment already contain a config entry;
    // otherwise return the value for this segment
    if (!last) return null;
    return last instanceof ConfEntry ? last : last[seg];
  }, map);
}

function deepList(map) {
  return Object.keys(map).reduce((list, key) => {
    const val = map[key];
    if (!val) {
      return list;
    } else if (val instanceof ConfEntry) {
      list.push(val);
      return list;
    } else {
      return list.concat(deepList(val));
    }
  }, []);
}