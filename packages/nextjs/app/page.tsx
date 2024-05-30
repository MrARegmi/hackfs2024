"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [newAddress, setNewAddress] = useState<string>("");
  const [proofData, setProofData] = useState<any>(null);
  // const { writeContractAsync: YourContractWrite } = useScaffoldWriteContract("YourContract");

  const { data: getProof } = useScaffoldReadContract({
    contractName: "ZeroKnowledgeProofStorage",
    functionName: "getProof",
    args: ["proofId"], // Replace "proofId" with the actual proof ID you want to fetch
  });

  useEffect(() => {
    if (getProof) {
      setProofData(getProof);
    }
  }, [getProof]);

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Hack FS 2024</span>
          </h1>
          <div className="flex justify-center items-center space-x-2">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
          <div className="flex justify-center items-center space-x-2">
            <p className="my-2 font-medium">Set New Owner: </p>
            <AddressInput value={newAddress} onChange={v => setNewAddress(v)} placeholder="New Owner Address" />
          </div>

          <div className="flex justify-center items-center space-x-2">
            <button
              className="btn btn-primary mt-5"
              // onClick={() => YourContractWrite({ functionName: "setNewOwner", args: [newAddress] })}
            >
              Transfer Ownership
            </button>
          </div>

          {proofData && (
            <div>
              <h2>Proof Data:</h2>
              <pre>{JSON.stringify(proofData, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
