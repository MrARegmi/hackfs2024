const axios = require('axios');
const databaseService = require('../services/databaseService');
const hashingService = require('../services/hashingService');
const logger = require('../utils/logger');
const {
  buildMerkleTree,
  getMerkleRoot,
  generateMerkleProof,
} = require('../services/merkleTreeService');
const sshService = require('../services/sshService');
const testService = require('../services/testService');
// const {
//   setValueInContract,
//   getValueFromContract,
// } = require('../services/contractService');
const lighthouse = require('@lighthouse-web3/sdk');
const dotenv = require('dotenv');

dotenv.config();
const privateKey = process.env.LIGHT_HOUSE;

exports.uploadData = async (req, res) => {
  try {
    const { logs } = req.body;
    logger.info('Received logs:', logs);

    // Calculate Poseidon hash
    const calculatedPoseidonHash = await hashingService.calculatePoseidonHash(
      logs
    );
    logger.info('Calculated Poseidon Hash:', calculatedPoseidonHash);

    // Check if hash already exists in the database
    const hashExists = await databaseService.hashExists(calculatedPoseidonHash);
    if (hashExists) {
      logger.info('Hash already exists in Merkle Tree');
      return res.status(200).send({
        success: true,
        message: 'Hash already exists in Merkle Tree',
      });
    }

    // Insert leaf hash into the database
    const leafId = await databaseService.insertLeafHash(
      calculatedPoseidonHash,
      logs
    );
    logger.info('Inserted leaf hash with ID:', leafId);

    // Build Merkle tree and get the root hash
    await buildMerkleTree();
    const rootHash = await getMerkleRoot();
    logger.info('Merkle Root Hash:', rootHash);

    // Generate Merkle proof for the new leaf
    const merkleProof = await generateMerkleProof(calculatedPoseidonHash);
    console.log(calculatedPoseidonHash);

    const encryptionResult = await sshService.executeRemoteCommand(
      calculatedPoseidonHash
    );

    const encryptHash = encryptionResult.trim().split('\n');
    const secretKeyLine = encryptHash.find((line) =>
      line.startsWith('Secret Key:')
    );
    const encryptedDataLine = encryptHash.find((line) =>
      line.startsWith('Encrypted Data:')
    );

    const secretKey = secretKeyLine.split('Secret Key: ')[1];
    const encryptedDataString = encryptedDataLine.split('Encrypted Data: ')[1];

    console.log('-------------------------------------');
    console.log(encryptedDataString);
    console.log(secretKey);

    // // testing in fhe
    // const fheTest = await executeTestCommand(secretKey, encryptedDataString);
    // console.log('-------------------------------------');
    // console.log(fheTest);
    console.log('******************************************');

    // await setValueInContract(secretKey, encryptedDataString);
    // const retrievedValue = await getValueFromContract(secretKey);
    // console.log('Retrieved Value from Contract:', retrievedValue);

    // Upload data to the FileCoin
    const filecoinResponse = await lighthouse.uploadText(
      encryptedDataString,
      privateKey
    );

    // console.log('--------------------------------------');
    // console.log(filecoinResponse);
    // console.log('--------------------------------------');

    logger.info('Generated Merkle Proof:', merkleProof);

    // Send data to another server (if needed)
    const response = await axios.post('http://localhost:8080/received_logs', {
      root_hash: rootHash,
      leaf: calculatedPoseidonHash,
      siblings: merkleProof.siblings,
      path_bits: merkleProof.path_bits,
    });
    logger.info('Data sent to another server, response:', response.data);

    return res.status(201).send({
      success: true,
      message: 'Data received and hash inserted into Merkle Tree.',
    });
  } catch (error) {
    logger.error(`Error processing uploadData: ${error.message}`);
    return res.status(500).send({
      success: false,
      error: 'An error occurred while processing the data',
    });
  }
};
