"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { MdOutlineFileDownload } from "react-icons/md";
import { useGetUploads } from "~~/hooks/upload/useGetUploads";

interface LighthouseFileProps {
  publicKey: string;
  fileName: string;
  mimeType: string;
  txHash: string;
  status: string;
  createdAt: number;
  fileSizeInBytes: string;
  cid: string;
  id: string;
  lastUpdate: number;
  encryption: boolean;
}

const LighthouseFiles: NextPage = () => {
  const { files, isLoading } = useGetUploads();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-ring loading-lg"></span>
      </div>
    );
  }

  if (!files) {
    return <p className="text-center">No files uploaded yet.</p>;
  }

  return (
    <div className="w-screen">
      <div className="mx-auto mt-8 max-w-screen-lg px-2">
        <div className="sm:flex sm:items-center sm:justify-between flex-col sm:flex-row">
          <p className="flex-1 text-base font-bold text-gray-900">
            My Files
            {/* <span className="block  text-sm font-normal text-gray-500">Contract Address: {contractAddress}</span> */}
            {/* <Link
              href={`https://sepolia.etherscan.io/address/${contractAddress}`}
              target="_blank"
              className="hover:underline text-indigo-600 text-xs font-medium inline-flex items-center gap-1"
            >
              Watch on Etherscan
              <LiaExternalLinkAltSolid className="inline-block" size={16} />
            </Link> */}
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
            </div>
          </div>
        </div>

        <div className="mt-6 max-h-96 bg-white overflow-x-auto rounded-xl border shadow">
          <table className="min-w-full border-separate  border-spacing-y-2 border-spacing-x-2">
            <thead className="border-b lg:table-header-group">
              <tr className="">
                <td className="whitespace-normal py-4 text-sm font-medium  sm:px-6">File Name</td>

                <td className="whitespace-normal py-4 text-sm font-medium  sm:px-6">Size</td>

                <td className="whitespace-normal py-4 text-sm font-medium  sm:px-6">Created</td>

                <td className="whitespace-normal py-4 text-sm font-medium  sm:px-6">Last Update</td>
                <td className="whitespace-normal py-4 text-sm font-medium  sm:px-6">Action</td>
              </tr>
            </thead>

            <tbody className="lg:border-gray-300">
              {files?.fileList?.map(file => (
                <tr key={file.id}>
                  <td className="whitespace-no-wrap  py-4 text-sm  text-gray-500 sm:px-6 lg:table-cell">
                    {file.fileName}
                  </td>

                  <td className="whitespace-no-wrap  py-4 text-sm text-gray-500 sm:px-6 lg:table-cell">
                    {(parseInt(file.fileSizeInBytes) / 1024).toFixed(2)} KB
                  </td>

                  <td className="whitespace-no-wrap py-4 text-sm font-regular text-gray-500 sm:px-6 lg:table-cell">
                    {new Date(file.createdAt).toLocaleString()}
                  </td>
                  <td className="whitespace-no-wrap py-4 text-sm font-regular text-gray-500 sm:px-6 lg:table-cell">
                    {new Date(file.lastUpdate).toLocaleString()}
                  </td>
                  <td className="whitespace-no-wrap py-4 text-sm font-regular text-gray-500 sm:px-6 lg:table-cell">
                    <Link
                      href={`https://gateway.lighthouse.storage/ipfs/${file.cid}`}
                      className="hover:underline text-indigo-600 text-xs font-medium inline-flex items-center gap-1"
                    >
                      <MdOutlineFileDownload className="inline-block" size={16} />
                      Download
                    </Link>
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

export default LighthouseFiles;
