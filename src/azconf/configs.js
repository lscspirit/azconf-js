import JSONSource from "./sources/json_source";
import YAMLSource from "./sources/yaml_source";

export default class Configs {
  constructor() {
    this._env     = null;
    this._domain  = null;
    this._sources = [];
    this._override_sources = [];

    this._source_ext = {
      json: JSONSource,
      yml:  YAMLSource,
      yaml: YAMLSource
    };
  }

  static getDefault() {
    const cfg = new Configs();
    cfg.env       = process.env.NODE_ENV;
    cfg.sources   = ["./config/*"];
    cfg.overrides = ["./config/overrides.*"];
    return cfg;
  }

  //
  // Accessors
  //

  get env() {
    return this._env || process.env.NODE_ENV;
  }

  set env(e) {
    this._env = e;
  }

  get domain() {
    return this._domain;
  }

  set domain(d) {
    this._domain = d;
  }

  get sources() {
    return this._sources;
  }

  set sources(srcs) {
    this._sources = srcs;
  }

  get overrides() {
    return this._override_sources;
  }

  set overrides(srcs) {
    this._override_sources = srcs;
  }

  addExtension(extension, source_cls) {
    this._source_ext[extension] = source_cls;
  }

  sourceClassByExt(extension) {
    return this._source_ext[extension];
  }
}
