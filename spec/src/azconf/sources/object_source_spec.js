import { expect } from "chai";
import Chance from "chance";

import itBehavesLikeASource, { buildConfigObject, compressRandomNodes } from "./spec_utils";
import ObjectSource from "../../../../src/azconf/sources/object_source";

const chance = new Chance();

describe("ObjectSource", function() {
  describe("with single level key object", function() {
    beforeEach(function() {
      this.config_map = buildConfigObject(1, 1, [chance.integer({min: 3, max: 10})]);
      this.source = new ObjectSource(this.config_map);
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
      this.source = new ObjectSource(this.config_map);
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
      this.source = new ObjectSource(this.config_map);
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
      this.source = new ObjectSource(compressed);
    });

    itBehavesLikeASource();
  });
});