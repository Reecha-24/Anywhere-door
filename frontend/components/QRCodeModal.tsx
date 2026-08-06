'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, QrCode } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  code: string;
}

export default function QRCodeModal({ isOpen, onClose, shareUrl, code }: QRCodeModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const copyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm glass-panel rounded-3xl p-6 border border-slate-700/80 text-center space-y-5 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center gap-2 text-cyan-400">
          <QrCode className="w-6 h-6" />
          <h3 className="font-outfit font-bold text-lg text-white">Scan Mobile QR Code</h3>
        </div>

        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-2xl inline-block mx-auto shadow-glow-cyan">
          <QRCodeSVG value={shareUrl} size={180} level="H" includeMargin={true} />
        </div>

        <div>
          <p className="text-xs text-slate-400">Share PIN Code</p>
          <p className="font-mono font-bold text-2xl tracking-widest text-indigo-400">{code}</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="w-full bg-transparent text-xs font-mono text-slate-300 focus:outline-none px-2 truncate"
          />
          <button
            onClick={copyUrl}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
