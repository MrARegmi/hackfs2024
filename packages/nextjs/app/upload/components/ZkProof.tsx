"use client";

import React from "react";
import { toast } from "react-hot-toast";
import { FiCheck, FiCopy } from "react-icons/fi";

interface ProofData {
  x: string | string[];
  y: string | string[];
}

interface ZeroKnowledgeProofsProps {
  zkProofs: { [key: string]: ProofData };
}

const ZeroKnowledgeProofs: React.FC<ZeroKnowledgeProofsProps> = ({ zkProofs }) => {
  const [copiedProofId, setCopiedProofId] = React.useState<string | null>(null);
  const copyToClipboard = (text: string, proofId: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Proof copied to clipboard!");
        setCopiedProofId(proofId);
        setTimeout(() => setCopiedProofId(null), 2000);
      })
      .catch(err => {
        console.error("Failed to copy proof: ", err);
        toast.error("Failed to copy!");
      });
  };

  const renderHashes = (hashes: string | string[]) => {
    if (Array.isArray(hashes)) {
      return hashes.map((hash, idx) => (
        <div key={idx} className="truncate text-center text-gray-500">
          {hash}
        </div>
      ));
    }
    return <div className="truncate text-center text-gray-500">{hashes}</div>;
  };

  return (
    <div className=" bg-white rounded-xl p-4 shadow ">
      <div className="flex flex-col gap-2">
        {Object.entries(zkProofs.proof).map(([proofId, { x, y }]) => (
          <div key={proofId} className="px-4 py-2 bg-base-100 ">
            <div className="flex flex-col text-left">
              <div className="flex justify-between">
                <h3 className="text-lg font-bold">{`Proof ${proofId.toUpperCase()}`}</h3>
                <button
                  className="btn btn-ghost btn-sm "
                  onClick={() => copyToClipboard(JSON.stringify({ x, y }, null, 2), proofId)}
                >
                  {copiedProofId === proofId ? <FiCheck className="text-green-500" /> : <FiCopy />}
                </button>
              </div>
              <div className=" flex items-center px-2 whitespace-no-wrap py-4 text-sm  text-gray-500  sm:text-left">
                <span className="text-sm font-medium">X:</span>
                <span className="overflow-hidden overflow-ellipsis whitespace-nowrap ml-8 md:ml-16" title={x}>
                  {renderHashes(x)}
                </span>
              </div>
              <div className=" flex items-center px-2 whitespace-no-wrap py-4 text-sm  text-gray-500  sm:text-left">
                <span className="text-sm font-medium">Y:</span>
                <span className="overflow-hidden overflow-ellipsis whitespace-nowrap ml-8 md:ml-16" title={y}>
                  {renderHashes(y)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ZeroKnowledgeProofs;
