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
      // If hash exists, send parsedLogs to  `/received_logs`
      await axios.post("http://localhost:3000/received_logs", {
        logs: parsedLogs,
        hash: hash,
        calculatedHash: calculatedHash,
      });
      return res.status(200).send({
        message: "Hash esists in database. Logs sent to `/received_logs`",
      });
    } else {
      // Hash doesn't exist, insert into database
      await databaseService.insertHash(calculatedHash);
      return res.status(200).send({
        message:
          "Data received and hash verified successfully. Hash inserted into database.",
      });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).send({
      error: "An error occurred while processing the data",
    });
  }
};
