'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, Image as ImageIcon, Film, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { requestMediaUploadUrl, verifyAndCommitMedia } from '@/actions/media';

interface MediaUploaderProps {
  restaurantId: string;
  purpose: 'logo' | 'hero' | 'poster' | 'dish';
  currentUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  label?: string;
  accept?: string;
  maxSizeMb?: number;
}

export function MediaUploader({
  restaurantId,
  purpose,
  currentUrl,
  onUploadSuccess,
  label,
  accept,
  maxSizeMb,
}: MediaUploaderProps) {
  const isVideo = purpose === 'hero' && accept?.includes('video');
  const effectiveMaxSizeMb = maxSizeMb || (isVideo ? 50 : 5);
  const effectiveAccept =
    accept || (isVideo ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp');

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);

    // 1. Client-side Size Validation
    const maxSizeBytes = effectiveMaxSizeMb * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File is too large. Maximum allowed size is ${effectiveMaxSizeMb} MB.`);
      return;
    }

    // 2. Client-side Type Validation
    const allowedTypes = effectiveAccept.split(',').map((t) => t.trim());
    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file format (${file.type}). Allowed: ${allowedTypes.join(', ')}`);
      return;
    }

    try {
      setUploading(true);
      setProgress(5);

      // 3. Request presigned URL from server action
      const presignedRes = await requestMediaUploadUrl({
        restaurantId,
        fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'video/mp4' | 'video/webm',
        fileSize: file.size,
        purpose,
      });

      if (!presignedRes.success || !presignedRes.data) {
        throw new Error(presignedRes.error || 'Failed to acquire upload authorization');
      }

      const { uploadUrl, publicUrl, key } = presignedRes.data;

      // 4. Upload binary directly to Cloudflare R2 / Storage with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 90);
            setProgress(Math.max(10, pct));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(95);
            resolve();
          } else {
            reject(new Error(`Storage rejected upload with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload to Cloudflare R2'));
        xhr.send(file);
      });

      // 5. Verify upload in storage and commit URL
      if (purpose === 'logo' || purpose === 'hero' || purpose === 'poster') {
        const commitRes = await verifyAndCommitMedia({
          restaurantId,
          key,
          publicUrl,
          purpose,
        });

        if (!commitRes.success) {
          throw new Error(commitRes.error || 'Failed to verify upload in storage');
        }
      }

      setProgress(100);
      setPreviewUrl(publicUrl);
      onUploadSuccess(publicUrl);
    } catch (err: unknown) {
      setError((err as Error).message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold text-stone-700 tracking-tight">
          {label}
        </label>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-center gap-4 ${
          isDragOver
            ? 'border-[#8B4A27] bg-[#8B4A27]/5 ring-2 ring-[#8B4A27]/20'
            : 'border-stone-200/80 bg-white hover:border-stone-300'
        }`}
      >
        {/* Preview Container */}
        {previewUrl ? (
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-stone-200/80 bg-stone-100 flex-shrink-0 shadow-sm group">
            {isVideo ? (
              <video src={previewUrl} className="w-full h-full object-cover" muted />
            ) : (
              <Image src={previewUrl} alt="Preview" fill className="object-cover" />
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[10px] text-white font-medium bg-black/50 px-2 py-0.5 rounded-full">
                Preview
              </span>
            </div>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-2xl border border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center text-stone-400 flex-shrink-0">
            {isVideo ? (
              <Film className="w-6 h-6 text-stone-400" />
            ) : (
              <ImageIcon className="w-6 h-6 text-stone-400" />
            )}
            <span className="text-[9px] uppercase font-bold mt-1 text-stone-400">Empty</span>
          </div>
        )}

        {/* Upload Controls */}
        <div className="flex-1 w-full space-y-2 text-center sm:text-left">
          <input
            ref={fileInputRef}
            type="file"
            accept={effectiveAccept}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-[#FAF8F5] border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-semibold rounded-xl transition-all apple-press disabled:opacity-60 flex items-center gap-1.5 shadow-sm"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#8B4A27]" />
                  <span>Uploading ({progress}%)...</span>
                </>
              ) : previewUrl ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-stone-600" />
                  <span>Replace Asset</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5 text-stone-600" />
                  <span>Choose File</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-stone-400 font-medium">
              Max {effectiveMaxSizeMb} MB • {effectiveAccept.replace(/image\/|video\//g, '').toUpperCase()}
            </span>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#8B4A27] h-1.5 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium pt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
