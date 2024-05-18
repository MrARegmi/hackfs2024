const fs = require("fs").promises;

exports.saveLogFile = async (file, filePath) => {
  await fs.writeFile(filePath, file);
};
