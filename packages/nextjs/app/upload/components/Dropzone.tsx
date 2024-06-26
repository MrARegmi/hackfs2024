"use client";

import React, { useRef, useState } from "react";
import { RxCross2 } from "react-icons/rx";

interface DropzoneProps {
  onChange: (files: FileList) => void;
  className?: string;
  fileExtensions?: string[]; // Array of allowed file extensions
  isPending?: boolean;
  onRemove?: () => void;
}

const Dropzone: React.FC<DropzoneProps> = ({
  onChange,
  className,
  fileExtensions = [],
  isPending,
  onRemove,
  ...props
}: DropzoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileInfo, setFileInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { files } = e.dataTransfer;
    const validFile = Array.from(files).find(file => file.size <= 50 * 1024 * 1024 && isValidExtension(file.name));
    if (validFile) {
      handleFile(files);
    } else {
      setError("File size should be less than or equal to 50MB or invalid file type");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; // Get the first file from the FileList
    if (files && files[0].size <= 50 * 1024 * 1024 && isValidExtension(files[0].name)) {
      handleFile(files);
    } else {
      setError("File size should be less than or equal to 50MB or invalid file type");
    }
  };

  const isValidExtension = (fileName: string) => {
    return fileExtensions.some(ext => fileName.endsWith(`.${ext}`));
  };

  const handleFile = (files: FileList) => {
    onChange(files);
    const fileSizeInKB = Math.round(files[0].size / 1024);
    setFileInfo(`Uploaded file: ${files[0].name} (${fileSizeInKB} KB)`);
    setError(null);
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = () => {
    setFileInfo(null);
    if (onRemove) onRemove();
  };

  return (
    <div
      className={`border-2 border-gray-300 border-dashed  appearance-none hover:cursor-pointer hover:border-gray-400 focus:outline-none bg-white max-w-xl mx-auto ${className}`}
      {...props}
    >
      <div
        className="flex flex-col justify-center items-center w-full space-y-2 h-32 px-2 py-4 transition rounded-md text-sm"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isPending ? (
          <span className="loading loading-ring loading-lg"></span>
        ) : (
          <div className="flex items-center justify-center w-full">
            <span className="font-base">Drag Files to Upload or</span>
            <button className="font-medium ml-2 underline-offset-4 hover:underline" onClick={handleButtonClick}>
              Click Here
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={fileExtensions.map(ext => `.${ext}`).join(", ")}
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        )}
        {!isPending && fileInfo && (
          <div className="flex items-center justify-center gap-2 w-full">
            <p className="text-sm text-accent">{fileInfo}</p>
            <RxCross2
              className="cursor-pointer text-red-500 mx-2 hover:text-red-400 hover:bg-red-200 rounded-xl p-1"
              size={20}
              onClick={handleRemoveFile}
            />
          </div>
        )}
        {error && <span className="text-red-500">{error}</span>}
      </div>
    </div>
  );
};

export default Dropzone;
