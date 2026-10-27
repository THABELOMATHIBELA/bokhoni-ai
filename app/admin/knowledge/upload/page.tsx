
"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt", "md"];

export default function KnowledgeUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadedPath, setUploadedPath] = useState("");

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setMessage("");
    setError("");
    setUploadedPath("");

    const selectedFile = event.target.files?.[0] ?? null;
    setFile(null);

    if (!selectedFile) return;

    const extension = selectedFile.name
      .split(".")
      .pop()
      ?.toLowerCase();

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      setError("Only PDF, DOCX, TXT and MD files are allowed.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size === 0 || selectedFile.size > MAX_FILE_SIZE) {
      setError("File must be larger than 0 bytes and no more than 10 MB.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file || uploading) return;

    setUploading(true);
    setError("");
    setMessage("");
    setUploadedPath("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed.");
      }

      setMessage(
        `${result.fileName || file.name} uploaded successfully to Supabase Storage.`
      );
      setUploadedPath(result.filePath || "");
      setFile(null);

      const input = document.getElementById(
        "knowledge-file"
      ) as HTMLInputElement | null;

      if (input) input.value = "";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin/knowledge"
          className="text-sm font-semibold text-emerald-700 hover:underline"
        >
          ← Back to Knowledge Management
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Bokhoni AI Knowledge Management
            </span>

            <h1 className="mt-4 text-3xl font-bold">
              Upload Knowledge Document
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Upload documents to the private Bokhoni AI knowledge
              storage area. Documents can later be reviewed, processed,
              and connected to the AI knowledge system.
            </p>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label
                htmlFor="knowledge-file"
                className="mb-2 block text-sm font-semibold"
              >
                Choose document
              </label>

              <input
                id="knowledge-file"
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-emerald-800"
              />

              <p className="mt-2 text-xs text-slate-500">
                Supported: PDF, DOCX, TXT, MD. Maximum size: 10 MB.
              </p>
            </div>

            {file && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">Selected document</p>
                <p className="mt-1 break-all text-sm">{file.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {message && (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
              >
                <p className="font-semibold">{message}</p>
                {uploadedPath && (
                  <p className="mt-2 break-all text-xs">
                    Storage path: {uploadedPath}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? "Uploading document..." : "Upload Document"}
            </button>
          </form>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">
            Important: AI knowledge processing
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Uploading a document stores the original file only.
            It does not automatically train the AI or make the document
            available in chat. Database registration, text extraction,
            verification, and knowledge retrieval still need to be connected.
          </p>
        </div>
      </div>
    </main>
  );
}
