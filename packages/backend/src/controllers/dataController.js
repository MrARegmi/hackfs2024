const axios = require("axios");
const encryptionService = require("../services/encryptionService");
const databaseService = require("../services/databaseService");
const logger = require("../utils/logger");

exports.uploadData = async (req, res) => {
  try {
    const { hash, logs } = req.body;

    // Parse logs if it is a JSON string
    const parsedLogs = typeof logs === "string" ? JSON.parse(logs) : logs;

    if (!parsedLogs || !hash) {
      return res.status(400).send({
        error: "Error in parsed logs or hash",
      });
    }

    // Calculate hash of the JSON data
    const calculatedHash = encryptionService.calculateHash(parsedLogs);
    logger.log(`Calculated Hash: ${calculatedHash}`);

    // Compare Hashes
    if (calculatedHash !== hash) {
      return res.status(400).send({
        error: "Data integrity check failed. Hash doesn't match",
      });
    }

    // Check if hash exists in database
    const hashExists = await databaseService.hashExists(calculatedHash);

    if (hashExists) {
      logger.log(`Hash exists in database: ${calculatedHash}`);

      // Respond to frontend with hash match message
      res.status(200).send({
        message: "Hash exists in database. Logs sent to `/received_logs`",
      });

      // Send parsedLogs to `/received_logs`
      try {
        const response = await axios.post(
          "http://localhost:3000/received_logs",
          {
            logs: parsedLogs,
            hash: hash,
            calculatedHash: calculatedHash,
          }
        );
        logger.log(`Logs sent to /received_logs: ${response.status}`);
      } catch (sendError) {
        logger.error(
          `Error sending logs to /received_logs: ${sendError.message}`
        );
      }
    } else {
      logger.log(`Hash does not exist in database: ${calculatedHash}`);

      // Hash doesn't exist, insert into database
      await databaseService.insertHash(calculatedHash);

      return res.status(200).send({
        message:
          "Data received and hash verified successfully. Hash inserted into database.",
      });
    }
  } catch (error) {
    logger.error(`Error processing uploadData: ${error.message}`);
    return res.status(500).send({
      error: "An error occurred while processing the data",
    });
  }
};
