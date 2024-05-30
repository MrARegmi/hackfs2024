"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { zkProofs as mockZkProofs } from "../../../mock/zkProofs";
import ZeroKnowledgeProofs from "../components/ZkProof";
import { LiaExternalLinkAltSolid } from "react-icons/lia";

const loadingMessages = ["Processing your file...", "Finalizing the proofs...", "Generating zk proofs..."];

const ZkProofs = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [zkProofs, setZkProofs] = useState<any>(mockZkProofs);
  const contractAddress = "0xf6ac13905fe86af46e28a7ee3ed52d74a0037b81";

  useEffect(() => {
    let currentMessage = 0;
    const interval = setInterval(() => {
      setLoadingMessage(loadingMessages[currentMessage]);
      currentMessage++;
      if (currentMessage >= loadingMessages.length) {
        clearInterval(interval);
        simulateFetchProofs();
      }
    }, 1000); // Update message every second

    return () => clearInterval(interval);
  }, []);

  const simulateFetchProofs = async () => {
    setTimeout(() => {
      setZkProofs(mockZkProofs);
      setLoading(false);
    }, 3000); // Simulate fetching data after last message
  };

  return (
    <div className="w-screen">
      <div className="mx-auto mt-8 max-w-screen-lg px-2">
        {loading ? (
          <>
            <div className="flex flex-col items-center">
              <span className="loading loading-ring loading-lg mb-4"></span>
              <p className="text-xs text-gray-500">{loadingMessage}</p>
              <p className="text-xs text-gray-500"></p>
            </div>

            <div className=" mx-auto rounded-xl bg-base-100 shadow-xl animate-pulse">
              <div className="p-8">
                {/* Skeleton for the title */}
                <div className="h-8 w-24 bg-gray-300 rounded-md"></div>

                {/* Skeleton for some text or content */}
                <div className="mt-4 h-4 bg-gray-300 rounded-md"></div>
                <div className="mt-2 h-4 bg-gray-300 rounded-md w-3/4"></div>
                <div className="mt-2 h-4 bg-gray-300 rounded-md w-2/4"></div>
                <div className="mt-2 h-4 bg-gray-300 rounded-md w-1/4"></div>
              </div>
              <div className="p-8">
                {/* Skeleton for the title */}
                <div className="h-8 w-24 bg-gray-300 rounded-md"></div>

                {/* Skeleton for some text or content */}
                <div className="mt-4 h-4 bg-gray-300 rounded-md"></div>
                <div className="mt-2 h-4 bg-gray-300 rounded-md w-3/4"></div>
                <div className="mt-2 h-4 bg-gray-300 rounded-md w-2/4"></div>
                <div className="mt-2 h-4 bg-gray-300 rounded-md w-1/4"></div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col mx-auto p-8 text-center">
            <div className="sm:flex sm:items-center sm:justify-between flex-col sm:flex-row">
              <p className="flex-1 text-base font-bold text-gray-900 text-left">
                ZK Proofs
                <span className="block  text-sm font-normal text-gray-500">Contract Address: {contractAddress}</span>
                <Link
                  href={`https://sepolia.etherscan.io/address/${contractAddress}`}
                  target="_blank"
                  className="hover:underline text-indigo-600 text-xs font-medium inline-flex items-center gap-1"
                >
                  Watch on Etherscan
                  <LiaExternalLinkAltSolid className="inline-block" size={16} />
                </Link>
              </p>
            </div>
            <ZeroKnowledgeProofs zkProofs={zkProofs} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ZkProofs;
