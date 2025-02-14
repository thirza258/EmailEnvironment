"use client"
import { useState } from "react";
import Image from "next/image";
import { run } from "@/service/ai";
import { Loader2, Upload, Mail, AlertCircle } from "lucide-react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;
    
    // Validate file type
    if (!uploadedFile.type.startsWith('image/')) {
      setError("Please upload an image file");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(uploadedFile);

    setFile(uploadedFile);
    await generateEmail(uploadedFile);
  };

  const generateEmail = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const response = await run(file);
     
      const parsedResponse = JSON.parse(response); // Convert string to JSON

      setEmailSubject(parsedResponse.subject);
      setEmailBody(parsedResponse.body);
    } catch (err) {
      setError("Failed to generate email. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      const input = document.querySelector('input[type="file"]');
      input.files = e.dataTransfer.files;
      await handleFileUpload({ target: input });
    } else {
      setError("Please drop an image file");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      {/* Hero Section */}
      <div className="text-center py-8 space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">
          Report an Environmental Concern
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Submit a photo of an environmental issue and we will help you generate a professional email to report it to the relevant authorities.
        </p>
      </div>

      {/* File Upload Section */}
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors relative"
        >
          {preview ? (
            <div className="space-y-4">
              <Image
                src={preview}
                alt="Preview"
                className="mx-auto max-h-48 rounded-lg"
                width={500}
                height={500}
              />
              <p className="text-sm text-gray-500">
                Click or drag another image to replace
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-600">
                Drag and drop an image here, or click to select
              </p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mt-6 flex items-center space-x-2 text-blue-600">
          <Loader2 className="animate-spin" />
          <span>Generating email...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-6 w-full max-w-md bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Email Output Section */}
      {file && !loading && !error && (
        <div className="mt-8 w-full max-w-md bg-white shadow-lg rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-gray-800">
            <Mail className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Generated Email</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Subject
              </label>
              <p className="mt-1 text-gray-800">{emailSubject}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Body
              </label>
              <p className="mt-1 text-gray-800 whitespace-pre-line">
                {emailBody}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}