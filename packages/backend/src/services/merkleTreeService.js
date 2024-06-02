const databaseService = require('./databaseService');
const hashingService = require('./hashingService');
const logger = require('../utils/logger');

exports.buildMerkleTree = async () => {
  let level = 0;
  let nodes = await databaseService.getNodesAtLevel(level);

  if (nodes.length === 0) {
    throw new Error('No nodes found at level 0');
  }

  while (nodes.length > 1) {
    level++;
    let newLevelNodes = [];

    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = i + 1 < nodes.length ? nodes[i + 1] : left;

      const parentHash = await hashingService.calculateMerkleHash(
        left.node_hash,
        right.node_hash
      );

      const parentId = await databaseService.insertNode(
        parentHash,
        left.id,
        right.id,
        level
      );

      // Update child nodes with parent_id and position
      await databaseService.updateNodeParent(left.id, parentId, 'L');
      await databaseService.updateNodeParent(right.id, parentId, 'R');

      newLevelNodes.push({ id: parentId, node_hash: parentHash });
    }
    nodes = newLevelNodes;
  }

  logger.info('Merkle tree built successfully');
};

exports.getMerkleRoot = async () => {
  let nodes = await databaseService.getNodesAtLevel(1);

  if (nodes.length === 0) {
    nodes = await databaseService.getNodesAtLevel(0);
    if (nodes.length === 0) {
      throw new Error('No nodes found at level 0');
    }
  }

  return nodes[0].node_hash;
};

exports.generateMerkleProof = async (hash) => {
  const proof = {
    siblings: [],
    path_bits: [],
  };
  let currentHash = hash;
  let currentLevel = 0;

  while (true) {
    const nodes = await databaseService.getNodesAtLevel(currentLevel);
    const nodeIndex = nodes.findIndex((node) => node.node_hash === currentHash);

    if (nodeIndex === -1) break;

    proof.path_bits.push(nodeIndex % 2 === 0 ? 0 : 1);

    if (nodeIndex % 2 === 0 && nodeIndex + 1 < nodes.length) {
      proof.siblings.push(nodes[nodeIndex + 1].node_hash);
    } else if (nodeIndex % 2 === 1) {
      proof.siblings.push(nodes[nodeIndex - 1].node_hash);
    }

    const parentNode = await databaseService.getNodeParent(nodes[nodeIndex].id);
    if (!parentNode) break;

    currentHash = parentNode.node_hash;
    currentLevel++;
  }

  proof.path_bits.reverse();

  return proof;
};
