import path from "path";
import glob from "glob";

import ConfMap from "./azconf/conf_map";
import Source  from "./azconf/sources/base";

export default class Loader {
  constructor(configs) {
    this._configs = configs;
  }

  load() {
    const sources   = this._expandSources(this._configs.sources);
    const overrides = this._expandSources(this._configs.overrides);
    const entries   = this._extractApplicableEntries(sources);
    const override_entries = this._extractApplicableEntries(overrides);

    const conf_map     = new ConfMap(entries);
    const override_map = new ConfMap(override_entries);

    return conf_map.merge(override_map);
  }

  //
  // Private Methods
  //

  _expandSources(srcs) {
    const expanded = [];

    // expands each source in the Configs
    // and convert each into a Source object
    srcs.forEach(src_or_path => {
      if (src_or_path instanceof Source) {
        expanded.push(src_or_path);
      } else {
        // assume this is a string and is a path
        // then expand the path through glob
        glob.sync(src_or_path).forEach(src_path => {
          const ext = path.extname(src_path);

          // find the appropriate Source class to handle this file format
          const sourceClass = this._configs.sourceClassByExt(ext);
          if (sourceClass) {
            expanded.push(new sourceClass(src_path));
          } else {
            throw new Error(`unsupported config file format '${ext}'`);
          }
        });
      }
    });

    return expanded;
  }

  _extractApplicableEntries(sources) {
    const env    = this._configs.env;
    const domain = this._configs.domain;

    return sources.reduce((list, src) => {
      const filtered = src.entries.filter(e => e.isApplicable(env, domain));
      return list.concat(filtered);
    }, []);
  }
}