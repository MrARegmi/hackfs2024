const databaseService = require('./databaseService');
const hashingService = require('./hashingService');
const logger = require('../utils/logger');

exports.buildMerkleTree = async () => {
  let level = 0;
  logger.info(`Building Merkle tree from level: ${level}`);

  let nodes = await databaseService.getNodesAtLevel(level);
  logger.info(`Initial nodes: ${JSON.stringify(nodes)}`);

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
        left.node_hash.toString('hex'),
        right.node_hash.toString('hex')
      );
      logger.info(`Calculated parent hash: ${parentHash}`);

      const parentId = await databaseService.insertNode(
        parentHash,
        left.id,
        right.id,
        level
      );
      logger.info(`Inserted parent node: ${JSON.stringify({ parentId, parentHash })}`);

      // Update child nodes with parent_id, position, and correct level
      await databaseService.updateNodeParent(left.id, parentId, 'L', level - 1);
      await databaseService.updateNodeParent(right.id, parentId, 'R', level - 1);

      newLevelNodes.push({ id: parentId, node_hash: Buffer.from(parentHash, 'hex') });
    }
    nodes = newLevelNodes;
    logger.info(`Nodes at new level ${level}: ${JSON.stringify(nodes)}`);
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

  logger.info(`Merkle root node: ${JSON.stringify(nodes[0])}`);
  const rootHash = nodes[0].node_hash.toString('hex');
  logger.info(`Merkle Root Hash: ${rootHash}`);
  return rootHash;
};

exports.generateMerkleProof = async (hash) => {
  const proof = {
    siblings: [],
    path_bits: [],
  };
  let currentHash = Buffer.from(hash, 'hex'); // Convert hash to Buffer
  let currentLevel = 0;

  while (true) {
    const nodes = await databaseService.getNodesAtLevel(currentLevel);
    logger.info(`Nodes at level ${currentLevel}: ${JSON.stringify(nodes)}`);

    const nodeIndex = nodes.findIndex((node) => Buffer.compare(node.node_hash, currentHash) === 0);
    logger.info(`Current node index at level ${currentLevel}: ${nodeIndex}`);

    if (nodeIndex === -1) break;

    proof.path_bits.push(nodeIndex % 2 === 0 ? 0 : 1);

    if (nodeIndex % 2 === 0 && nodeIndex + 1 < nodes.length) {
      proof.siblings.push(nodes[nodeIndex + 1].node_hash.toString('hex'));
    } else if (nodeIndex % 2 === 1) {
      proof.siblings.push(nodes[nodeIndex - 1].node_hash.toString('hex'));
    }
    logger.info(`Added sibling hash to proof: ${proof.siblings[proof.siblings.length - 1]}`);

    const parentNode = await databaseService.getNodeParent(nodes[nodeIndex].id);
    logger.info(`Node parent for ${nodes[nodeIndex].id}: ${JSON.stringify(parentNode)}`);

    if (!parentNode) break;

    currentHash = parentNode.node_hash;
    currentLevel++;
  }

  proof.path_bits.reverse();
  logger.info(`Generated Merkle proof: ${JSON.stringify(proof)}`);

  return proof;
};
