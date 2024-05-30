const crypto = require('crypto');
const { buildPoseidon } = require('circomlibjs');

const MAX_POSEIDON_INPUT_SIZE = 16;

// Function to convert logs to expected format (BigInt array)
const convertToExpectedFormat = (logs) => {
  const parsedLogs = JSON.parse(logs);

  const input = parsedLogs.map((log) => {
    const logString = JSON.stringify(log);
    const logBuffer = Buffer.from(logString, 'utf-8');
    const logHash = crypto.createHash('sha256').update(logBuffer).digest('hex');
    const logBigInt = BigInt(`0x${logHash}`);
    return logBigInt;
  });

  return input;
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

const uint8ArrayToHex = (uint8Array) => {
  return (
    '0x' +
    Array.from(uint8Array)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  );
};

exports.calculatePoseidonHash = async (logs) => {
  const input = convertToExpectedFormat(logs);

  // If input length is greater than MAX_POSEIDON_INPUT_SIZE, process it
  let finalHash;
  if (input.length > MAX_POSEIDON_INPUT_SIZE) {
    finalHash = await processLargeInput(input);
  } else {
    const poseidon = await buildPoseidon();
    finalHash = await poseidon(input);
  }

  const poseidonHashHex = uint8ArrayToHex(finalHash);
  return poseidonHashHex;
};

exports.calculateByteArray = (logs) => {
  const hash = crypto.createHash('sha256');
  hash.update(logs);
  const backendByteArray = hash.digest();

  return Array.from(backendByteArray);
};

exports.calculateHash = (byteArray) => {
  const buffer = Buffer.from(byteArray);
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

exports.calculateMerkleHash = (leftHash, rightHash) => {
  return crypto
    .createHash('sha256')
    .update(leftHash + rightHash)
    .digest('hex');
};
