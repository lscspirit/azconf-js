import { expect } from "chai";
import Chance from "chance";

import { randomSegment } from "../../../factories/conf_entry";

const chance = new Chance();

//
// Tests
//

export default function itBehavesLikeASource() {
  it("has entries that comes from the object source", function() {
    const entries = this.source.entries;

    entries.forEach(e => {
      let current = this.config_map[e.env || "*"][e.domain || "*"];
      e.key_segments.forEach(seg => {
        current = current[seg];
      });

      expect(current).to.not.be.undefined;
    });
  });

  it("has the same number of entries as the object source", function() {
    expect(this.source.entries).to.have.lengthOf(countLeafs(this.config_map));
  });

  it("has entries with unique key string", function() {
    const key_strings = this.source.entries.map(e => e.key_string);
    expect((new Set(key_strings)).size).to.eq(this.source.entries.length);
  });

  it("has entries with the right values", function() {
    const entries = this.source.entries;

    entries.forEach(e => {
      let current = this.config_map[e.env || "*"][e.domain || "*"];
      e.key_segments.forEach(seg => {
        current = current[seg];
      });

      expect(e.value).to.eq(current);
    });
  });
}

//
// Helper Methods
//

export function compressRandomNodes(root) {
  const pendings = traverseAndCompress(root);
  return pendings[0].target;
}

export function buildConfigObject(env_count, domain_count, lvl_node_counts) {
  const envs = randomSegmentList(env_count);
  return envs.reduce((env_lvl, e) => {
    const domains = randomSegmentList(domain_count);
    env_lvl[e] = domains.reduce((domain_lvl, d) => {
      domain_lvl[d] = createConfigTree(lvl_node_counts);
      return domain_lvl;
    }, {});

    return env_lvl;
  }, {});
}

//
// Private Helper Methods
//

function createConfigTree(lvl_node_counts) {
  const map = {};

  let nodes = [{ parent: null, children: [], tree_node: map }];
  let parent_lvl = nodes;

  // first create a list of nodes
  lvl_node_counts.forEach(node_count => {
    const current_lvl = [];

    for (let i = 0; i < node_count; i++) {
      // select a parent
      let parent = chance.pickone(parent_lvl);
      // create a node under the parent
      let node = { parent: parent, children: [] };
      parent.children.push(node);
      // add this newly created node to the total list and current level list
      nodes.push(node);
      current_lvl.push(node);
    }

    parent_lvl = current_lvl;
  });

  // convert the list of node into a tree
  nodes.forEach(n => {
    if (n.parent) {
      let this_value;
      if (n.children.length > 0) {
        // if this node has children
        this_value = {};
        n.tree_node = this_value;
      } else {
        // if this node has no child
        this_value = chance.sentence();
      }

      // add this value to the parent's tree node
      n.parent.tree_node[randomSegment()] = this_value;
    }
  });

  return map;
}

function traverseAndCompress(root, first_level) {
  if (isLeaf(root)) return [{ segments: [], target: root }];

  const pendings = [];
  const current_level = {};
  Object.keys(root).forEach(key => {
    const last_pendings = traverseAndCompress(root[key], false);
    last_pendings.forEach(last => {
      // randomly decide if this should merge up
      const merge_up = first_level === false ? chance.bool() : false;
      if (merge_up) {
        // pass the existing merge up to the parent
        last.merge = true;
        last.segments.unshift(key);
        pendings.push(last);
      } else {
        // conclude the merge at this level
        const merged_seg = [key].concat(last.segments).join(".");
        current_level[merged_seg] = last.target;
      }
    });
  });

  if (Object.keys(current_level).length > 0) {
    pendings.push({ segments: [], target: current_level });
  }

  return pendings;
}

function randomSegmentList(count) {
  let list = chance.pickset(["*", randomSegment()]);
  for (let i = 1; i < count; i++) {
    list.push(randomSegment());
  }
  return list;
}

function countLeafs(node) {
  let count = 0;
  if (isLeaf(node)) count = 1;
  else {
    Object.keys(node).forEach(key => {
      count += countLeafs(node[key]);
    });
  }
  return count;
}

function isLeaf(node) {
  const type = Object.prototype.toString.call(node);
  const isArray = Array.isArray(node);
  const isObject = type === "[object Object]" || type === "[object Array]";

  return isArray || !isObject;
}