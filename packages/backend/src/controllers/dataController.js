const fs = require("fs");
const path = require("path");
const encryptionService = require("../services/encryptionService");
const metadataService = require("../services/metadataService");
const logger = require("../utils/logger");

exports.uploadData = async (req, res) => {
  try {
    const { jsonData, hash } = req.body;
    const logFile = req.files.logFile;

    if (!jsonData || !hash || !logFile) {
      return res.status(400).send({
        error: "JSON data, hash, and log file are required",
      });
    }

    // Save the uploaded log file
    const logFilePath = path.join(__dirname, "../../logs", logFile.name);
    await logFile.mv(logFilePath);

    // Calculate hash of the JSON data
    const calculatedHash = encryptionService.calculateHash(jsonData);
    logger.log(`Calculated Hash: ${calculatedHash}`);

    // Compare Hashes
    if (calculatedHash !== hash) {
      return res.status(400).send({
        error: "Data integrity check failed. Hash doesn't match",
      });
    }

    // Encrypt the JSON data
    const { encryptedData, encryptionKey, iv } =
      encryptionService.encryptedData(JSON.stringify(jsonData));
    logger.log("Data encrypted successfully.");

    // Extract metadata
    const metadata = metadataService.extractMetadata(jsonData);
    logger.log(`Extracted Metadata: ${JSON.stringify(metadata)}`);

    // Respond with metadata
    res.status(200).send({
      message:
        "Data received, hash verified, data encrypted, and metadata extracted successfully.",
      metadata,
      encryptionKey: encryptionKey.toString("base64"),
      iv: iv.toStirng("base64"),
    });
  } catch (error) {
    logger.error(error);
    res.status(500).send({
      error: "An error occurred while processing the data",
    });
  }
};
