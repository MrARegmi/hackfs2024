"use client";

import React, { useRef, useState } from "react";
import { RxCross2 } from "react-icons/rx";

interface DropzoneProps {
  onChange: (file: File) => void;
  className?: string;
  fileExtension?: string;
  onRemove?: () => void;
}

const Dropzone: React.FC<DropzoneProps> = ({
  onChange,
  className,
  fileExtension,
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
    const validFile = Array.from(files).find(file => file.size <= 1024 * 1024);
    if (validFile) {
      handleFile(validFile);
    } else {
      setError("File size should be less than or equal to 1MB");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 1024 * 1024) {
      handleFile(file);
    } else {
      setError("File size should be less than or equal to 1MB");
    }
  };

  const handleFile = (file: File) => {
    if (fileExtension && !file.name.endsWith(`.${fileExtension}`)) {
      setError(`Invalid file type. Expected: .${fileExtension}`);
      return;
    }

    onChange(file);

    const fileSizeInKB = Math.round(file.size / 1024);
    setFileInfo(`Uploaded file: ${file.name} (${fileSizeInKB} KB)`);
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
    setFileInfo(null); // Clear fileInfo
    if (onRemove) onRemove(); // Call the onRemove callback if provided
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
        <div className="flex items-center justify-center w-full">
          <span className="font-base">Drag Files to Upload or</span>
          <button className="font-medium ml-2 underline-offset-4 hover:underline" onClick={handleButtonClick}>
            Click Here
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={`.${fileExtension}`}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
        {fileInfo && (
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
