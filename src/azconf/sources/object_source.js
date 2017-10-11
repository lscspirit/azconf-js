import flatten from "flat";

import Source from "./base";
import ConfEntry from "../conf_entry";

export default class ObjectSource extends Source {
  constructor(obj) {
    super();

    // parse the source object if it has not been done
    const flat_obj = flatten(obj, { safe: true });
    for (let key_string in flat_obj) {
      this._entries.push(new ConfEntry(key_string, flat_obj[key_string]));
    }
  }
}