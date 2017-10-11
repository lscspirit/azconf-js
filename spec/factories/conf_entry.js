import { factory } from "factory-girl";
import Chance from "chance";

import ConfEntry from "../../src/azconf/conf_entry";

const chance = new Chance();

class ConfEntryFactory {
  constructor(attrs) {
    this._attrs = attrs;
  }

  toConfEntry() {
    return new ConfEntry(this._attrs.key_string, this._attrs.value);
  }
}

factory.define("conf_entry", ConfEntryFactory, buildOptions => {
  const key_size = buildOptions.key_size || chance.integer({min: 1, max: 5});
  const key = buildOptions.key || randomKeySegments(key_size).join(".");
  const env = buildOptions.env || "*";
  const domain = buildOptions.domain || "*";

  return {
    key_string: `${env}.${domain}.${key}`,
    value: chance.sentence()
  };
}, {
  afterBuild:  model => model.toConfEntry(),
  afterCreate: model => model.toConfEntry()
});

//
// Helper Methods
//

export function randomSegment() {
  return chance.string({
    length: chance.integer({min: 1, max: 10}),
    pool:   "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-"
  });
}

export function randomKeySegments(size) {
  const frags = [];
  const count = size || chance.integer({min: 1, max: 5});
  for (let i = 0; i < count; i++) {
    frags.push(randomSegment());
  }
  return frags;
}