const { buildPoseidon } = require('circomlibjs');
const MAX_POSEIDON_INPUT_SIZE = 16;

// Function to convert logs to expected format (BigInt array)
const convertToExpectedFormat = (logs) => {
  let parsedLogs;
  try {
    parsedLogs = JSON.parse(logs);
  } catch (error) {
    throw new Error('Failed to parse logs JSON');
  }

  return parsedLogs.map((log) => {
    if (typeof log === 'string') {
      // If the log is a string, assume it's a comma-separated list of hex values
      const hexValues = log.split(',').map((hexValue) => {
        const trimmedValue = hexValue.trim();
        if (trimmedValue.startsWith('0x')) {
          return BigInt(trimmedValue);
        } else {
          return BigInt(`0x${trimmedValue}`);
        }
      });
      return hexValues;
    } else if (typeof log === 'object' && 'transaction_id' in log) {
      // If the log is an object with a 'transaction_id' property, use that value
      return BigInt(log.transaction_id);
    } else {
      // Otherwise, convert the log object to a JSON string and then to a BigInt
      const logString = JSON.stringify(log);
      const logBuffer = Buffer.from(logString, 'utf-8');
      const logHex = logBuffer.toString('hex');
      return BigInt(`0x${logHex}`);
    }
  }).flat(Infinity);
};

// Function to process large input by splitting and rehashing
const processLargeInput = async (input) => {
  const poseidon = await buildPoseidon();

  // Split input into chunks of MAX_POSEIDON_INPUT_SIZE
  const chunks = [];
  for (let i = 0; i < input.length; i += MAX_POSEIDON_INPUT_SIZE) {
    chunks.push(input.slice(i, i + MAX_POSEIDON_INPUT_SIZE));
  }

  // Hash each chunk
  const intermediateHashes = await Promise.all(
    chunks.map((chunk) => poseidon(chunk))
  );

  // If intermediate hashes are still too large, recursively process
  if (intermediateHashes.length > MAX_POSEIDON_INPUT_SIZE) {
    return processLargeInput(intermediateHashes);
  }

  // Final hash with Poseidon
  return poseidon(intermediateHashes);
};

const calculatePoseidonHash = async (logs) => {
  const input = convertToExpectedFormat(logs);

  let finalHash;
  if (input.length > MAX_POSEIDON_INPUT_SIZE) {
    finalHash = await processLargeInput(input);
  } else {
    const poseidon = await buildPoseidon();
    finalHash = await poseidon(input);
  }

  // Convert finalHash to hex string
  return Buffer.from(finalHash).toString('hex');
};

const calculateMerkleHash = async (leftHash, rightHash) => {
  const poseidon = await buildPoseidon();
  const leftBigInt = BigInt(`0x${leftHash}`);
  const rightBigInt = BigInt(`0x${rightHash}`);
  const result = await poseidon([leftBigInt, rightBigInt]);

  // Convert result to hex string
  return Buffer.from(result).toString('hex');
};

module.exports = {
  calculatePoseidonHash,
  calculateMerkleHash,
};
