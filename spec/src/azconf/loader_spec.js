import { expect } from "chai";
import fs from "fs";
import tmp from "tmp";
import yaml from "js-yaml";
import Chance from "chance";

import Loader from "../../../src/azconf/loader";
import Configs from "../../../src/azconf/configs";
import ConfMap from "../../../src/azconf/conf_map";
import ObjectSource from "../../../src/azconf/sources/object_source";
import { randomSegment } from "../../factories/conf_entry";

const chance = new Chance();

describe("Loader", function() {
  beforeEach(function() {
    this.configs = new Configs();
    this.configs.env = randomSegment();
    this.configs.domain = randomSegment();
  });

  describe("#load", function() {
    describe("with object source", function() {
      beforeEach(function() {
        let map = injectRandomConfigs({}, this.configs.env, this.configs.domain);
        map = injectRandomConfigs(map, randomSegment(), randomSegment());

        this.source = new ObjectSource(map);
        this.configs.sources.push(this.source);
        this.loader = new Loader(this.configs);

        this.applicables = this.source.entries.filter(e =>
          e.isApplicable(this.configs.env, this.configs.domain)
        );
        this.result = this.loader.load();
      });

      itBehavesLikeALoader();
    });

    describe("with file path source", function() {
      beforeEach(function() {
        let map = injectRandomConfigs({}, this.configs.env, this.configs.domain);
        map = injectRandomConfigs(map, randomSegment(), randomSegment());

        this.file = writeToFiles(map);
        this.configs.sources.push(this.file.name);
        this.loader = new Loader(this.configs);

        this.applicables = (new ObjectSource(map)).entries.filter(e =>
          e.isApplicable(this.configs.env, this.configs.domain)
        );
        this.result = this.loader.load();
      });

      itBehavesLikeALoader();
    });

    describe("with wildcard file path sources", function() {
      beforeEach(function() {
        const map_count = chance.integer({min: 2, max: 5});
        const maps = [];
        for (let i = 0; i < map_count; i++) {
          let m = injectRandomConfigs({}, this.configs.env, this.configs.domain);
          m = injectRandomConfigs(m, randomSegment(), randomSegment());
          maps.push(m);
        }

        // write config into files with the same tmp directory
        this.dir = tmp.dirSync();
        writeToFiles(maps, this.dir.name);

        // create the loader
        this.configs.sources.push(`${this.dir.name}/*`);
        this.loader = new Loader(this.configs);

        // find all applicable entries from the source config objects
        this.applicables = maps.reduce((appl, cfg_map) => {
          const entries  = (new ObjectSource(cfg_map)).entries;
          const filtered = entries.filter(e =>
            e.isApplicable(this.configs.env, this.configs.domain)
          );
          return appl.concat(filtered);
        }, []);
        this.result = this.loader.load();
      });

      itBehavesLikeALoader();
    });

    describe("with mixed source types", function() {
      beforeEach(function() {
        const map_count = chance.integer({min: 2, max: 5});
        const maps = [];
        for (let i = 0; i < map_count; i++) {
          let m = injectRandomConfigs({}, this.configs.env, this.configs.domain);
          m = injectRandomConfigs(m, randomSegment(), randomSegment());
          maps.push(m);
        }

        // convert the config map into either a file or a ObjectSource
        maps.forEach(m => {
          const as_file = chance.bool();
          if (as_file) {
            this.configs.sources.push(writeToFiles(m).name);
          } else {
            this.configs.sources.push(new ObjectSource(m));
          }
        });

        this.loader = new Loader(this.configs);

        // find all applicable entries from the source config objects
        this.applicables = maps.reduce((appl, cfg_map) => {
          const entries  = (new ObjectSource(cfg_map)).entries;
          const filtered = entries.filter(e =>
            e.isApplicable(this.configs.env, this.configs.domain)
          );
          return appl.concat(filtered);
        }, []);
        this.result = this.loader.load();
      });

      itBehavesLikeALoader();
    });

    describe("with unsupported file format", function() {
      beforeEach(function() {
        const ext = chance.pickone(["txt", "zip", "jpeg", "gif"]);
        this.file = tmp.fileSync({ postfix: `.${ext}` });
        this.configs.sources.push(this.file.name);
        this.loader = new Loader(this.configs);
      });

      it("throws an error", function() {
        expect(() => this.loader.load()).to.throw(Error, "unsupported config file format");
      });
    });

    describe("with overrides", function() {
      beforeEach(function() {
        let map = injectRandomConfigs({}, this.configs.env, this.configs.domain);
        map = injectRandomConfigs(map, randomSegment(), randomSegment());

        this.source = new ObjectSource(map);

        // create the override entries
        const src_entries = this.source.entries;
        const to_override = chance.pickset(src_entries, chance.natural({
          min: 1, max: src_entries.length
        }));
        let override_map = to_override.reduce((om, orig) => {
          // assign new value to this key
          om[orig.key_string] = chance.sentence();
          return om;
        }, {});
        // add random configs to the override map
        override_map = injectRandomConfigs(override_map, randomSegment(), randomSegment());
        this.override = new ObjectSource(override_map);

        this.configs.sources.push(this.source);
        this.configs.overrides.push(this.override);

        this.loader = new Loader(this.configs);

        this.applicables = this.source.entries.filter(e =>
          e.isApplicable(this.configs.env, this.configs.domain)
        );
        this.appl_overrides = this.override.entries.filter(e =>
          e.isApplicable(this.configs.env, this.configs.domain)
        );
        this.result = this.loader.load();
      });

      it("returns a ConfMap instance", function() {
        expect(this.result).to.be.an.instanceof(ConfMap);
      });

      it("returns a ConfMap with the same number of applicable entries in both source and overrides", function() {
        const all_applicables = this.applicables.concat(this.appl_overrides);
        const key_set = new Set(all_applicables.map(a => a.key));
        expect(this.result.entries).to.have.lengthOf(key_set.size);
      });

      it("returns a ConfMap with all non-overriden applicable entries from the source", function() {
        const result_entries = this.result.entries;
        this.applicables.forEach(s => {
          if (this.appl_overrides.find(o => s.key === o.key)) return;
          const found = result_entries.find(r => s.key === r.key && s.value === r.value);
          expect(found).to.exist;
        });
      });

      it("returns a ConfMap with all applicable entries from the overrides", function() {
        const result_entries = this.result.entries;
        this.appl_overrides.forEach(s => {
          const found = result_entries.find(r => s.key === r.key && s.value === r.value);
          expect(found).to.exist;
        });
      });
    });
  });
});

//
// Shared Tests
//

function itBehavesLikeALoader() {
  it("returns a ConfMap instance", function() {
    expect(this.result).to.be.an.instanceof(ConfMap);
  });

  it("returns a ConfMap with the same number of applicable entries as the sources", function() {
    expect(this.result.entries).to.have.lengthOf(this.applicables.length);
  });

  it("returns a ConfMap with all applicable entries from the sources", function() {
    const result_entries = this.result.entries;
    this.applicables.forEach(s => {
      const found = result_entries.find(r => s.key === r.key && s.value === r.value);
      expect(found).to.exist;
    });
  });
}

//
// Helper Methods
//

function injectRandomConfigs(target, env, domain) {
  const branch = createConfigBranch();
  target[env] = { [domain]: branch };
  return target;
}

const MAX_CHILDREN = 5;
const MAX_LEVELS   = 5;
function createConfigBranch(level) {
  const node = {};
  level = level || 0;

  let count = 0;
  let terminate = false;
  while (!terminate) {
    let value_node = level >= MAX_LEVELS || chance.bool();
    let child = value_node ? chance.sentence() : createConfigBranch(level + 1);
    node[randomSegment()] = child;

    // roll terminate flag for next cycle
    terminate = ++count >= MAX_CHILDREN || chance.bool();
  }

  return node;
}

function writeToFiles(cfgs, dir) {
  const all_cfgs = Array.isArray(cfgs) ? cfgs : [cfgs];

  // write each config into individual file
  const paths = all_cfgs.map(c => {
    const format = chance.pickone(["json", "yml"]);
    const tmp_file = tmp.fileSync({ dir: dir, postfix: `.${format}` });

    // convert the config object into string
    let cfg_str  = null;
    switch(format) {
      case "yaml":
        cfg_str = yaml.safeDump(c);
        break;
      default:
        cfg_str = JSON.stringify(c);
        break;
    }

    // write to file
    fs.writeFileSync(tmp_file.name, cfg_str);
    return tmp_file;
  });

  return Array.isArray(cfgs) ? paths : paths[0];
}