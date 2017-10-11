import { expect } from "chai";
import fs from "fs";
import tmp from "tmp";
import Chance from "chance";

import itBehavesLikeASource, { buildConfigObject, compressRandomNodes } from "./spec_utils";
import JSONSource from "../../../../src/azconf/sources/json_source";

const chance = new Chance();

describe("JSONSource", function() {
  beforeEach(function() {
    this.json_file = tmp.fileSync();
  });

  afterEach(function() {
    if (this.json_file) this.json_file.removeCallback();
  });

  describe("with single level key object", function() {
    beforeEach(function() {
      this.config_map = buildConfigObject(1, 1, [chance.integer({min: 3, max: 10})]);
      writeToJSONFile(this.config_map, this.json_file.name);
      this.source = new JSONSource(this.json_file.name);
    });

    itBehavesLikeASource();
  });

  describe("with multi-level key object", function() {
    beforeEach(function() {
      this.config_map = buildConfigObject(1, 1, [
        chance.integer({min: 3, max: 10}),
        chance.integer({min: 3, max: 10}),
        chance.integer({min: 3, max: 10})
      ]);

      writeToJSONFile(this.config_map, this.json_file.name);
      this.source = new JSONSource(this.json_file.name);
    });

    itBehavesLikeASource();
  });

  describe("with multiple envs and domains", function() {
    beforeEach(function() {
      this.config_map = buildConfigObject(
        chance.integer({min: 2, max: 5}),
        chance.integer({min: 2, max: 5}),
        [
          chance.integer({min: 3, max: 15}),
          chance.integer({min: 3, max: 15}),
          chance.integer({min: 3, max: 15})
        ]
      );

      writeToJSONFile(this.config_map, this.json_file.name);
      this.source = new JSONSource(this.json_file.name);
    });

    itBehavesLikeASource();
  });

  describe("with compressed key object", function() {
    beforeEach(function() {
      this.config_map = buildConfigObject(1, 1, [
        chance.integer({min: 3, max: 10}),
        chance.integer({min: 3, max: 10}),
        chance.integer({min: 3, max: 10})
      ]);

      // randomly compress some node keys
      const compressed = compressRandomNodes(this.config_map);
      writeToJSONFile(compressed, this.json_file.name);
      this.source = new JSONSource(this.json_file.name);
    });

    itBehavesLikeASource();
  });
});

function writeToJSONFile(obj, path) {
  fs.writeFileSync(path, JSON.stringify(obj));
}