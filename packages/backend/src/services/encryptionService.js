const crypto = require("crypto");

exports.calculateHash = (data) => {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
};
