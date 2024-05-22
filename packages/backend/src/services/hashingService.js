const crypto = require("crypto");

exports.calculateByteArray = (logs) => {
  const hash = crypto.createHash("sha256");
  hash.update(logs);
  const backendByteArray = hash.digest();

  return Array.from(backendByteArray);
};

exports.calculateHash = (byteArray) => {
  const buffer = Buffer.from(byteArray);
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

exports.calculateMerkleHash = (leftHash, rightHash) => {
  return crypto
    .createHash("sha256")
    .update(leftHash + rightHash)
    .digest("hex");
};
