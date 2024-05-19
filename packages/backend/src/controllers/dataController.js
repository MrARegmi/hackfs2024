const fs = require("fs");
const path = require("path");
const encryptionService = require("../services/encryptionService");
const metadataService = require("../services/metadataService");
const logger = require("../utils/logger");
const { json } = require("body-parser");

exports.uploadData = async (req, res) => {
  try {
    const { hash, logs } = req.body;

    // Parse logs if it is a JSON string
    const parsedLogs = JSON.parse(logs);

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

    // Respond with success message
    res.status(200).send({
      message: "Data received and hash verified successfully.",
    });
  } catch (error) {
    logger.error(error);
    res.status(500).send({
      error: "An error occurred while processing the data",
    });
  }
};
