const axios = require('axios');
const hashingService = require('../services/hashingService');
const databaseService = require('../services/databaseService');
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

    const calculatedPoseidonHash = await hashingService.calculatePoseidonHash(
      logs
    );

    const hashExists = await databaseService.hashExists(calculatedPoseidonHash);
    if (hashExists) {
      return res.status(200).send({
        success: true,
        message: 'Hash already exists in Merkle Tree',
      });
    }

    await databaseService.insertLeafHash(calculatedPoseidonHash);
    await buildMerkleTree();
    const rootHash = await getMerkleRoot();
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
    // console.log(encryptedDataString);
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

    const response = await axios.post('http://localhost:8080/received_logs', {
      root_hash: rootHash,
      leaf: calculatedPoseidonHash,
      siblings: merkleProof.siblings,
      path_bits: merkleProof.path_bits,
    });

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

// const axios = require('axios');
// const hashingService = require('../services/hashingService');
// const databaseService = require('../services/databaseService');
// const logger = require('../utils/logger');
// const {
//   buildMerkleTree,
//   getMerkleRoot,
//   generateMerkleProof,
// } = require('../services/merkleTreeService');
// const sshService = require('../services/sshService');
// const { Web3 } = require('web3');
// const dotenv = require('dotenv');

// // Load environment variables from .env file
// dotenv.config();

// exports.uploadData = async (req, res) => {
//   try {
//     const { logs } = req.body;

//     const calculatedPoseidonHash = await hashingService.calculatePoseidonHash(
//       logs
//     );

//     const hashExists = await databaseService.hashExists(calculatedPoseidonHash);
//     if (hashExists) {
//       return res.status(200).send({
//         success: true,
//         message: 'Hash already exists in Merkle Tree',
//       });
//     } else {
//       await databaseService.insertLeafHash(calculatedPoseidonHash);
//       await buildMerkleTree();
//       const rootHash = await getMerkleRoot();
//       const merkleProof = await generateMerkleProof(calculatedPoseidonHash);

//       try {
//         // Execute the remote command via SSH
//         const encryptionResult = await sshService.executeRemoteCommand(
//           calculatedPoseidonHash
//         );

//         const encryptHash = encryptionResult.trim().split('\n');
//         const secretKeyLine = encryptHash.find((line) =>
//           line.startsWith('Secret Key:')
//         );
//         const encryptedDataLine = encryptHash.find((line) =>
//           line.startsWith('Encrypted Data:')
//         );

//         const secretKey = secretKeyLine.split('Secret Key: ')[1];
//         const encryptedDataString =
//           encryptedDataLine.split('Encrypted Data: ')[1];

//         console.log('Encrypted Data:', typeof encryptedDataString);
//         console.log('Secret Key:', typeof secretKey);

//         // --------------------------start to push in filecoin------------------------------------

//         // Define the URL of the Calibration testnet node. You can use an endpoint from a provider like Infura, Alchemy, or a local node
//         const calibrationTestnetURL = 'https://rpc.ankr.com/filecoin_testnet';

//         // Create a Web3 instance and set the provider to the Calibration testnet node
//         const web3 = new Web3(
//           new Web3.providers.HttpProvider(calibrationTestnetURL)
//         );

//         // Define the ABI of the smart contract
//         const contractABI = [
//           {
//             inputs: [
//               {
//                 internalType: 'string',
//                 name: 'key',
//                 type: 'string',
//               },
//               {
//                 internalType: 'string',
//                 name: 'value',
//                 type: 'string',
//               },
//             ],
//             name: 'setValue',
//             outputs: [],
//             stateMutability: 'nonpayable',
//             type: 'function',
//           },
//           {
//             inputs: [
//               {
//                 internalType: 'string',
//                 name: 'key',
//                 type: 'string',
//               },
//             ],
//             name: 'getValue',
//             outputs: [
//               {
//                 internalType: 'string',
//                 name: '',
//                 type: 'string',
//               },
//             ],
//             stateMutability: 'view',
//             type: 'function',
//           },
//         ];

//         // Define the address of the deployed smart contract
//         const contractAddress = '0x29767939AB863600d78168505C5AF51936773775'; // Replace with your contract's address

//         // Create a contract instance
//         const contract = new web3.eth.Contract(contractABI, contractAddress);

//         // Function to call a read-only function from the smart contract
//         async function getValueFromContract(key) {
//           try {
//             const result = await contract.methods.getValue(key).call();
//             console.log('Value for key', key, ':', result);
//           } catch (error) {
//             console.error('Error calling getValue function:', error);
//           }
//         }

//         // Function to send a transaction to set a value in the smart contract
//         async function setValueInContract(fromAddress, privateKey, key, value) {
//           try {
//             const data = contract.methods.setValue(key, value).encodeABI();

//             const tx = {
//               from: fromAddress,
//               to: contractAddress,
//               data: data,
//               gas: 2000000, // Adjust the gas limit as needed
//             };

//             const signedTx = await web3.eth.accounts.signTransaction(
//               tx,
//               privateKey
//             );
//             const receipt = await web3.eth.sendSignedTransaction(
//               signedTx.rawTransaction
//             );
//             console.log('Transaction receipt:', receipt);
//           } catch (error) {
//             console.error('Error sending setValue transaction:', error);
//           }
//         }

//         // Example usage
//         const fromAddress = '0xAc98786f7b6baAf0969854e6948b11EFe965b849'; // Replace with your Ethereum address
//         const privateKey = process.env.PRIVATE_KEY;

//         // Set a value in the contract
//         await setValueInContract(
//           fromAddress,
//           privateKey,
//           secretKey,
//           encryptedDataString
//         );

//         // Get a value from the contract
//         await getValueFromContract(secretKey);

//         // --------------------------end code to push in filecoin--------------------------------------

//         const response = await axios.post(
//           'http://localhost:8080/received_logs',
//           {
//             root_hash: rootHash,
//             leaf: calculatedPoseidonHash,
//             siblings: merkleProof.siblings,
//             path_bits: merkleProof.path_bits,
//           }
//         );

//         return res.status(201).send({
//           success: true,
//           message: 'Data received and hash inserted into Merkle Tree.',
//         });
//       } catch (sendError) {
//         logger.error(
//           `Error sending logs to /received_logs: ${sendError.message}`
//         );
//         return res.status(500).send({
//           success: false,
//           error: 'Failed to send logs to `/received_logs`',
//         });
//       }
//     }
//   } catch (error) {
//     logger.error(`Error processing uploadData: ${error.message}`);
//     return res.status(500).send({
//       success: false,
//       error: 'An error occurred while processing the data',
//     });
//   }
// };
