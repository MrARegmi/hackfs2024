const axios = require("axios");
const hashingService = require("../services/hashingService");
const databaseService = require("../services/databaseService");
const logger = require("../utils/logger");
const {
  buildMerkleTree,
  getMerkleRoot,
  generateMerkleProof,
} = require("../services/merkleTreeService");

exports.uploadData = async (req, res) => {
  try {
    console.log(req.body);
    const { hash, logs } = req.body;

    // Converting byte array from frontend into hash
    const calculatedHash = hashingService.calculateHash(hash);

    // Check if hash exists in database
    const hashExists = await databaseService.hashExists(calculatedHash);

    if (hashExists) {
      logger.log(`Hash exists in database: ${calculatedHash}`);

      // Respond to frontend with hash match message
      return res.status(200).send({
        message: "Hash exists in database. Logs sent to `/received_logs`",
      });
    } else {
      logger.log(`Hash does not exist in database: ${calculatedHash}`);

      // Hash doesn't exist, insert into database
      await databaseService.insertLeafHash(calculatedHash);

      // Build the Merkle tree
      await buildMerkleTree();

      // Get the root hash and proof
      const rootHash = await getMerkleRoot();
      const proof = await generateMerkleProof(calculatedHash);

      // Send the response to `/received_logs`
      try {
        const response = await axios.post(
          "http://localhost:3000/received_logs",
          {
            rootHash: rootHash,
            hash: calculatedHash,
            proof: proof,
          }
        );
        logger.log(`Logs sent to /received_logs: ${response.status}`);
      } catch (sendError) {
        logger.error(
          `Error sending logs to /received_logs: ${sendError.message}`
        );
      }

      return res.status(200).send({
        message: "Data received and hash inserted into Merkle Tree.",
      });
    }
  } catch (error) {
    logger.error(`Error processing uploadData: ${error.message}`);
    return res.status(500).send({
      error: "An error occurred while processing the data",
    });
  }
};
