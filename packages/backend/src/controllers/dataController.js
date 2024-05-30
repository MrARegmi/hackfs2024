const axios = require('axios');
const hashingService = require('../services/hashingService');
const databaseService = require('../services/databaseService');
const logger = require('../utils/logger');
const {
  buildMerkleTree,
  getMerkleRoot,
  generateMerkleProof,
} = require('../services/merkleTreeService');

exports.uploadData = async (req, res) => {
  try {
    const { hash: hashByteArray, logs } = req.body;

    // const backendByteArray = hashingService.calculateByteArray(logs);
    const calculatedPoseidonHash = await hashingService.calculatePoseidonHash(
      logs
    );

    // const areByteArrayEqual = Buffer.from(hashByteArray).equals(
    //   Buffer.from(backendByteArray)
    // );
    // if (!areByteArrayEqual) {
    //   return res.status(400).send({
    //     success: false,
    //     error: 'Byte array mismatch',
    //   });
    // }

    const hashExists = await databaseService.hashExists(calculatedPoseidonHash);
    if (hashExists) {
      return res.status(200).send({
        success: true,
        message: 'Hash already exists in Merkle Tree',
      });
    } else {
      await databaseService.insertLeafHash(calculatedPoseidonHash);
      await buildMerkleTree();
      const rootHash = await getMerkleRoot();
      const merkleProof = await generateMerkleProof(calculatedPoseidonHash);

      try {
        const response = await axios.post(
          'http://localhost:8080/received_logs',
          {
            success: true,
            message: 'Data committed successfully.',
            dataHash: calculatedPoseidonHash,
            rootHash: rootHash,
            path: merkleProof.path.join('.'),
            merkleProof: {
              siblings: merkleProof.siblings,
              parentHashes: merkleProof.parentHashes,
            },
          }
        );

        return res.status(201).send({
          success: true,
          message: 'Data received and hash inserted into Merkle Tree.',
        });
      } catch (sendError) {
        logger.error(
          `Error sending logs to /received_logs: ${sendError.message}`
        );
        return res.status(500).send({
          success: false,
          error: 'Failed to send logs to `/received_logs`',
        });
      }
    }
  } catch (error) {
    logger.error(`Error processing uploadData: ${error.message}`);
    return res.status(500).send({
      success: false,
      error: 'An error occurred while processing the data',
    });
  }
};
