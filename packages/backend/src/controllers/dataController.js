const axios = require('axios');
const databaseService = require('../services/databaseService');
const hashingService = require('../services/hashingService');
const logger = require('../utils/logger');
const {
  buildMerkleTree,
  getMerkleRoot,
  generateMerkleProof,
} = require('../services/merkleTreeService');

exports.uploadData = async (req, res) => {
  try {
    const { logs } = req.body;
    logger.info('Received logs:', logs);

    // Calculate Poseidon hash
    const calculatedPoseidonHash = await hashingService.calculatePoseidonHash(logs);
    logger.info('Calculated Poseidon Hash:', calculatedPoseidonHash);

    // Check if hash already exists in the database
    const hashExists = await databaseService.hashExists(calculatedPoseidonHash);
    if (hashExists) {
      logger.info('Hash already exists in Merkle Tree');
      return res.status(200).send({
        success: true,
        message: 'Hash already exists in Merkle Tree',
      });
    }

    // Insert leaf hash into the database
    const leafId = await databaseService.insertLeafHash(calculatedPoseidonHash, logs);
    logger.info('Inserted leaf hash with ID:', leafId);

    // Build Merkle tree and get the root hash
    await buildMerkleTree();
    const rootHash = await getMerkleRoot();
    logger.info('Merkle Root Hash:', rootHash);

    // Generate Merkle proof for the new leaf
    const merkleProof = await generateMerkleProof(calculatedPoseidonHash);
    logger.info('Generated Merkle Proof:', merkleProof);

    // Send data to another server (if needed)
    const response = await axios.post('http://localhost:8080/received_logs', {
      root_hash: rootHash,
      leaf: calculatedPoseidonHash,
      siblings: merkleProof.siblings,
      path_bits: merkleProof.path_bits,
    });
    logger.info('Data sent to another server, response:', response.data);

    return res.status(201).send({
      success: true,
      message: 'Data received and hash inserted into Merkle Tree.',
    });
  } catch (error) {
    logger.error(`Error processing uploadData: ${error.message}`);
    return res.status(500).send({
      success: false,
      error: 'An error occurred while processing the data',
    });
  }
};
