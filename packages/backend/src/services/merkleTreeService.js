const databaseService = require("./databaseService");
const hashingService = require("./hashingService");
const logger = require("../utils/logger");

exports.buildMerkleTree = async () => {
  let level = 0;
  let nodes = await databaseService.getNodesAtLevel(level);

  while (nodes.length > 1) {
    level++;
    let newLevelNodes = [];

    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      let right = null;
      if (i + 1 < nodes.length) {
        right = nodes[i + 1];
      } else {
        // Handle the case where the number of nodes is odd
        right = left;
      }

      const parentHash = hashingService.calculateMerkleHash(
        left.node_hash,
        right.node_hash
      );

      const parentId = await databaseService.insertNode(
        parentHash,
        left.id,
        right.id,
        level
      );

      // Update child nodes with parent_id
      await databaseService.updateNodeParent(left.id, parentId);
      await databaseService.updateNodeParent(right.id, parentId);

      newLevelNodes.push({ id: parentId, node_hash: parentHash });
    }
    nodes = newLevelNodes;
  }

  logger.log("Merkle tree built successfully");
};

exports.getMerkleRoot = async () => {
  // First, check if there are any nodes at level 1
  let nodes = await databaseService.getNodesAtLevel(1);

  // If no nodes at level 1, check level 0 (it means we only have leaf nodes)
  if (nodes.length === 0) {
    nodes = await databaseService.getNodesAtLevel(0);
    if (nodes.length === 0) {
      throw new Error("No nodes found at level 0");
    }
  }

  return nodes[0].node_hash;
};

exports.generateMerkleProof = async (hash) => {
  const proof = [];
  let currentHash = hash;
  let currentLevel = 0;

  while (true) {
    const nodes = await databaseService.getNodesAtLevel(currentLevel);
    const nodeIndex = nodes.findIndex((node) => node.node_hash === currentHash);

    if (nodeIndex === -1) break;

    if (nodeIndex % 2 === 0 && nodeIndex + 1 < nodes.length) {
      proof.push(nodes[nodeIndex + 1].node_hash);
    } else if (nodeIndex % 2 === 1) {
      proof.push(nodes[nodeIndex - 1].node_hash);
    }

    const parentNode = await databaseService.getNodeParent(nodes[nodeIndex].id);
    if (!parentNode) break;

    currentHash = parentNode.node_hash;
    currentLevel++;
  }

  return proof;
};
