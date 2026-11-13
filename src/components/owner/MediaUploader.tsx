'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      setError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
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

      // 4. Upload binary directly to Cloudflare R2 with progress tracking
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

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-semibold text-stone-700">{label}</label>}

      <div className="flex items-center gap-4">
        {/* Preview Container */}
        {previewUrl ? (
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 flex-shrink-0 shadow-sm">
            {isVideo ? (
              <video src={previewUrl} className="w-full h-full object-cover" muted />
            ) : (
              <Image src={previewUrl} alt="Preview" fill className="object-cover" />
            )}
          </div>
        ) : (
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center text-stone-400 flex-shrink-0">
            <span className="text-xl">{isVideo ? '🎬' : '📷'}</span>
            <span className="text-[9px] uppercase font-bold mt-1">Empty</span>
          </div>
        )}

        {/* Upload Controls */}
        <div className="flex-1 space-y-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept={effectiveAccept}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-medium rounded-xl transition-all shadow-sm disabled:opacity-60"
          >
            {uploading ? `Uploading (${progress}%)...` : previewUrl ? 'Change File' : 'Choose File'}
          </button>

          <p className="text-[11px] text-stone-400">
            Max {effectiveMaxSizeMb} MB • {effectiveAccept.replace(/image\/|video\//g, '').toUpperCase()}
          </p>

          {/* Progress Bar */}
          {uploading && (
            <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#8B4A27] h-1.5 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        </div>
      </div>
    </div>
  );
}
