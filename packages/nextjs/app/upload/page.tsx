"use client";

import { useEffect, useState } from "react";
import init, { process_and_hash_csv } from "../../../../rust-modules/wasm-lib/pkg";
import Dropzone from "./components/Dropzone";
import lighthouse from "@lighthouse-web3/sdk";
import { ethers } from "ethers";
import { Contract } from "ethers";
import type { NextPage } from "next";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useUploadFile } from "~~/hooks/upload/useUploadFile";
import ContractABI from "~~/mock/ContractABI.json";

interface ProgressData {
  total: number;
  uploaded: number;
}

const Upload: NextPage = () => {
  const [fileList, setFileList] = useState<FileList | null>(null);
  const { register, handleSubmit } = useForm<{ file: File }>();
  const lightHouseApiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [proofCount, setProofCount] = useState<number>(0);
  const [userProofs, setUserProofs] = useState<string[]>([]);
  const [newProofDescription, setNewProofDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { uploadFile, isLoading, isPending } = useUploadFile();

  // useEffect(() => {
  //   // Initialize MetaMask provider
  //   const initializeProvider = async () => {
  //     if (window.ethereum) {
  //       const provider = new ethers.BrowserProvider(window.ethereum);
  //       setProvider(provider);
  //     }
  //   };
  //   initializeProvider();
  // }, []);

  // useEffect(() => {
  //   // Load contract
  //   const loadContract = async () => {
  //     if (provider) {
  //       const signer = await provider.getSigner();
  //       const network = await provider.getNetwork();
  //       const contractAddress = "0x3607fd869C5f2bfeA6Ad179DBe9d106d9BAe09e7"; // Replace with your contract address
  //       const contractWithSigner = new ethers.Contract(contractAddress, ContractABI, signer);
  //       const contractWithProvider = new ethers.Contract(contractAddress, ContractABI, provider);
  //       const adData = await contractWithProvider.getCurrentAd();

  //       const accounts = await provider.send("eth_requestAccounts", []);
  //       console.log(accounts);
  //       // const proofs = await contractWithProvider.getUserProofs(accounts[0]);
  //       // console.log(proofs);
  //       setContract(contractWithSigner);
  //     }
  //   };
  //   loadContract();
  // }, [provider]);

  // const requestAccount = async () => {
  //   await window.ethereum.request({ method: "eth_requestAccounts" });
  // };

  // const getUserProofs = async () => {
  //   if (contract) {
  //     try {
  //       const proofs = await contract.getUserProofs();
  //       setUserProofs(proofs);
  //     } catch (error) {
  //       console.error("Error fetching user proofs:", error);
  //     }
  //   }
  // };

  // const addProof = async () => {
  //   if (!newProofDescription) return;
  //   setLoading(true);
  //   try {
  //     await requestAccount();
  //     const accounts = await provider?.listAccounts();
  //     const account = accounts?.[0];
  //     // Generate proof parameters
  //     const a = ["0x...", "0x..."]; // Replace with your parameters
  //     const b = [
  //       ["0x...", "0x..."],
  //       ["0x...", "0x..."],
  //     ]; // Replace with your parameters
  //     const c = ["0x...", "0x..."]; // Replace with your parameters
  //     if (contract) {
  //       await contract.addProof(a, b, c, newProofDescription);
  //       setProofCount(proofCount + 1);
  //     }
  //   } catch (error) {
  //     console.error("Error adding proof:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const getProof = async (proofId: string) => {
  //   if (contract) {
  //     try {
  //       const proof = await contract.getProof(proofId);
  //       console.log("Proof:", proof);
  //     } catch (error) {
  //       console.error("Error fetching proof:", error);
  //     }
  //   }
  // };

  const onSubmit = async () => {
    if (!fileList) {
      toast.error("Please upload a file");
      return;
    }

    for (const file of fileList) {
      const reader = new FileReader();
      reader.onload = async event => {
        const fileData = event.target?.result;
        if (fileData instanceof ArrayBuffer) {
          const decoder = new TextDecoder();
          const fileContent = decoder.decode(fileData);
          try {
            await init();

            // gets the hash and processed logs
            const result = process_and_hash_csv(fileContent);
            const { processed_transactions: logs, hash } = JSON.parse(result);

            // Call the uploadFile mutation function with the hash and logs
            uploadFile({ hash, logs });
            uploadToLighthouse();
          } catch (error) {
            console.error("Error processing logs:", error);
          }
        }
      };
      reader.readAsArrayBuffer(file);
      // fetchProofData();
    }
  };

  const handleFileChange = (newFiles: FileList) => {
    const validFiles = Array.from(newFiles).filter(file => file.size <= 50 * 1024 * 1024);
    if (validFiles.length > 0) {
      setFileList(newFiles);
    } else {
      alert("File size should be less than or equal to 50MB");
    }
  };

  const removeFile = () => {
    setFileList(null);
  };

  // Lighthouseprogress callback
  const progressCallback = (progressData: ProgressData) => {
    // const percentageDone = 100 - (progressData?.total / progressData?.uploaded)?.toFixed(2);
    const percentageDone = 100 - parseFloat((progressData?.total / progressData?.uploaded)?.toFixed(2));
    console.log("Percentage Done: ", percentageDone);
  };
  const uploadToLighthouse = async () => {
    if (fileList && lightHouseApiKey) {
      console.log("File List:", fileList);
      // Upload file to lighthouse
      const output = await lighthouse.upload(fileList, lightHouseApiKey, false, undefined, progressCallback);
      // console.log("File Status:", output);
      // console.log("Visit at https://gateway.lighthouse.storage/ipfs/" + output.data.Hash);
    } else {
      console.log("No file selected");
    }
  };
  return (
    <>
      <div className="background-container flex items-center flex-col flex-grow pt-10">
        <div className="px-5 w-full max-w-lg mx-auto">
          <div className="glass p-12 rounded-lg text-center mt-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              <h1 className="text-xl mb-6 text-white font-bold">Upload a file (max 50MB): {fileList ? fileList[0].name : ""}</h1>
              <Dropzone
                onChange={handleFileChange}
                className="my-5 bg-teal-100"
                fileExtensions={["csv", "log"]}
                onRemove={removeFile}
                isPending={isPending}
              />
              <button className="hover:animate-pulse btn btn-primary mt-5 w-full custom-disabled" type="submit" disabled={!fileList || isLoading || isPending}>
              Upload File
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Upload;
