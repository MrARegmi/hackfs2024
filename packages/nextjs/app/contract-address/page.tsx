"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { LiaExternalLinkAltSolid } from "react-icons/lia";
import { useGetTransaction } from "~~/hooks/transaction/useTransaction";
import { formattedDateAndTime } from "~~/utils/helpers";

interface Transaction {
  blockNumber: number;
  timeStamp: number;
  hash: string;
  nonce: number;
  blockHash: string;
  transactionIndex: number;
  from: string;
  to: string;
  value: string;
  gas: number;
  gasPrice: number;
  isError: number;
  txreceipt_status: number;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: number;
  confirmations: number;
}

const ContractAddress: NextPage = () => {
  const contractAddress = "0xf6ac13905fe86af46e28a7ee3ed52d74a0037b81";
  const { isLoading, transactions } = useGetTransaction(contractAddress);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-ring loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="w-screen">
      <div className="mx-auto mt-8 max-w-screen-lg px-2">
        <div className="sm:flex sm:items-center sm:justify-between flex-col sm:flex-row">
          <p className="flex-1 text-base font-bold text-gray-900">
            Transactions
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

          <div className="mt-4 sm:mt-0">
            <div className="flex items-center justify-start sm:justify-end">
              <div className="flex items-center">
                <label htmlFor="" className="mr-2 flex-shrink-0 text-sm font-medium text-gray-900">
                  Sort by:
                </label>
                <select
                  name=""
                  className="sm: mr-4 block w-full whitespace-pre rounded-lg border p-1 pr-10 text-base outline-none focus:shadow sm:text-sm"
                >
                  <option className="whitespace-no-wrap text-sm">Recent</option>
                  <option className="whitespace-no-wrap text-sm">Oldest</option>
                </select>
              </div>

              <button
                type="button"
                className="inline-flex cursor-pointer items-center rounded-lg border border-gray-400 bg-white py-2 px-3 text-center text-sm font-medium text-gray-800 shadow hover:bg-gray-100 focus:shadow"
              >
                <svg
                  className="mr-1 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    className=""
                  ></path>
                </svg>
                Export to CSV
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white overflow-x-auto rounded-xl border shadow">
          <table className="min-w-full border-separate  border-spacing-y-2 border-spacing-x-2">
            <thead className="border-b lg:table-header-group">
              <tr className="">
                <td className="whitespace-normal py-4 text-sm font-medium  sm:px-6">Transaction Hash</td>

                <td className="whitespace-normal py-4 text-sm font-medium  sm:px-6">Block</td>

                <td className="whitespace-normal py-4 text-sm font-medium  sm:px-6">Date and Time (UTC)</td>

                <td className="whitespace-normal py-4 text-sm font-medium  sm:px-6">From</td>
                <td className="whitespace-normal py-4 text-sm font-medium  sm:px-6">To</td>
                <td className="whitespace-normal py-4 text-sm font-medium  sm:px-6">Txn Fee</td>
              </tr>
            </thead>

            <tbody className="lg:border-gray-300">
              {transactions?.result.map((transaction: Transaction) => (
                <tr key={transaction.hash}>
                  <td className="whitespace-no-wrap py-4 text-sm font-bold text-gray-900 sm:px-6">
                    <div className="w-24 overflow-hidden overflow-ellipsis whitespace-nowrap" title={transaction.hash}>
                      <Link
                        href={`/contract-address/${transaction.hash}`}
                        className="hover:underline underline-offset-2 text-indigo-500"
                      >
                        {transaction.hash}
                      </Link>

                      {/* {transaction.hash || "N/A"} */}
                    </div>
                  </td>

                  <td className="whitespace-no-wrap  py-4 text-sm  text-gray-500 sm:px-6 lg:table-cell">
                    {transaction.blockNumber}
                  </td>

                  <td className="whitespace-no-wrap  py-4 text-sm text-gray-500 sm:px-6 lg:table-cell">
                    {formattedDateAndTime(transaction.timeStamp)}
                  </td>

                  <td className="whitespace-no-wrap py-4 text-sm font-regular text-gray-500 sm:px-6 lg:table-cell">
                    <div className="w-24 overflow-hidden overflow-ellipsis whitespace-nowrap" title={transaction.from}>
                      {transaction.from}
                    </div>
                  </td>
                  <td className="whitespace-no-wrap py-4 text-sm font-regular text-gray-500 sm:px-6 lg:table-cell">
                    <div
                      className="w-24 overflow-hidden overflow-ellipsis whitespace-nowrap"
                      title={transaction.to || "N/A"}
                    >
                      {transaction.to || "N/A"}
                    </div>
                  </td>
                  <td className="whitespace-no-wrap py-4 text-sm font-normal text-gray-500 sm:px-6 lg:table-cell">
                    <div className="inline-flex items-center rounded-full bg-green-200 py-2 px-3 text-xs">
                      {((transaction.gasUsed * transaction.gasPrice) / 1e18).toFixed(4)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContractAddress;
