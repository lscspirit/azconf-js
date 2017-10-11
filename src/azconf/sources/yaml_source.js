import flatten from "flat";
import yaml from "js-yaml";
import fs from "fs";

import Source from "./base";
import ConfEntry from "../conf_entry";

export default class YAMLSource extends Source {
  constructor(path) {
    super();

    const cfg_yaml = fs.readFileSync(path);
    const cfg_obj  = yaml.safeLoad(cfg_yaml);

    // parse the source object if it has not been done
    const flat_obj = flatten(cfg_obj, { safe: true });
    for (let key_string in flat_obj) {
      this._entries.push(new ConfEntry(key_string, flat_obj[key_string]));
    }
  }
}