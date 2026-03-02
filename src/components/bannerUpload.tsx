"use client";
import axios from "axios";
import { useState } from "react";

export default function AdminUpload() {
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    const res = await axios.post("/api/upload/bannerUpload", formData, {
      onUploadProgress: (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
        );
        setProgress(percent);
      },
    });

    setUploadedUrl(res.data.url);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>

      <p>Upload Progress: {progress}%</p>

      {uploadedUrl && (
        <>
          <p>
            Uploaded URL: <a href={uploadedUrl}>{uploadedUrl}</a>
          </p>
          <img
            src={uploadedUrl}
            alt="Uploaded file"
            style={{ width: "100%", maxHeight: "500px", objectFit: "cover" }}
          />
        </>
      )}
    </div>
  );
}
