"use client";

import { useState } from "react";
// import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
// import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [newAddress, setNewAddress] = useState<string>("");
  const { writeContractAsync: YourContractWrite } = useScaffoldWriteContract("YourContract");

  const { data: owner } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "owner",
  });

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
            <p className="my-2 font-medium">Owner Address: </p>
            <Address address={owner} />
          </div>
          <div className="flex justify-center items-center space-x-2">
            <p className="my-2 font-medium">Set New Owner: </p>
            <AddressInput value={newAddress} onChange={v => setNewAddress(v)} placeholder="New Owner Address" />
          </div>

          <div className="flex justify-center items-center space-x-2">
            <button
              className="btn btn-primary mt-5"
              onClick={() => YourContractWrite({ functionName: "setNewOwner", args: [newAddress] })}
            >
              Transfer Ownership
            </button>
          </div>
          {/* <Link
            href={`https://goerli.etherscan.io/address/${newAddress}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary btn-sm font-normal gap-1"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
            <span>View on Etherscan</span>
          </Link> */}
        </div>
      </div>
    </>
  );
};

export default Home;
