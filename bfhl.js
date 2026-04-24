const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

function isValidEdge(edge) {
  if (!edge || typeof edge !== "string") return false;
  edge = edge.trim();
  return /^[A-Z]->[A-Z]$/.test(edge) && edge[0] !== edge[3];
}

app.post("/bfhl", (req, res) => {
  const data = req.body.data || [];

  let invalid_entries = [];
  let duplicate_edges = [];
  let seen = new Set();
  let validEdges = [];

  // Step 1: validation + duplicates
  data.forEach((edge) => {
    let trimmed = edge.trim();

    if (!isValidEdge(trimmed)) {
      invalid_entries.push(edge);
      return;
    }

    if (seen.has(trimmed)) {
      if (!duplicate_edges.includes(trimmed)) {
        duplicate_edges.push(trimmed);
      }
      return;
    }

    seen.add(trimmed);
    validEdges.push(trimmed);
  });

  // Step 2: build graph
  let adj = {};
  let childSet = new Set();

  validEdges.forEach((edge) => {
    let [p, c] = edge.split("->");

    if (!adj[p]) adj[p] = [];

    if (!childSet.has(c)) {
      adj[p].push(c);
      childSet.add(c);
    }
  });

  // Step 3: collect nodes
  let nodes = new Set();
  validEdges.forEach(e => {
    let [p, c] = e.split("->");
    nodes.add(p);
    nodes.add(c);
  });

  // Step 4: find roots
  let roots = [...nodes].filter(n => !childSet.has(n));

  if (roots.length === 0 && nodes.size > 0) {
    roots = [[...nodes].sort()[0]];
  }

  let hierarchies = [];
  let total_cycles = 0;
  let maxDepth = 0;
  let largestRoot = "";

  function buildTree(node, path) {
    if (path.has(node)) return "cycle";

    path.add(node);
    let children = adj[node] || [];

    let obj = {};
    let depth = 1;

    for (let child of children) {
      let result = buildTree(child, new Set(path));

      if (result === "cycle") return "cycle";

      obj[child] = result.tree;
      depth = Math.max(depth, 1 + result.depth);
    }

    return { tree: obj, depth };
  }

  roots.forEach(root => {
    let result = buildTree(root, new Set());

    if (result === "cycle") {
      total_cycles++;
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });
    } else {
      if (
        result.depth > maxDepth ||
        (result.depth === maxDepth && root < largestRoot)
      ) {
        maxDepth = result.depth;
        largestRoot = root;
      }

      hierarchies.push({
        root,
        tree: { [root]: result.tree },
        depth: result.depth
      });
    }
  });

  const total_trees = hierarchies.filter(h => !h.has_cycle).length;

  res.json({
    user_id: "ShakshiTiwary_18032005",   // CHANGE THIS
    email_id: "sakshitiwary2005@gmail.com",  // CHANGE THIS
    college_roll_number: "RA2311003012191",    // CHANGE THIS
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root: largestRoot
    }
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
