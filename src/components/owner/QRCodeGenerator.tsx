'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, FileCode, Copy, Check, ExternalLink } from 'lucide-react';

interface QRCodeGeneratorProps {
  restaurantName: string;
  slug: string;
  primaryColor?: string;
}

export function QRCodeGenerator({
  restaurantName,
  slug,
  primaryColor = '#8B4A27',
}: QRCodeGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // In production / domain setup, URL is https://zaaykatech.com/r/[slug]
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://zaaykatech.com';
  const publicUrl = `${origin}/r/${slug}`;

  useEffect(() => {
    async function generateQR() {
      try {
        const url = await QRCode.toDataURL(publicUrl, {
          width: 512,
          margin: 2,
          color: {
            dark: '#1C1917',
            light: '#FFFFFF',
          },
        });
        setQrDataUrl(url);

        // Also render onto print template canvas
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, publicUrl, {
            width: 320,
            margin: 1,
            color: {
              dark: '#1C1917',
              light: '#FFFFFF',
            },
          });
        }
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    }
    generateQR();
  }, [publicUrl]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadPNG = async () => {
    // Generate high-res 1024x1280 branded printable PNG
    const printCanvas = document.createElement('canvas');
    printCanvas.width = 1024;
    printCanvas.height = 1280;
    const ctx = printCanvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, 1024, 1280);

    // Inner Card
    ctx.fillStyle = '#FFFFFF';
    ctx.roundRect(64, 64, 896, 1152, 48);
    ctx.fill();

    // Top Brand Banner
    ctx.fillStyle = primaryColor;
    ctx.roundRect(64, 64, 896, 180, [48, 48, 0, 0]);
    ctx.fill();

    // Restaurant Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 54px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(restaurantName, 512, 160);

    // Prompt Header
    ctx.fillStyle = '#44403C';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('SCAN FOR DIGITAL MENU', 512, 340);

    ctx.fillStyle = '#78716C';
    ctx.font = '26px sans-serif';
    ctx.fillText('Point your phone camera to view our dishes & specials', 512, 390);

    // High-Res QR code
    const qrImage = new Image();
    qrImage.src = await QRCode.toDataURL(publicUrl, {
      width: 580,
      margin: 1,
      color: { dark: '#1C1917', light: '#FFFFFF' },
    });

    qrImage.onload = () => {
      ctx.drawImage(qrImage, 222, 450, 580, 580);

      // Footer
      ctx.fillStyle = '#A8A29E';
      ctx.font = '22px sans-serif';
      ctx.fillText(`Powered by ZaaykaTech • ${publicUrl}`, 512, 1140);

      // Trigger download
      const link = document.createElement('a');
      link.download = `${slug}-qr-menu.png`;
      link.href = printCanvas.toDataURL('image/png');
      link.click();
    };
  };

  const downloadSVG = async () => {
    try {
      const svgString = await QRCode.toString(publicUrl, {
        type: 'svg',
        margin: 2,
        color: { dark: '#1C1917', light: '#FFFFFF' },
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const link = document.createElement('a');
      link.download = `${slug}-qr-code.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
    } catch (err) {
      console.error('Failed to export SVG:', err);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-[#8B4A27]/10 text-[#8B4A27] mb-2">
          <QrCode className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
          Restaurant QR Code Center
        </h2>
        <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
          Display this QR code on dining tables, counter standees, or takeout packaging for instant instant contact-free menu viewing.
        </p>
      </div>

      {/* QR Code Standee Preview Card */}
      <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-3xl p-6 sm:p-8 text-center max-w-sm mx-auto shadow-inner flex flex-col items-center">
        <div
          className="w-full py-3 px-4 rounded-2xl text-white font-serif font-bold text-lg mb-4 shadow-sm"
          style={{ backgroundColor: primaryColor }}
        >
          {restaurantName}
        </div>

        <p className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-1">
          Scan for Digital Menu
        </p>
        <p className="text-[11px] text-stone-400 mb-4">Instant load • No app download required</p>

        {/* Canvas Render */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200/80 mb-4">
          <canvas ref={canvasRef} className="rounded-xl w-56 h-56" />
        </div>

        <span className="text-[10px] text-stone-400 font-medium">
          Powered by <strong className="text-stone-700">ZaaykaTech</strong>
        </span>
      </div>

      {/* Public Link Box */}
      <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 pl-1">
          <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
            Public Live Link
          </span>
          <p className="text-xs font-mono text-stone-800 truncate">{publicUrl}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={copyToClipboard}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all apple-press flex items-center gap-1.5 shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-xl transition-all apple-press"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Download Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={downloadPNG}
          className="py-3 px-4 bg-[#4338CA] hover:bg-[#3730A3] active:bg-[#312E81] text-white text-xs font-bold rounded-2xl shadow-sm transition-all apple-press flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Print-Ready PNG (1024px)</span>
        </button>

        <button
          onClick={downloadSVG}
          className="py-3 px-4 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold rounded-2xl shadow-xs transition-all apple-press flex items-center justify-center gap-2"
        >
          <FileCode className="w-4 h-4 text-stone-600" />
          <span>Download Vector SVG</span>
        </button>
      </div>
    </div>
  );
}
