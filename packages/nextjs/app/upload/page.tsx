"use client";

import { useState } from "react";
import init, { process_logs } from "../../../../rust-modules/wasm-lib/pkg";
import Dropzone from "./_components/Dropzone";
import type { NextPage } from "next";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useUploadFile } from "~~/hooks/upload/useUploadFile";
import { createHash } from "~~/utils/helpers";

const Upload: NextPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const { handleSubmit } = useForm<{ file: File }>();

  const { uploadFile, isLoading } = useUploadFile();

  const onSubmit = () => {
    if (!file) {
      toast.error("Please upload a file");
      return;
    }
    console.log("File:", file);

    const reader = new FileReader();
    reader.onload = async event => {
      const fileData = event.target?.result;
      if (fileData instanceof ArrayBuffer) {
        const decoder = new TextDecoder();
        const fileContent = decoder.decode(fileData);
        console.log("File content:", fileContent);
        try {
          await init();
          const logs = process_logs(fileContent);

          // Generate the hash
          const hash = createHash(logs);

          console.log("Hash:", hash);

          // Call the uploadFile mutation function with the hash and logs
          uploadFile({ hash, logs });
        } catch (error) {
          console.error("Error processing logs:", error);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (newFile: File) => {
    if (newFile.size > 1024 * 1024) {
      // File size exceeds 1MB
      alert("File size should be less than or equal to 1MB");
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
          <h1 className="text-xl">Upload a file (max 1MB): {file?.name}</h1>
          <Dropzone onChange={handleFileChange} className="my-5" fileExtension="log" onRemove={removeFile} />
          <button className="btn btn-primary" type="submit" disabled={!file || isLoading}>
            Upload File
          </button>
        </form>
      </div>
    </>
  );
};

export default Upload;
