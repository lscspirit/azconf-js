import Configs from "./azconf/config";
import Loader  from "./azconf/loader";

export class AZConf {
  constructor() {
    this._configs  = Configs.getDefault();
    this._conf_map = null;
  }

  configure(cfg_cb) {
    if (cfg_cb instanceof Configs) {
      this._configs = cfg_cb;
    } else {
      cfg_cb(this._configs);
    }
  }

  get(key) {
    if (!this._conf_map) this.load();
    return this._conf_map.get(key);
  }

  entry(key) {
    if (!this._conf_map) this.load();
    return this._conf_map.entry(key);
  }

  load() {
    const loader   = new Loader(this._configs);
    this._conf_map = loader.load();
  }
}

export default new AZConf();