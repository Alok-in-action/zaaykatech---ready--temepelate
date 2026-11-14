'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Image as ImageIcon,
  Upload,
  AlertCircle,
  FileSpreadsheet,
  Loader2,
  Trash2,
  Scan,
  XCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { requestAIImportUploadUrl, extractMenuFromSource } from '@/actions/ai-import';
import type { AIMenuExtractionOutput } from '@/validations/ai';

interface MenuSourceUploaderProps {
  restaurantId: string;
  onExtractionSuccess: (data: AIMenuExtractionOutput) => void;
}

export function MenuSourceUploader({ restaurantId, onExtractionSuccess }: MenuSourceUploaderProps) {
  const [activeTab, setActiveTab] = useState<'image' | 'pdf' | 'text' | 'csv'>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [csvContent, setCsvContent] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cleanupTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupTimers();
  }, []);

  const handleCancelExtraction = (customReason?: string) => {
    cleanupTimers();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setUploadProgress(0);
    setErrorMessage(
      customReason ||
        'Extraction was cancelled. You can retry with a smaller file, or paste your menu text directly below.'
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, expectedType: 'image' | 'pdf' | 'csv') => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (expectedType === 'image') {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        setErrorMessage('Please select a valid image file (JPG, PNG, or WebP).');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Image exceeds the maximum allowed size of 10 MB.');
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    } else if (expectedType === 'pdf') {
      if (file.type !== 'application/pdf') {
        setErrorMessage('Please select a valid PDF document.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('PDF document exceeds the maximum allowed size of 10 MB.');
        return;
      }
      setSelectedFile(file);
      setFilePreview(null);
    } else if (expectedType === 'csv') {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('CSV file exceeds the maximum allowed size of 2 MB.');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setCsvContent((evt.target?.result as string) || '');
      };
      reader.readAsText(file);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setCsvContent('');
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartExtraction = async () => {
    setErrorMessage(null);
    setIsProcessing(true);
    setUploadProgress(10);
    setElapsedSeconds(0);
    setStatusMessage('Preparing upload...');

    cleanupTimers();
    abortControllerRef.current = new AbortController();

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setElapsedSeconds(elapsed);
    }, 100);

    // Bounded execution timeout: 45 seconds on client
    timeoutRef.current = setTimeout(() => {
      handleCancelExtraction(
        'Extraction timed out after 45 seconds. The document may be too large or the server reached its execution limit. You can retry or switch to pasted text.'
      );
    }, 45000);

    try {
      if (activeTab === 'text') {
        if (!pastedText.trim()) {
          setErrorMessage('Please paste your menu text before starting extraction.');
          cleanupTimers();
          setIsProcessing(false);
          return;
        }
        setStatusMessage('Parsing menu text and organizing dishes...');
        setUploadProgress(50);

        const res = await extractMenuFromSource(restaurantId, {
          type: 'text',
          textContent: pastedText,
        });

        if (!res.success || !res.data) {
          throw new Error(res.error || 'Extraction failed');
        }

        cleanupTimers();
        setUploadProgress(100);
        setStatusMessage('Menu structured successfully!');
        onExtractionSuccess(res.data);
        return;
      }

      if (activeTab === 'csv') {
        if (!csvContent.trim()) {
          setErrorMessage('Please select a valid CSV file.');
          cleanupTimers();
          setIsProcessing(false);
          return;
        }
        setStatusMessage('Parsing spreadsheet rows into categories and dishes...');
        setUploadProgress(50);

        const res = await extractMenuFromSource(restaurantId, {
          type: 'csv',
          textContent: csvContent,
        });

        if (!res.success || !res.data) {
          throw new Error(res.error || 'CSV extraction failed');
        }

        cleanupTimers();
        setUploadProgress(100);
        setStatusMessage('Spreadsheet imported successfully!');
        onExtractionSuccess(res.data);
        return;
      }

      // For Image and PDF:
      if (!selectedFile) {
        setErrorMessage(`Please select a ${activeTab.toUpperCase()} file to upload.`);
        cleanupTimers();
        setIsProcessing(false);
        return;
      }

      setStatusMessage('Requesting secure Cloudflare R2 upload authorization...');
      setUploadProgress(20);

      const presignRes = await requestAIImportUploadUrl(
        restaurantId,
        selectedFile.type,
        selectedFile.size
      );

      if (!presignRes.success || !presignRes.data) {
        throw new Error(presignRes.error || 'Failed to acquire upload authorization.');
      }

      const { uploadUrl, key } = presignRes.data;

      // Direct R2 upload via PUT
      setStatusMessage('Saving original file to secure vault...');
      setUploadProgress(35);

      let storageUploadSuccessful = false;
      try {
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: selectedFile,
          headers: {
            'Content-Type': selectedFile.type,
          },
          signal: abortControllerRef.current?.signal,
        });
        if (uploadRes.ok) {
          storageUploadSuccessful = true;
        }
      } catch (uploadErr: any) {
        if (uploadErr.name === 'AbortError') throw uploadErr;
        console.warn('Direct storage PUT failed (falling back to base64 payload):', uploadErr);
      }

      setStatusMessage(
        selectedFile.type === 'application/pdf'
          ? 'Inspecting document pages & text layers...'
          : 'Preprocessing image with Sharp (grayscale & contrast)...'
      );
      setUploadProgress(55);

      let base64Data: string | undefined = undefined;
      // If direct Supabase/R2 storage upload didn't succeed, fall back to base64 payload for files within server limit
      if (!storageUploadSuccessful) {
        if (selectedFile.size > 4 * 1024 * 1024) {
          throw new Error('Upload to storage failed. Please check your network connection and retry.');
        }
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result as string;
            const commaIndex = res.indexOf(',');
            resolve(commaIndex !== -1 ? res.slice(commaIndex + 1) : res);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      setStatusMessage(
        selectedFile.type === 'application/pdf'
          ? 'Reading document text and running OCR on scanned pages...'
          : 'Loading OCR engine & recognizing dishes, prices and variants...'
      );
      setUploadProgress(75);

      const extractionRes = await extractMenuFromSource(restaurantId, {
        type: storageUploadSuccessful ? 'r2_file' : 'direct_base64',
        r2Key: key,
        mimeType: selectedFile.type,
        base64Data,
      });

      if (!extractionRes.success || !extractionRes.data) {
        throw new Error(
          extractionRes.error ||
            'We could not read this menu reliably. Please upload a clearer photo, PDF, CSV, or paste the menu text.'
        );
      }

      setStatusMessage('Detecting categories, prices and variants...');
      setUploadProgress(95);

      cleanupTimers();
      setUploadProgress(100);
      setStatusMessage('OCR extraction complete! Review your menu below.');
      onExtractionSuccess(extractionRes.data);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('Extraction error:', err);
      setErrorMessage(
        err.message ||
          'We could not read this menu reliably. Please upload a clearer photo, PDF, CSV, or paste the menu text.'
      );
    } finally {
      cleanupTimers();
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <Scan className="h-5 w-5" />
          <CardTitle className="text-xl">Import Menu with Local OCR</CardTitle>
        </div>
        <CardDescription>
          Upload a menu photo, PDF document, spreadsheet, or paste raw text.
          Our local engine (powered by Tesseract.js &amp; Sharp) runs directly on your server — <strong>no API keys required</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val as any);
            handleClearFile();
          }}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 gap-1.5 bg-neutral-100 rounded-xl">
            <TabsTrigger value="image" className="flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm">
              <ImageIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">Photo / Image</span>
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">PDF Document</span>
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">Pasted Text</span>
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm">
              <FileSpreadsheet className="h-4 w-4 shrink-0" />
              <span className="truncate">CSV File</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: IMAGE */}
          <TabsContent value="image" className="space-y-4 pt-4">
            {!selectedFile ? (
              <label className="border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-muted/20 hover:bg-muted/30">
                <div className="p-4 rounded-full bg-primary/10 text-primary mb-3">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="font-medium text-foreground text-center">
                  Click to browse or drag and drop your menu photo
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: JPG, PNG, WebP (Max 10 MB) • Enhanced with Sharp &amp; Tesseract.js
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'image')}
                  disabled={isProcessing}
                />
              </label>
            ) : (
              <div className="border rounded-xl p-4 bg-muted/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for local OCR
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleClearFile}
                    disabled={isProcessing}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                {filePreview && (
                  <div className="relative rounded-lg overflow-hidden border max-h-60 bg-black/5 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={filePreview}
                      alt="Menu Preview"
                      className="max-h-60 object-contain w-auto"
                    />
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: PDF */}
          <TabsContent value="pdf" className="space-y-4 pt-4">
            {!selectedFile ? (
              <label className="border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-muted/20 hover:bg-muted/30">
                <div className="p-4 rounded-full bg-primary/10 text-primary mb-3">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="font-medium text-foreground text-center">
                  Click to select a PDF menu or catalog
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported format: PDF document (Max 10 MB) • Digital text layers &amp; scanned OCR fallback supported
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'pdf')}
                  disabled={isProcessing}
                />
              </label>
            ) : (
              <div className="border rounded-xl p-4 bg-muted/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium text-sm text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for text extraction
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClearFile}
                  disabled={isProcessing}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: PASTED TEXT */}
          <TabsContent value="text" className="space-y-3 pt-4">
            <p className="text-xs text-muted-foreground">
              Paste your raw dish names, sections, descriptions, and prices copied from WhatsApp, Notes, or your existing menu:
            </p>
            <Textarea
              rows={8}
              placeholder={`Starters:
Paneer Tikka - Charcoal roasted with capsicum (Veg) - ₹280
Chicken Malai Tikka - Creamy cashew marinade - ₹320

Mains:
Butter Chicken (Half: ₹260, Full: ₹480)
Dal Makhani - Slow cooked black lentils - ₹220`}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              disabled={isProcessing}
              className="font-mono text-sm"
            />
          </TabsContent>

          {/* TAB 4: CSV */}
          <TabsContent value="csv" className="space-y-4 pt-4">
            {!selectedFile ? (
              <label className="border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-muted/20 hover:bg-muted/30">
                <div className="p-4 rounded-full bg-primary/10 text-primary mb-3">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <p className="font-medium text-foreground text-center">
                  Click to upload a menu spreadsheet (.csv)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported format: CSV (Max 2 MB) • Columns: Category, Name, Price, Veg, Description
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'csv')}
                  disabled={isProcessing}
                />
              </label>
            ) : (
              <div className="border rounded-xl p-4 bg-muted/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium text-sm text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB • CSV loaded
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClearFile}
                  disabled={isProcessing}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ERROR / RETRY NOTICE */}
        {errorMessage && (
          <div className="rounded-xl p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">OCR Notice</p>
                <p className="text-xs opacity-90 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleStartExtraction}
                className="text-xs h-7 border-destructive/30 hover:bg-destructive/10 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Extraction</span>
              </Button>
              {activeTab !== 'text' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveTab('text');
                    setErrorMessage(null);
                  }}
                  className="text-xs h-7 border-destructive/30 hover:bg-destructive/10 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Switch to Pasted Text Instead</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* PROGRESS BAR WITH REAL-TIME ELAPSED TICKER & CANCEL BUTTON */}
        {isProcessing && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                <span>{statusMessage}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 font-mono text-[11px] bg-muted px-2 py-0.5 rounded text-foreground">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {elapsedSeconds.toFixed(1)}s
                </span>
                <span className="font-semibold text-foreground">{uploadProgress}%</span>
              </div>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-muted-foreground">
                Local server-side engine running. Processing time depends on document size.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCancelExtraction()}
                className="text-xs h-7 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </Button>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            onClick={handleStartExtraction}
            disabled={
              isProcessing ||
              (activeTab === 'text' && !pastedText.trim()) ||
              (activeTab !== 'text' && !selectedFile)
            }
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Running Local OCR ({elapsedSeconds.toFixed(1)}s)...</span>
              </>
            ) : (
              <>
                <Scan className="h-4 w-4" />
                <span>Extract Menu (Local OCR)</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
