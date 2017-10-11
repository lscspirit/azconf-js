import { expect } from "chai";
import Chance from "chance";
import { factory } from "factory-girl";

import ConfEntry from "../../../src/azconf/conf_entry";
import { randomSegment, randomKeySegments } from "../../factories/conf_entry";

const chance = new Chance();

describe("ConfEntry", function() {
  function buildRandomConfEntry(attrs) {
    attrs = attrs || {};

    this.env    = attrs.env || chance.pickone(["*", randomSegment()]);
    this.domain = attrs.domain || chance.pickone(["*", randomSegment()]);
    this.key_segments = attrs.key_segments || randomKeySegments();
    this.value  = attrs.value || chance.sentence();

    const key_str = `${this.env}.${this.domain}.${this.key_segments.join(".")}`;
    this.entry = new ConfEntry(key_str, this.value);
  }

  //
  // ::new
  //
  describe("::new", function() {
    describe("with valid key string", function() {
      beforeEach(function() {
        buildRandomConfEntry.call(this);
      });

      it("creates a ConfEntry instance", function() {
        expect(this.entry).to.be.an.instanceof(ConfEntry);
      });

      it("has the right env", function() {
        expect(this.entry.env).to.eq(this.env === "*" ? null : this.env);
      });

      it("has the right domain", function() {
        expect(this.entry.domain).to.eq(this.domain === "*" ? null : this.domain);
      });

      it("has the right key segments", function() {
        expect(this.entry.key_segments).to.eql(this.key_segments);
      });

      it("has the right value", function() {
        expect(this.entry.value).to.eq(this.value);
      });
    });
  });

  //
  // #isApplicable
  //
  describe("#isApplicable", function() {
    describe("for entry with non-wildcard env and domain", function() {
      beforeEach(function() {
        buildRandomConfEntry.call(this, {
          env: randomSegment(),
          domain: randomSegment()
        });
      });

      it("returns true with the exact env and domain", function() {
        expect(this.entry.isApplicable(this.env, this.domain)).to.be.true;
      });

      it("returns false with any other env", function() {
        expect(this.entry.isApplicable(randomSegment(), this.domain)).to.be.false;
      });

      it("returns false with any other domain", function() {
        expect(this.entry.isApplicable(this.env, randomSegment())).to.be.false;
      });

      it("returns false with any other env and domain", function() {
        expect(this.entry.isApplicable(randomSegment(), randomSegment())).to.be.false;
      });
    });

    describe("for entry with non-wildcard env and wildcard domain", function() {
      beforeEach(function() {
        buildRandomConfEntry.call(this, {
          env: randomSegment(),
          domain: "*"
        });
      });

      it("returns true with the exact env and any domain", function() {
        expect(this.entry.isApplicable(this.env, randomSegment())).to.be.true;
      });

      it("returns false with any other env and domain", function() {
        expect(this.entry.isApplicable(randomSegment(), randomSegment())).to.be.false;
      });
    });

    describe("for entry with wildcard env and non-wildcard domain", function() {
      beforeEach(function() {
        buildRandomConfEntry.call(this, {
          env: "*",
          domain: randomSegment()
        });

        it("returns true with the any env and exact domain", function() {
          expect(this.entry.isApplicable(randomSegment(), this.domain)).to.be.true;
        });

        it("returns false with any other env and domain", function() {
          expect(this.entry.isApplicable(randomSegment(), randomSegment())).to.be.false;
        });
      });
    });

    describe("for entry with wildcard env and domain", function() {
      beforeEach(function() {
        buildRandomConfEntry.call(this, {
          env: "*",
          domain: "*"
        });
      });

      it("returns true with the any env and exact domain", function() {
        expect(this.entry.isApplicable(randomSegment(), randomSegment())).to.be.true;
      });
    });
  });

  //
  // #env
  //
  describe("#env", function() {
    describe("with non-wildcard env", function() {
      beforeEach(function() {
        buildRandomConfEntry.call(this, {
          env: randomSegment()
        });
      });

      it("returns non-null", function() {
        expect(this.entry.env).to.not.be.null;
      });

      it("returns the right env", function() {
        expect(this.entry.env).to.eq(this.env);
      });
    });

    describe("with wildcard env", function() {
      beforeEach(function() {
        buildRandomConfEntry.call(this, {
          env: "*"
        });
      });

      it("returns null", function() {
        expect(this.entry.env).to.be.null;
      });
    });
  });

  //
  // #domain
  //
  describe("#domain", function() {
    describe("with non-wildcard domain", function() {
      beforeEach(function() {
        buildRandomConfEntry.call(this, {
          domain: randomSegment()
        });
      });

      it("returns non-null", function() {
        expect(this.entry.domain).to.not.be.null;
      });

      it("returns the right domain", function() {
        expect(this.entry.domain).to.eq(this.domain);
      });
    });

    describe("with wildcard domain", function() {
      beforeEach(function() {
        buildRandomConfEntry.call(this, {
          domain: "*"
        });
      });

      it("returns null", function() {
        expect(this.entry.domain).to.be.null;
      });
    });
  });

  //
  // #key
  //
  describe("#key", function() {
    beforeEach(function() {
      buildRandomConfEntry.call(this);
    });

    it("returns a string", function() {
      expect(this.entry.key).to.be.a("string");
    });

    it("returns the joined key segments", function() {
      expect(this.entry.key).to.eq(this.key_segments.join("."));
    });
  });

  //
  // #key
  //
  describe("#key_segments", function() {
    beforeEach(function() {
      buildRandomConfEntry.call(this);
    });

    it("returns an array", function() {
      expect(this.entry.key_segments).to.be.a.instanceof(Array);
    });

    it("returns right number of segments", function() {
      expect(this.entry.key_segments).to.have.lengthOf(this.key_segments.length);
    });

    it("returns the right segments", function() {
      expect(this.entry.key_segments).to.eql(this.key_segments);
    });
  });

  //
  // #key
  //
  describe("#value", function() {
    function buildConfEntryWithValue(value) {
      this.value = value;
      this.entry = new ConfEntry(
        `${randomSegment()}.${randomSegment()}.${randomKeySegments().join(".")}`,
        value
      );
    }

    describe("with non-null value", function() {
      beforeEach(function() {
        buildConfEntryWithValue.call(
          this,
          chance.pickone([
            chance.integer(),             // number
            chance.sentence(),            // string
            { some_key: chance.word() }   // object
          ])
        );
      });

      it("returns a value", function() {
        expect(this.entry.value).to.not.be.null;
      });

      it("returns the same value/object", function() {
        expect(this.entry.value).to.eq(this.value);
      });
    });

    describe("with undefined/null value", function() {
      beforeEach(function() {
        buildConfEntryWithValue.call(
          this, chance.pickone([null, undefined])
        );
      });

      it("returns null", function() {
        expect(this.entry.value).to.be.null;
      });
    });

    describe("with an empty string as value", function() {
      beforeEach(function() {
        buildConfEntryWithValue.call(this, "");
      });

      it("returns null", function() {
        expect(this.entry.value).to.be.null;
      });
    });

    describe("with whitespace string as value", function() {
      beforeEach(function() {
        buildConfEntryWithValue.call(this, "  ");
      });

      it("returns a value", function() {
        expect(this.entry.value).to.not.be.null;
      });

      it("returns the same string", function() {
        expect(this.entry.value).to.eq(this.value);




      });
    });
  });

  //
  // #specificity
  //
  describe("#specificity", function() {
    describe("with wildcard env and domain", function() {
      beforeEach(function() {
        buildRandomConfEntry.call(this, {
          env: "*",
          domain: "*"
        });
      });

      it("returns a score of zero", function() {
        expect(this.entry.specificity).to.eq(0);
      });
    });

    describe("with non-wildcard env and wildcard domain", function() {
      beforeEach(function() {
        buildRandomConfEntry.call(this, {
          env: randomSegment(),
          domain: "*"
        });
      });

      it("returns a score of 1", function() {
        expect(this.entry.specificity).to.eq(1);
      });
    });

    describe("with wildcard env and non-wildcard domain", function() {
      beforeEach(function() {
        buildRandomConfEntry.call(this, {
          env: "*",
          domain: randomSegment()
        });
      });

      it("returns a score of 10", function() {
        expect(this.entry.specificity).to.eq(10);
      });
    });

    describe("with non-wildcard env and domain", function() {
      beforeEach(function() {
        buildRandomConfEntry.call(this, {
          env: randomSegment(),
          domain: randomSegment()
        });
      });

      it("returns a score of 11", function() {
        expect(this.entry.specificity).to.eq(11);
      });
    });
  });

  //
  // #toString
  //
  describe("#toString", function() {
    beforeEach(function() {
      buildRandomConfEntry.call(this);
    });

    it("returns a string", function() {
      expect(this.entry.toString()).to.be.a("string");
    });

    it("returns a string representation", function() {
      const key_string = `${this.env}.${this.domain}.${this.key_segments.join(".")}`;
      expect(this.entry.toString()).to.eq(`${key_string}: ${this.value}`);
    });
  });

  describe("::sort", function() {
    function sortEntryByKey(entries) {
      const copy = entries.concat();
      copy.sort((a, b) => {
        // lexical sort
        const a_segs = a.key_segments;
        const b_segs = b.key_segments;

        let compare = 0;
        // first compare each segments until reaching the end of either
        // one of the key
        for (let i = 0; i < a_segs.length && i < b_segs.length; i++) {
          compare = a_segs[i].localeCompare(b_segs[i]);
          if (compare !== 0) return compare;
        }

        // if all segments are the same up to this point,
        // then the shorter key go first
        return a_segs.length - b_segs.length;
      });
      return copy;
    }

    function sortEntryBySpecifity(entries) {
      const copy = entries.concat();
      copy.sort((a, b) => {
        return a.specificity - b.specificity;
      });
      return copy;
    }

    function sortyEntryByEnvDomain(entries) {
      const copy = entries.concat();
      copy.sort((a, b) => {
        // first compare env
        if (a.env === b.env) {
          // if env is the same, then compare domain
          if (a.domain === b.domain) return 0;
          else if (a.domain && b.domain) return a.domain.localeCompare(b.domain);
          else if (a.domain === null) return -1;
          else return 1;
        } else if (a.env && b.env){
          // both a and b envs are not wildcard
          return a.env.localeCompare(b.env);
        } else if (a.env) {
          // a env is not wildcard
          return 1;
        } else {
          // b env is not wildcard
          return -1;
        }
      });
      return copy;
    }

    describe("entries with completely different keys", function() {
      beforeEach(async function() {
        this.entries = await factory.buildMany("conf_entry", chance.integer({min: 2, max: 5}));
        this.sorted  = ConfEntry.sort(this.entries);
      });

      it("returns an array", function() {
        expect(this.sorted).to.be.an.instanceof(Array);
      });

      it("returns with the same number of items", function() {
        expect(this.sorted).to.have.lengthOf(this.entries.length);
      });

      it("returns the entries in lexically sorted order", function() {
        expect(this.sorted).to.eql(sortEntryByKey(this.entries));
      });
    });

    describe("entries with same key", function() {
      describe("and different specificity", function() {
        beforeEach(async function() {
          const key = randomKeySegments().join(".");
          const env_domains = chance.shuffle([
            { env: "*", domain: "*" },
            { env: "*", domain: randomSegment() },
            { env: randomSegment(), domain: "*" },
            { env: randomSegment(), domain: randomSegment() }
          ]);

          this.entries = [];
          for (let i = 0; i < env_domains.length; i++) {
            this.entries.push(await factory.build("conf_entry", {}, {
              env:    env_domains[i].env,
              domain: env_domains[i].domain,
              key: key
            }));
          }

          this.sorted = ConfEntry.sort(this.entries);
        });

        it("returns an array", function() {
          expect(this.sorted).to.be.an.instanceof(Array);
        });

        it("returns with the same number of items", function() {
          expect(this.sorted).to.have.lengthOf(this.entries.length);
        });

        it("returns the entries sorted according to specificity", function() {
          expect(this.sorted).to.eql(sortEntryBySpecifity(this.entries));
        });
      });

      describe("and same specifity but different env/domain", function() {
        beforeEach(async function() {
          const count = chance.integer({min:3, max: 10});
          const key   = randomKeySegments().join(".");
          const wildcard_env    = chance.bool();
          const wildcard_domain = wildcard_env ? false : chance.bool();

          this.entries = [];
          for (let i = 0; i < count; i++) {
            this.entries.push(await factory.build("conf_entry", {}, {
              env:    wildcard_env ? "*" : randomSegment(),
              domain: wildcard_domain ? "*" : randomSegment(),
              key:    key
            }));
          }

          this.sorted = ConfEntry.sort(this.entries);
        });

        it("returns an array", function() {
          expect(this.sorted).to.be.an.instanceof(Array);
        });

        it("returns with the same number of items", function() {
          expect(this.sorted).to.have.lengthOf(this.entries.length);
        });

        it("returns the entries sorted according to env/domain comparison", function() {
          expect(this.sorted).to.eql(sortyEntryByEnvDomain(this.entries));
        });
      });

      describe("and same env/domain", function() {
        beforeEach(async function() {
          const count = chance.integer({min:3, max: 10});
          const key = randomKeySegments().join(".");
          const env = chance.pickone["*", randomSegment()];
          const domain = chance.pickone["*", randomSegment()];

          this.entries = await factory.buildMany("conf_entry", count, {}, {
            env: env,
            domain: domain,
            key: key
          });

          this.sorted = ConfEntry.sort(this.entries);
        });

        it("returns an array", function() {
          expect(this.sorted).to.be.an.instanceof(Array);
        });

        it("returns with the same number of items", function() {
          expect(this.sorted).to.have.lengthOf(this.entries.length);
        });

        it("returns the entries in the same order", function() {
          expect(this.sorted).to.eql(this.entries);
        });
      });
    });
  });
});