const crypto = require("crypto");

exports.calculateHash = (data) => {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
};

exports.encryptData = (data) => {
  const encryptionKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-128-ccm", encryptionKey, iv);
  let encryptedData = cipher.update(data, "utf-8", "hex");
  encryptedData += cipher.final("hex");

  return { encryptedData, encryptionKey, iv };
};
