'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, FileText, Loader2 } from 'lucide-react';

interface FilePreviewerProps {
  isOpen: boolean;
  onClose: () => void;
  filename: string;
  contentType: string;
  previewUrl: string;
  downloadUrl: string;
}

export default function FilePreviewer({
  isOpen,
  onClose,
  filename,
  contentType,
  previewUrl,
  downloadUrl,
}: FilePreviewerProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isImage = contentType.startsWith('image/');
  const isVideo = contentType.startsWith('video/');
  const isAudio = contentType.startsWith('audio/');
  const isPdf = contentType === 'application/pdf';
  const isTextOrCode = contentType.startsWith('text/') || 
                       contentType.includes('json') || 
                       contentType.includes('javascript') || 
                       contentType.includes('python');

  useEffect(() => {
    if (isOpen && isTextOrCode) {
      setLoading(true);
      fetch(previewUrl)
        .then((res) => res.text())
        .then((data) => {
          setTextContent(data);
          setLoading(false);
        })
        .catch(() => {
          setTextContent('Failed to load text preview.');
          setLoading(false);
        });
    }
  }, [isOpen, previewUrl, isTextOrCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] glass-panel rounded-3xl p-6 border border-slate-700/80 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="min-w-0 pr-4">
            <h3 className="font-outfit font-semibold text-lg text-white truncate">{filename}</h3>
            <p className="text-xs text-slate-400 font-mono">{contentType}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto flex items-center justify-center min-h-[300px] bg-slate-950/60 rounded-2xl border border-slate-800/60 p-4">
          {isImage && (
            <img
              src={previewUrl}
              alt={filename}
              className="max-h-[70vh] max-w-full object-contain rounded-lg"
            />
          )}

          {isVideo && (
            <video controls autoPlay className="max-h-[70vh] w-full rounded-lg">
              <source src={previewUrl} type={contentType} />
              Your browser does not support video playback.
            </video>
          )}

          {isAudio && (
            <div className="w-full max-w-md p-6 bg-slate-900 rounded-2xl text-center space-y-4">
              <p className="text-sm font-medium text-slate-300">{filename}</p>
              <audio controls className="w-full">
                <source src={previewUrl} type={contentType} />
              </audio>
            </div>
          )}

          {isPdf && (
            <iframe
              src={previewUrl}
              className="w-full h-[65vh] rounded-lg border-0"
              title={filename}
            />
          )}

          {isTextOrCode && (
            loading ? (
              <div className="flex items-center gap-2 text-indigo-400 text-sm">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading preview...</span>
              </div>
            ) : (
              <pre className="w-full h-full max-h-[65vh] overflow-auto text-xs font-mono text-slate-200 bg-slate-900 p-4 rounded-xl whitespace-pre-wrap">
                {textContent}
              </pre>
            )
          )}

          {!isImage && !isVideo && !isAudio && !isPdf && !isTextOrCode && (
            <div className="text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">Direct preview not supported for this file type.</p>
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
              >
                <Download className="w-4 h-4" />
                <span>Download to view ({filename})</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
