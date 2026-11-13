'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  Image as ImageIcon,
  Camera,
  Film,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { requestMediaUploadUrl, verifyAndCommitMedia } from '@/actions/media';
import { compressImage } from '@/lib/image-compression';

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
  const [lastFailedFile, setLastFailedFile] = useState<File | null>(null);
  const [isSuccess, setIsSuccess] = useState(Boolean(currentUrl));

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (rawFile: File) => {
    setError(null);
    setLastFailedFile(null);
    setIsSuccess(false);

    // 1. Client-side Size Check on raw input
    const maxSizeBytes = effectiveMaxSizeMb * 1024 * 1024;
    if (rawFile.size > maxSizeBytes && isVideo) {
      setError(`Video is too large. Maximum allowed size is ${effectiveMaxSizeMb} MB.`);
      return;
    }

    // 2. Client-side Image Compression (target 1600px long edge, WebP/JPEG)
    let file = rawFile;
    if (!isVideo && rawFile.type.startsWith('image/')) {
      try {
        file = await compressImage(rawFile, 1600, 0.85);
      } catch (compErr) {
        console.warn('Image compression fallback to original:', compErr);
        file = rawFile;
      }
    }

    if (file.size > maxSizeBytes) {
      setError(`File is too large. Maximum allowed size is ${effectiveMaxSizeMb} MB.`);
      return;
    }

    try {
      setUploading(true);
      setProgress(10);

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
            setProgress(Math.max(15, pct));
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
      setIsSuccess(true);
      onUploadSuccess(publicUrl);
    } catch (err: unknown) {
      setLastFailedFile(rawFile);
      setError((err as Error).message || 'Upload failed. Please check network connection.');
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

  const handleRetry = () => {
    if (lastFailedFile) {
      processFile(lastFailedFile);
    } else {
      galleryInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="block text-sm font-semibold text-stone-800 tracking-tight">
          {label}
        </label>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={galleryInputRef}
        type="file"
        accept={effectiveAccept}
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />

      {!isVideo && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      )}

      <div className="p-4 rounded-2xl border-2 border-stone-200/80 bg-white flex flex-col sm:flex-row items-center gap-4 transition-all">
        {/* Preview Container */}
        {previewUrl ? (
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shrink-0 shadow-xs">
            {isVideo ? (
              <video src={previewUrl} className="w-full h-full object-cover" muted />
            ) : (
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                sizes="96px"
                className="object-cover"
              />
            )}
            {isSuccess && (
              <div className="absolute top-1.5 right-1.5 bg-emerald-600 text-white p-1 rounded-full shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center text-stone-400 shrink-0">
            {isVideo ? (
              <Film className="w-7 h-7 text-stone-400" />
            ) : (
              <ImageIcon className="w-7 h-7 text-stone-400" />
            )}
            <span className="text-[10px] uppercase font-bold mt-1 text-stone-400">Empty</span>
          </div>
        )}

        {/* Upload Action Buttons */}
        <div className="flex-1 w-full space-y-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {!isVideo && (
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading}
                className="min-h-[48px] px-4 py-2.5 bg-white border border-stone-300 hover:border-[#8B4A27] text-stone-800 text-sm font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-60 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Camera className="w-4 h-4 text-stone-600" />
                <span>Take Photo</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploading}
              className="min-h-[48px] px-4 py-2.5 bg-[#FAF8F5] border border-stone-300 hover:bg-stone-100 text-stone-800 text-sm font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-60 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#8B4A27]" />
                  <span>Uploading ({progress}%)...</span>
                </>
              ) : previewUrl ? (
                <>
                  <UploadCloud className="w-4 h-4 text-stone-600" />
                  <span>Choose from Gallery</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 text-stone-600" />
                  <span>Choose from Gallery</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-stone-500">
            <span>Max {effectiveMaxSizeMb} MB</span>
            <span>•</span>
            <span>Auto-compressed for fast mobile upload</span>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden mt-2">
              <div
                className="bg-[#8B4A27] h-2 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Success Badge */}
          {isSuccess && !uploading && !error && (
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-emerald-700 pt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Uploaded successfully</span>
            </div>
          )}

          {/* Failure & Try Again */}
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-rose-700 font-medium text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="line-clamp-2">{error}</span>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="min-h-[36px] px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1 transition-all active:scale-[0.97] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
