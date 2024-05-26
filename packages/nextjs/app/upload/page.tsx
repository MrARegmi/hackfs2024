"use client";

import { useEffect, useState } from "react";
import init, { process_and_hash_csv } from "../../../../rust-modules/wasm-lib/pkg";
import Dropzone from "./components/Dropzone";
import { ethers } from "ethers";
import { Contract } from "ethers";
import type { NextPage } from "next";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useUploadFile } from "~~/hooks/upload/useUploadFile";
import ContractABI from "~~/mock/ContractABI.json";

const Upload: NextPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const { handleSubmit } = useForm<{ file: File }>();

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [proofCount, setProofCount] = useState<number>(0);
  const [userProofs, setUserProofs] = useState<string[]>([]);
  const [newProofDescription, setNewProofDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Initialize MetaMask provider
    const initializeProvider = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
      }
    };
    initializeProvider();
  }, []);

  useEffect(() => {
    // Load contract
    const loadContract = async () => {
      if (provider) {
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();
        const contractAddress = "0x3607fd869C5f2bfeA6Ad179DBe9d106d9BAe09e7"; // Replace with your contract address
        const contractWithSigner = new ethers.Contract(contractAddress, ContractABI, signer);
        const contractWithProvider = new ethers.Contract(contractAddress, ContractABI, provider);
        const adData = await contractWithProvider.getCurrentAd();
        console.log(adData);

        const accounts = await provider.send("eth_requestAccounts", []);
        console.log(accounts);
        // const proofs = await contractWithProvider.getUserProofs(accounts[0]);
        // console.log(proofs);
        setContract(contractWithSigner);
      }
    };
    loadContract();
  }, [provider]);

  const requestAccount = async () => {
    await window.ethereum.request({ method: "eth_requestAccounts" });
  };

  const getUserProofs = async () => {
    if (contract) {
      try {
        const proofs = await contract.getUserProofs();
        setUserProofs(proofs);
      } catch (error) {
        console.error("Error fetching user proofs:", error);
      }
    }
  };

  const addProof = async () => {
    if (!newProofDescription) return;
    setLoading(true);
    try {
      await requestAccount();
      const accounts = await provider?.listAccounts();
      const account = accounts?.[0];
      // Generate proof parameters
      const a = ["0x...", "0x..."]; // Replace with your parameters
      const b = [
        ["0x...", "0x..."],
        ["0x...", "0x..."],
      ]; // Replace with your parameters
      const c = ["0x...", "0x..."]; // Replace with your parameters
      if (contract) {
        await contract.addProof(a, b, c, newProofDescription);
        setProofCount(proofCount + 1);
      }
    } catch (error) {
      console.error("Error adding proof:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProof = async (proofId: string) => {
    if (contract) {
      try {
        const proof = await contract.getProof(proofId);
        console.log("Proof:", proof);
      } catch (error) {
        console.error("Error fetching proof:", error);
      }
    }
  };

  const { uploadFile, isLoading, isPending } = useUploadFile();

  const onSubmit = () => {
    if (!file) {
      toast.error("Please upload a file");
      return;
    }

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
        } catch (error) {
          console.error("Error processing logs:", error);
        }
      }
    };
    reader.readAsArrayBuffer(file);
    // fetchProofData();
  };

  const handleFileChange = (newFile: File) => {
    if (newFile.size > 50 * 1024 * 1024) {
      // File size exceeds 50MB
      alert("File size should be less than or equal to 50MB");
      return;
    }

    setFile(newFile);
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <>
      <div className="text-center mt-8 p-10">
        <form onSubmit={handleSubmit(onSubmit)}>
          <h1 className="text-xl">Upload a file (max 50MB): {file?.name}</h1>
          <Dropzone
            onChange={handleFileChange}
            className="my-5"
            fileExtensions={["csv", "log"]}
            onRemove={removeFile}
            isPending={isPending}
          />
          <button className="btn btn-primary" type="submit" disabled={!file || isLoading || isPending}>
            Upload File
          </button>
        </form>
      </div>
    </>
  );
};

export default Upload;
