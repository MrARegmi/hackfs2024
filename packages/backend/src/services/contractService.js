const lighthouse = require('@lighthouse-web3/sdk');
const dotenv = require('dotenv');

const privateKey = process.env.LIGHT_HOUSE;

// const { Web3 } = require('web3');
// const dotenv = require('dotenv');

// // Load environment variables from .env file
// dotenv.config();

// // Define the URL of the Calibration testnet node
// const calibrationTestnetURL = 'https://api.calibration.node.glif.io/rpc/v1';
// const web3 = new Web3(new Web3.providers.HttpProvider(calibrationTestnetURL));

// // Define the ABI and contract address
// const contractABI = [
//   {
//     anonymous: false,
//     inputs: [
//       {
//         indexed: false,
//         internalType: 'string',
//         name: 'key',
//         type: 'string',
//       },
//       {
//         indexed: false,
//         internalType: 'string',
//         name: 'value',
//         type: 'string',
//       },
//     ],
//     name: 'ValueSet',
//     type: 'event',
//   },
//   {
//     inputs: [
//       {
//         internalType: 'string',
//         name: 'key',
//         type: 'string',
//       },
//       {
//         internalType: 'string',
//         name: 'value',
//         type: 'string',
//       },
//     ],
//     name: 'setValue',
//     outputs: [],
//     stateMutability: 'nonpayable',
//     type: 'function',
//   },
//   {
//     inputs: [
//       {
//         internalType: 'string',
//         name: 'key',
//         type: 'string',
//       },
//     ],
//     name: 'getValue',
//     outputs: [
//       {
//         internalType: 'string',
//         name: '',
//         type: 'string',
//       },
//     ],
//     stateMutability: 'view',
//     type: 'function',
//   },
// ];

// const contractAddress = '0x887aF6019615BaFaaEaBbc93F19cE8dCb586bccf';
// const contract = new web3.eth.Contract(contractABI, contractAddress);

// const fromAddress = '0xe208e8A1021F7A8e260246fab5e7BDc2e49EdB42';
// const privateKey = process.env.PRIVATE_KEY;

// if (!privateKey) {
//   console.error('Missing PRIVATE_KEY in .env file');
//   process.exit(1);
// }

// // Function to call a read-only function from the smart contract
// async function getValueFromContract(key) {
//   try {
//     const result = await contract.methods.getValue(key).call();
//     console.log(`Value for key ${key}: ${result}`);
//     return result;
//   } catch (error) {
//     console.error('Error calling get function:', error);
//     throw error;
//   }
// }

// // Function to send a transaction to set a value in the smart contract
// // ... (previous code remains the same)

// // Function to send a transaction to set a value in the smart contract
// async function setValueInContract(key, value) {
//   try {
//     const nonce = await web3.eth.getTransactionCount(fromAddress);
//     console.log(`Nonce for address ${fromAddress}: ${nonce}`);

//     const gasPrice = BigInt(await web3.eth.getGasPrice());
//     console.log(`Current gas price: ${gasPrice}`);

//     const txData = contract.methods.setValue(key, value).encodeABI();

//     const gasLimit = 100000; // Adjust the gas limit based on the actual gas consumption

//     const maxPriorityFeePerGas = BigInt(web3.utils.toWei('1', 'gwei')); // Adjust the max priority fee per gas
//     const maxFeePerGas = maxPriorityFeePerGas + gasPrice;

//     const tx = {
//       from: fromAddress,
//       to: contractAddress,
//       data: txData,
//       maxFeePerGas: maxFeePerGas.toString(),
//       maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
//       gas: gasLimit,
//       nonce: nonce,
//       type: 2,
//     };

//     console.log('Transaction object:', tx);

//     const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
//     console.log(`Signed transaction: ${signedTx.rawTransaction}`);

//     const transactionHash = await web3.eth.sendSignedTransaction(
//       signedTx.rawTransaction
//     );
//     console.log('Transaction hash:', transactionHash);

//     // Wait for the transaction receipt
//     const receipt = await web3.eth.getTransactionReceipt(transactionHash);
//     console.log('Transaction receipt:', receipt);

//     // Check the transaction status
//     if (receipt.status) {
//       console.log('Transaction successful');
//     } else {
//       console.error('Transaction failed');
//       throw new Error('Transaction failed');
//     }

//     // Listen for the ValueSet event
//     contract.events.ValueSet(
//       {
//         filter: { key: key },
//       },
//       (error, event) => {
//         if (error) {
//           console.error('Error listening for ValueSet event:', error);
//         } else {
//           console.log('ValueSet event:', event);
//         }
//       }
//     );

//     return receipt;
//   } catch (error) {
//     console.error('Error sending set transaction:', error.message);
//     console.error('Stack trace:', error.stack);
//     throw error;
//   }
// }

// // ... (remaining code remains the same)

// // Example usage
// async function main() {
//   try {
//     const key = 'exampleKey';
//     const value = 'exampleValue';
//     await setValueInContract(key, value);
//     await getValueFromContract(key);
//   } catch (error) {
//     console.error('Error in main function:', error);
//   }
// }

// main();

// // module.exports = {
// //   getValueFromContract,
// //   setValueInContract,
// // };
