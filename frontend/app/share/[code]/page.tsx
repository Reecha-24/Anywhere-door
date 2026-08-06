'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Download, Archive, Copy, Check, Eye, Clock, Lock, ShieldAlert, 
  QrCode, FileText, File, Sparkles, Loader2, RefreshCw, UploadCloud, Play
} from 'lucide-react';
import { formatBytes, getFileIcon } from '@/components/FileUploader';
import FilePreviewer from '@/components/FilePreviewer';
import QRCodeModal from '@/components/QRCodeModal';

interface FileDetail {
  file_id: string;
  filename: string;
  file_size: number;
  content_type: string;
  download_url: string;
}

interface ShareData {
  code: string;
  text_content: string | null;
  files: FileDetail[];
  created_at: string;
  expires_at: string | null;
  max_downloads: number;
  current_downloads: number;
  is_protected: boolean;
  views_count: number;
  is_expired: boolean;
}

export default function ShareRoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string)?.toUpperCase();

  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Passcode modal
  const [password, setPassword] = useState('');
  const [authRequired, setAuthRequired] = useState(false);
  const [authError, setAuthError] = useState('');

  // Copy states
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // File Preview modal
  const [previewFile, setPreviewFile] = useState<FileDetail | null>(null);

  // Add files to existing room
  const [addingFiles, setAddingFiles] = useState(false);

  const fetchShareData = async (pw?: string) => {
    setLoading(true);
    setErrorMsg('');
    setAuthError('');

    try {
      let url = `/api/v1/shares/${code}`;
      if (pw) {
        url += `?password=${encodeURIComponent(pw)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 410) {
          setErrorMsg('This share room has expired or reached its maximum download limit.');
        } else {
          setErrorMsg(data.detail || 'Share room not found.');
        }
        setLoading(false);
        return;
      }

      if (data.is_protected && !data.files.length && !data.text_content) {
        setAuthRequired(true);
      } else {
        setAuthRequired(false);
        setShareData(data);
      }
    } catch (err: any) {
      setErrorMsg('Failed to connect to room server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) {
      fetchShareData();
    }
  }, [code]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      fetchShareData(password);
    }
  };

  const copyTextContent = () => {
    if (shareData?.text_content) {
      navigator.clipboard.writeText(shareData.text_content);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAddingFiles(true);
      const formData = new FormData();
      Array.from(e.target.files).forEach((f) => formData.append('files', f));
      if (password) formData.append('password', password);

      try {
        const res = await fetch(`/api/v1/files/upload/${code}`, {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          fetchShareData(password);
        } else {
          alert('Failed to upload additional files.');
        }
      } catch (err) {
        alert('Upload error.');
      } finally {
        setAddingFiles(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        <p className="text-sm font-medium text-slate-400">Opening Share Room {code}...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto py-12 text-center glass-panel p-8 rounded-3xl border border-rose-900/60 space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="font-outfit font-bold text-xl text-white">Access Error</h2>
        <p className="text-sm text-slate-400">{errorMsg}</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  if (authRequired) {
    return (
      <div className="max-w-md mx-auto py-12 glass-panel p-8 rounded-3xl border border-indigo-900/60 space-y-6 text-center shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-700 text-rose-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-outfit font-bold text-xl text-white">Passcode Protected Room</h2>
          <p className="text-xs text-slate-400 mt-1">Enter the password set by the creator to view files.</p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Enter password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          {authError && <p className="text-xs text-rose-400">{authError}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
          >
            Unlock Share Room
          </button>
        </form>
      </div>
    );
  }

  if (!shareData) return null;

  const zipDownloadUrl = `/api/v1/files/zip/${code}${password ? `?password=${encodeURIComponent(password)}` : ''}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Share Room</span>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-[10px] font-mono font-bold">
              PIN: {shareData.code}
            </span>
          </div>
          <h1 className="font-outfit font-extrabold text-2xl sm:text-3xl text-white flex items-center gap-2">
            <span>Room {shareData.code}</span>
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={copyShareLink}
            className="px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
            <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
          </button>

          <button
            onClick={() => setShowQR(true)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Mobile QR</span>
          </button>

          {shareData.files.length > 1 && (
            <a
              href={zipDownloadUrl}
              download
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-glow transition-all"
            >
              <Archive className="w-4 h-4" />
              <span>Download All (.ZIP)</span>
            </a>
          )}
        </div>
      </div>

      {/* Room Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center gap-3">
          <Eye className="w-5 h-5 text-indigo-400" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Views</p>
            <p className="text-sm font-bold text-white">{shareData.views_count} views</p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center gap-3">
          <Download className="w-5 h-5 text-purple-400" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Downloads</p>
            <p className="text-sm font-bold text-white">
              {shareData.current_downloads} {shareData.max_downloads > 0 ? `/ ${shareData.max_downloads}` : ''}
            </p>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center gap-3">
          <Clock className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Expiration</p>
            <p className="text-xs font-semibold text-slate-200">
              {shareData.expires_at ? new Date(shareData.expires_at).toLocaleString() : 'Never Expire'}
            </p>
          </div>
        </div>
      </div>

      {/* Text / Clipboard Snippet Section */}
      {shareData.text_content && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-outfit font-semibold text-sm text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Shared Text / Code Snippet</span>
            </h3>
            <button
              onClick={copyTextContent}
              className="px-3 py-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1 hover:bg-slate-800 transition-all"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {shareData.text_content}
          </pre>
        </div>
      )}

      {/* Shared Files List Section */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-outfit font-semibold text-base text-white flex items-center gap-2">
            <File className="w-5 h-5 text-indigo-400" />
            <span>Shared Files ({shareData.files.length})</span>
          </h3>

          <label className="cursor-pointer px-3 py-1.5 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-indigo-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all">
            {addingFiles ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
            <span>{addingFiles ? 'Uploading...' : 'Add Files'}</span>
            <input type="file" multiple onChange={handleAddFiles} className="hidden" />
          </label>
        </div>

        {shareData.files.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No file attachments in this share room.</p>
        ) : (
          <div className="space-y-3">
            {shareData.files.map((file) => {
              const fileDownloadUrl = `${file.download_url}${password ? `?password=${encodeURIComponent(password)}` : ''}`;
              const filePreviewUrl = `/api/v1/files/preview/${code}/${file.file_id}${password ? `?password=${encodeURIComponent(password)}` : ''}`;

              return (
                <div
                  key={file.file_id}
                  className="glass-card p-4 rounded-2xl flex items-center justify-between gap-4 border border-slate-800/80"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
                      {getFileIcon(file.filename, file.content_type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{file.filename}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{formatBytes(file.file_size)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setPreviewFile(file)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Preview</span>
                    </button>

                    <a
                      href={fileDownloadUrl}
                      download
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-all shadow-glow"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Modal */}
      <QRCodeModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
        code={shareData.code}
      />

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewer
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          filename={previewFile.filename}
          contentType={previewFile.content_type}
          previewUrl={`/api/v1/files/preview/${code}/${previewFile.file_id}${password ? `?password=${encodeURIComponent(password)}` : ''}`}
          downloadUrl={`${previewFile.download_url}${password ? `?password=${encodeURIComponent(password)}` : ''}`}
        />
      )}
    </div>
  );
}
