'use client';

import React, { useState, useRef } from 'react';
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
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Trash2,
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

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setStatusMessage('Preparing upload...');

    try {
      if (activeTab === 'text') {
        if (!pastedText.trim()) {
          setErrorMessage('Please paste your menu text before starting extraction.');
          setIsProcessing(false);
          return;
        }
        setStatusMessage('AI is analyzing menu text and organizing dishes...');
        setUploadProgress(50);

        const res = await extractMenuFromSource(restaurantId, {
          type: 'text',
          textContent: pastedText,
        });

        if (!res.success || !res.data) {
          throw new Error(res.error || 'Extraction failed');
        }

        setUploadProgress(100);
        setStatusMessage('Menu structured successfully!');
        onExtractionSuccess(res.data);
        return;
      }

      if (activeTab === 'csv') {
        if (!csvContent.trim()) {
          setErrorMessage('Please select a valid CSV file.');
          setIsProcessing(false);
          return;
        }
        setStatusMessage('AI is parsing spreadsheet rows into categories and dishes...');
        setUploadProgress(50);

        const res = await extractMenuFromSource(restaurantId, {
          type: 'csv',
          textContent: csvContent,
        });

        if (!res.success || !res.data) {
          throw new Error(res.error || 'CSV extraction failed');
        }

        setUploadProgress(100);
        setStatusMessage('Spreadsheet imported successfully!');
        onExtractionSuccess(res.data);
        return;
      }

      // For Image and PDF:
      if (!selectedFile) {
        setErrorMessage(`Please select a ${activeTab.toUpperCase()} file to upload.`);
        setIsProcessing(false);
        return;
      }

      setStatusMessage('Requesting secure Cloudflare R2 upload link...');
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
      setStatusMessage('Uploading document to Cloudflare R2 storage...');
      setUploadProgress(40);

      try {
        await fetch(uploadUrl, {
          method: 'PUT',
          body: selectedFile,
          headers: {
            'Content-Type': selectedFile.type,
          },
        });
      } catch (uploadErr) {
        console.warn('Direct R2 PUT failed (likely mock/local mode):', uploadErr);
      }

      // Convert to base64 for reliable server extraction
      setStatusMessage('Scanning document with Google Gemini multi-modal OCR...');
      setUploadProgress(70);

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          const commaIndex = res.indexOf(',');
          resolve(commaIndex !== -1 ? res.slice(commaIndex + 1) : res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      setStatusMessage('Structuring categories, prices, variants, and dietary tags...');
      setUploadProgress(85);

      const extractionRes = await extractMenuFromSource(restaurantId, {
        type: 'direct_base64',
        r2Key: key,
        mimeType: selectedFile.type,
        base64Data,
      });

      if (!extractionRes.success || !extractionRes.data) {
        throw new Error(extractionRes.error || 'Failed to extract menu from document.');
      }

      setUploadProgress(100);
      setStatusMessage('Extraction complete! Review your menu below.');
      onExtractionSuccess(extractionRes.data);
    } catch (err: any) {
      console.error('Extraction error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during extraction.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <CardTitle className="text-xl">Import Menu with Google Gemini AI</CardTitle>
        </div>
        <CardDescription>
          Upload a photo of your printed menu, a PDF brochure, a spreadsheet, or paste raw text.
          Gemini will automatically identify categories, items, prices, variants, and dietary badges.
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
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span>Image (Photo)</span>
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>PDF Document</span>
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Pasted Text</span>
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span>CSV File</span>
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
                  Supported formats: JPG, PNG, WebP (Max 10 MB)
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
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
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
                  Click to select a PDF menu or price sheet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported format: PDF document (Max 10 MB)
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
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI extraction
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
              Paste your raw dish names, sections, descriptions, and prices copied from WhatsApp, Notes, or your old website:
            </p>
            <Textarea
              rows={8}
              placeholder={`Starters:&#10;Paneer Tikka - ₹280 - Charcoal roasted with capsicum (Veg)&#10;Chicken Malai Tikka - ₹320 - Creamy cashew marinade&#10;&#10;Mains:&#10;Butter Chicken (Half: ₹260, Full: ₹480)&#10;Dal Makhani - ₹220`}
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
                  Supported format: CSV (Max 2 MB)
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

        {/* ERROR NOTICE */}
        {errorMessage && (
          <div className="rounded-lg p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Extraction Problem</p>
              <p className="text-xs opacity-90 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* PROGRESS BAR */}
        {isProcessing && (
          <div className="space-y-2 p-4 bg-muted/30 rounded-xl border border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                {statusMessage}
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            onClick={handleStartExtraction}
            disabled={
              isProcessing ||
              (activeTab === 'text' && !pastedText.trim()) ||
              (activeTab !== 'text' && !selectedFile)
            }
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Extract Menu with AI</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
