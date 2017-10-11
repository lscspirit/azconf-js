import flatten from "flat";
import fs from "fs";

import Source from "./base";
import ConfEntry from "../conf_entry";

export default class JSONSource extends Source {
  constructor(path) {
    super();

    const cfg_json = fs.readFileSync(path);
    const cfg_obj  = JSON.parse(cfg_json);

    // parse the source object if it has not been done
    const flat_obj = flatten(cfg_obj, { safe: true });
    for (let key_string in flat_obj) {
      this._entries.push(new ConfEntry(key_string, flat_obj[key_string]));
    }
  }
}