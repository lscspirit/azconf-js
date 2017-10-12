import { expect } from "chai";
import Chance from "chance";
import { factory } from "factory-girl";

import ConfMap from "../../../src/azconf/conf_map";
import ConfEntry from "../../../src/azconf/conf_entry";
import { randomKeySegments } from "../../factories/conf_entry";

const chance = new Chance();

describe("ConfMap", function() {
  describe("::new", function() {

  });

  //
  // #get
  //

  describe("#get", function() {
    beforeEach(async function() {
      this.entry = await factory.build("conf_entry", {}, {
        key_size: chance.integer({min: 3, max: 7})
      });
      this.conf_map = new ConfMap([this.entry]);
    });

    describe("with full key", function() {
      it("returns a value", function() {
        expect(this.conf_map.get(this.entry.key)).to.not.be.null;
      });

      it("returns the value at the key", function() {
        expect(this.conf_map.get(this.entry.key)).to.eq(this.entry.value);
      });
    });

    describe("with partial key", function() {
      it("returns a value", function() {
        const splitted = randomSplitKeySegments(this.entry.key_segments);
        expect(this.conf_map.get(splitted[0].join("."))).to.not.be.null;
      });

      it("returns a ConfMap instance", function() {
        const splitted = randomSplitKeySegments(this.entry.key_segments);
        expect(this.conf_map.get(splitted[0].join("."))).to.be.an.instanceof(ConfMap);
      });

      it("returns a ConfMap that contains the remaining branch", function() {
        const splitted = randomSplitKeySegments(this.entry.key_segments);
        const partial  = this.conf_map.get(splitted[0].join("."));
        expect(partial.get(splitted[1].join("."))).to.eq(this.entry.value);
      });
    });

    describe("with non-existing key", function() {
      it("returns null", function() {
        const random_key = randomKeySegments(chance.integer({min: 3, max: 6})).join(".");
        expect(this.conf_map.get(random_key)).to.be.null;
      });
    });
  });

  //
  // #entry
  //

  describe("#entry", function() {
    beforeEach(async function() {
      this.entry = await factory.build("conf_entry", {}, {
        key_size: chance.integer({min: 3, max: 7})
      });
      this.conf_map = new ConfMap([this.entry]);
    });

    describe("with full key", function() {
      it("returns a value", function() {
        expect(this.conf_map.entry(this.entry.key)).to.not.be.null;
      });

      it("returns a ConfEntry instance", function() {
        expect(this.conf_map.entry(this.entry.key)).to.be.instanceof(ConfEntry);
      });

      it("returns right ConfEntry", function() {
        const result = this.conf_map.entry(this.entry.key);
        expect(result.key).to.eq(this.entry.key);
        expect(result.value).to.eq(this.entry.value);
      });
    });

    describe("with partial key", function() {
      it("returns a value", function() {
        const splitted = randomSplitKeySegments(this.entry.key_segments);
        expect(this.conf_map.entry(splitted[0].join("."))).to.not.be.null;
      });

      it("returns a ConfMap instance", function() {
        const splitted = randomSplitKeySegments(this.entry.key_segments);
        expect(this.conf_map.entry(splitted[0].join("."))).to.be.an.instanceof(ConfMap);
      });

      it("returns a ConfMap that contains the remaining branch", function() {
        const splitted = randomSplitKeySegments(this.entry.key_segments);
        const partial  = this.conf_map.entry(splitted[0].join("."));
        expect(partial.get(splitted[1].join("."))).to.eq(this.entry.value);
      });
    });

    describe("with non-existing key", function() {
      it("returns null", function() {
        const random_key = randomKeySegments(chance.integer({min: 3, max: 6})).join(".");
        expect(this.conf_map.entry(random_key)).to.be.null;
      });
    });
  });

  //
  // #entries
  //

  describe("#entries", function() {
    describe("when there is no entry", function() {
      beforeEach(function() {
        this.conf_map = new ConfMap();
      });

      it("returns an array", function() {
        expect(this.conf_map.entries).to.be.an.instanceof(Array);
      });

      it("returns an empty array", function() {
        expect(this.conf_map.entries).to.have.lengthOf(0);
      });
    });

    describe("when there are entries", function() {
      beforeEach(async function() {
        this.entries = await factory.buildMany("conf_entry", chance.integer({
          min:3, max: 10
        }));
        this.conf_map = new ConfMap(this.entries);
      });

      it("returns an array", function() {
        expect(this.conf_map.entries).to.be.an.instanceof(Array);
      });

      it("returns an array with the right number of entries", function() {
        expect(this.conf_map.entries).to.have.lengthOf(this.entries.length);
      });

      it("returns all the entries", function() {
        const target = this.conf_map.entries;
        this.entries.forEach(function(e) {
          const found = target.find(t => e.key === t.key && e.value === t.value);
          expect(found).to.not.be.null;
        });
      });
    });
  });

  //
  // #merge
  //

  describe("#merge", function() {
    beforeEach(async function() {
      this.orig_entries = await factory.buildMany("conf_entry", chance.integer({min:3, max: 10}));
      this.new_entries  = await factory.buildMany("conf_entry", chance.integer({min:3, max: 10}));

      this.target = new ConfMap(this.orig_entries);
    });

    describe("without any conflicting key", function() {
      beforeEach(function() {
        const new_map = new ConfMap(this.new_entries);
        this.target.merge(new_map);
      });

      it("keeps all the original entries", function() {
        this.orig_entries.forEach(e => {
          expect(this.target.entry(e.key)).to.not.be.null;
        });
      });

      it("add all the new entries", function() {
        this.new_entries.forEach(e => {
          expect(this.target.entry(e.key)).to.not.be.null;
        });
      });

      it("keeps all the values in the original entries", function() {
        this.orig_entries.forEach(e => {
          expect(this.target.get(e.key)).to.eq(e.value);
        });
      });

      it("keeps all the values in the new entries", function() {
        this.new_entries.forEach(e => {
          expect(this.target.get(e.key)).to.eq(e.value);
        });
      });
    });

    describe("with single conflicting key entry", function() {
      beforeEach(async function() {
        // create the conflicting entry
        const conflict_key = chance.pickone(this.orig_entries).key;
        this.conflict = await factory.build("conf_entry", {}, { key: conflict_key });

        // create a new map with a conflicting entry
        const new_map  = new ConfMap(this.new_entries.concat([this.conflict]));
        this.target.merge(new_map);
      });

      it("keeps all the original entries", function() {
        this.orig_entries.forEach(e => {
          expect(this.target.entry(e.key)).to.not.be.null;
        });
      });

      it("add all the new entries", function() {
        this.new_entries.forEach(e => {
          expect(this.target.entry(e.key)).to.not.be.null;
        });
      });

      it("keeps all the values in non-conflicting original entries", function() {
        this.orig_entries.forEach(e => {
          if (e.key === this.conflict.key) return;    // skip conflicting entry
          expect(this.target.get(e.key)).to.eq(e.value);
        });
      });

      it("keeps all the values in non-conflicting new entries", function() {
        this.new_entries.forEach(e => {
          if (e.key === this.conflict.key) return;    // skip conflicting entry
          expect(this.target.get(e.key)).to.eq(e.value);
        });
      });

      it("picks the value from the new entry for the conflicting key", function() {
        expect(this.target.get(this.conflict.key)).to.eq(this.conflict.value);
      });
    });

    describe("with multiple conflicting key entries", function() {
      beforeEach(async function() {
        // create the conflicting entries
        const count = chance.integer({min: 2, max: this.orig_entries.length});
        const promises = chance.pickset(this.orig_entries, count).map(e => {
          return factory.build("conf_entry", {}, { key: e.key });
        });
        this.conflicts = await Promise.all(promises);

        // create a new map with a conflicting entry
        const new_map  = new ConfMap(this.new_entries.concat(this.conflicts));
        this.target.merge(new_map);
      });

      it("keeps all the original entries", function() {
        this.orig_entries.forEach(e => {
          expect(this.target.entry(e.key)).to.not.be.null;
        });
      });

      it("add all the new entries", function() {
        this.new_entries.forEach(e => {
          expect(this.target.entry(e.key)).to.not.be.null;
        });
      });

      it("keeps all the values in non-conflicting original entries", function() {
        this.orig_entries.forEach(e => {
          if (this.conflicts.find(c => e.key === c.key)) return;    // skip conflicting entry
          expect(this.target.get(e.key)).to.eq(e.value);
        });
      });

      it("keeps all the values in non-conflicting new entries", function() {
        this.new_entries.forEach(e => {
          if (this.conflicts.find(c => e.key === c.key)) return;    // skip conflicting entry
          expect(this.target.get(e.key)).to.eq(e.value);
        });
      });

      it("picks the value from the new entry for the conflicting key", function() {
        this.conflicts.forEach(c => {
          expect(this.target.get(c.key)).to.eq(c.value);
        });
      });
    });
  });
});

//
// Helper Methods
//

function randomSplitKeySegments(segments) {
  const length = segments.length;
  if (length < 2) throw new Error("cannot split with less than two segments");

  const split  = chance.integer({min: 1, max: length - 1});
  return [segments.slice(0, split), segments.slice(split)];
}