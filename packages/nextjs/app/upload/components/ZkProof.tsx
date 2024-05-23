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
        <div key={idx} className="truncate text-right text-gray-500">
          {hash}
        </div>
      ));
    }
    return <div className="truncate text-right text-gray-500">{hashes}</div>;
  };

  return (
    <div className="container mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold text-center mb-4">Zero-Knowledge Proofs</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(zkProofs.proof).map(([proofId, { x, y }]) => (
          <div key={proofId} className="card bg-base-100 shadow-xl relative">
            <div className="card-body">
              <h3 className="card-title">{`Proof ${proofId.toUpperCase()}`}</h3>
              <div>
                <span className="text-sm font-medium">X:</span>
                {renderHashes(x)}
              </div>
              <div className="mt-2">
                <span className="text-sm font-medium">Y:</span>
                {renderHashes(y)}
              </div>
              <button
                className="absolute top-2 right-2 btn btn-xs w-24"
                onClick={() => copyToClipboard(JSON.stringify({ x, y }, null, 2), proofId)}
              >
                {copiedProofId === proofId ? <FiCheck className="text-green-500" /> : <FiCopy />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ZeroKnowledgeProofs;
