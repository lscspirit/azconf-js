import { expect } from "chai";
import fs from "fs";
import tmp from "tmp";
import yaml from "js-yaml";
import Chance from "chance";

import itBehavesLikeASource, { buildConfigObject, compressRandomNodes } from "./spec_utils";
import YAMLSource from "../../../../src/azconf/sources/yaml_source";

const chance = new Chance();

describe("YAMLSource", function() {
  beforeEach(function() {
    this.yaml_file = tmp.fileSync();
  });

  afterEach(function() {
    if (this.yaml_file) this.yaml_file.removeCallback();
  });

  describe("with single level key object", function() {
    beforeEach(function() {
      this.config_map = buildConfigObject(1, 1, [chance.integer({min: 3, max: 10})]);
      writeToYAMLFile(this.config_map, this.yaml_file.name);
      this.source = new YAMLSource(this.yaml_file.name);
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

      writeToYAMLFile(this.config_map, this.yaml_file.name);
      this.source = new YAMLSource(this.yaml_file.name);
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

      writeToYAMLFile(this.config_map, this.yaml_file.name);
      this.source = new YAMLSource(this.yaml_file.name);
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
      writeToYAMLFile(compressed, this.yaml_file.name);
      this.source = new YAMLSource(this.yaml_file.name);
    });

    itBehavesLikeASource();
  });
});

function writeToYAMLFile(obj, path) {
  const yaml_string = yaml.safeDump(obj);
  fs.writeFileSync(path, yaml_string);
}