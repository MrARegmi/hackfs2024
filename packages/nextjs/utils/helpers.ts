import crypto from "crypto";

export const createHash = (data: string) => {
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
};
