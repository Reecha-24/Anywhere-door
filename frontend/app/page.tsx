'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, KeyRound, ArrowRight, Check, Copy, QrCode, 
  ShieldCheck, UploadCloud, FileText, Share2, Loader2 
} from 'lucide-react';
import FileUploader, { formatBytes } from '@/components/FileUploader';
import ExpirationSelector from '@/components/ExpirationSelector';
import QRCodeModal from '@/components/QRCodeModal';

export default function HomePage() {
  const router = useRouter();
  
  // State
  const [files, setFiles] = useState<File[]>([]);
  const [textContent, setTextContent] = useState('');
  const [expiresInMinutes, setExpiresInMinutes] = useState(60);
  const [maxDownloads, setMaxDownloads] = useState(-1);
  const [customCode, setCustomCode] = useState('');
  const [password, setPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Created share state
  const [createdShare, setCreatedShare] = useState<{
    code: string;
    shareUrl: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 && !textContent.trim()) {
      setErrorMsg('Please select at least one file or enter text content to share.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Step 1: Create share record
      const shareRes = await fetch('/api/v1/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text_content: textContent.trim() || null,
          custom_code: customCode.trim() || null,
          password: password || null,
          expires_in_minutes: expiresInMinutes,
          max_downloads: maxDownloads,
        }),
      });

      const shareData = await shareRes.json();
      if (!shareRes.ok) {
        throw new Error(shareData.detail || 'Failed to create share room.');
      }

      const code = shareData.code;

      // Step 2: Upload files if any
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((f) => formData.append('files', f));
        if (password) formData.append('password', password);

        const uploadRes = await fetch(`/api/v1/files/upload/${code}`, {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.detail || 'Failed to upload files.');
        }
      }

      const shareUrl = `${window.location.origin}/share/${code}`;
      setCreatedShare({ code, shareUrl });
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while creating share.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, type: 'code' | 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="space-y-10 py-4">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-xs font-semibold text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Universal Cross-Device Sharing • All File Formats</span>
        </div>
        <h1 className="font-outfit font-extrabold text-4xl sm:text-5xl tracking-tight text-white leading-tight">
          Share files & text instantly with <span className="gradient-text">Anywhere Door</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          No login needed. Upload documents, videos, code, audio or archives and access them instantly on mobile, laptop, or desktop using a simple 6-digit PIN code or QR code.
        </p>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto">
        {createdShare ? (
          /* Created Share Success Card */
          <div className="glass-panel p-8 rounded-3xl border border-indigo-500/30 space-y-6 text-center shadow-glow">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="font-outfit font-bold text-2xl text-white">Share Room Created!</h2>
              <p className="text-sm text-slate-400">Use the PIN code or shareable URL below to access your files anywhere.</p>
            </div>

            {/* PIN Code Highlight Box */}
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Your Share PIN Code</p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono font-extrabold text-4xl sm:text-5xl text-cyan-400 tracking-wider">
                  {createdShare.code}
                </span>
                <button
                  onClick={() => copyToClipboard(createdShare.code, 'code')}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all"
                  title="Copy Code"
                >
                  {copiedCode ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Share Link & QR Code actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => copyToClipboard(createdShare.shareUrl, 'url')}
                className="py-3 px-4 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-indigo-400" />}
                <span>{copiedUrl ? 'Link Copied!' : 'Copy Share Link'}</span>
              </button>

              <button
                onClick={() => setShowQR(true)}
                className="py-3 px-4 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Show Mobile QR Code</span>
              </button>
            </div>

            <div className="pt-2 flex items-center justify-center gap-4">
              <button
                onClick={() => router.push(`/share/${createdShare.code}`)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl flex items-center gap-2 transition-all"
              >
                <span>Open Share Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setCreatedShare(null);
                  setFiles([]);
                  setTextContent('');
                }}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl transition-all"
              >
                Create New Share
              </button>
            </div>
          </div>
        ) : (
          /* Form Container */
          <form onSubmit={handleCreateShare} className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl">
            <FileUploader
              files={files}
              setFiles={setFiles}
              textContent={textContent}
              setTextContent={setTextContent}
            />

            <ExpirationSelector
              expiresInMinutes={expiresInMinutes}
              setExpiresInMinutes={setExpiresInMinutes}
              maxDownloads={maxDownloads}
              setMaxDownloads={setMaxDownloads}
              customCode={customCode}
              setCustomCode={setCustomCode}
              password={password}
              setPassword={setPassword}
            />

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 via-cyan-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white font-outfit font-bold text-base rounded-2xl flex items-center justify-center gap-2 shadow-glow transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing & Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5" />
                  <span>Generate Share Room & PIN Code</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* QR Modal */}
      {createdShare && (
        <QRCodeModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          shareUrl={createdShare.shareUrl}
          code={createdShare.code}
        />
      )}
    </div>
  );
}
