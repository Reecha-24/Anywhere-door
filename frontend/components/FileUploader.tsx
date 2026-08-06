'use client';

import React, { useState, useRef } from 'react';
import { 
  UploadCloud, FileText, Image as ImageIcon, Video, Music, Code, Archive, 
  Trash2, Plus, File, CheckCircle2 
} from 'lucide-react';

interface FileUploaderProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  textContent: string;
  setTextContent: React.Dispatch<React.SetStateAction<string>>;
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getFileIcon(filename: string, mimeType?: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return <ImageIcon className="w-5 h-5 text-pink-400" />;
  if (['mp4', 'mkv', 'webm', 'mov', 'avi'].includes(ext)) return <Video className="w-5 h-5 text-purple-400" />;
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) return <Music className="w-5 h-5 text-emerald-400" />;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <Archive className="w-5 h-5 text-amber-400" />;
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'html', 'css', 'json'].includes(ext)) return <Code className="w-5 h-5 text-cyan-400" />;
  return <File className="w-5 h-5 text-indigo-400" />;
}

export default function FileUploader({ files, setFiles, textContent, setTextContent }: FileUploaderProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'text'>('files');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('files')}
          className={`pb-2.5 px-4 font-outfit text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'files'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Files ({files.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`pb-2.5 px-4 font-outfit text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'text'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Clipboard / Text Snippet</span>
        </button>
      </div>

      {activeTab === 'files' ? (
        <div className="space-y-4">
          {/* Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl p-8 border-2 border-dashed text-center transition-all ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/20 scale-[1.01]'
                : 'border-slate-700/80 bg-slate-900/40 hover:border-indigo-500/60 hover:bg-slate-900/60'
            }`}
          >
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="mx-auto w-14 h-14 rounded-full bg-slate-800/80 flex items-center justify-center mb-3 text-cyan-400 shadow-glow-cyan">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="font-outfit font-semibold text-lg text-white">
              Drag & Drop files here or <span className="text-cyan-400 underline">Browse</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports all file types (Documents, Images, Audio, Video, Code, Zip, Executables)
            </p>
          </div>

          {/* Queued files list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                <span>Selected Files</span>
                <button
                  type="button"
                  onClick={() => setFiles([])}
                  className="text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-900/70 border border-slate-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {getFileIcon(file.name)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            rows={7}
            placeholder="Paste text, code snippets, links, or messages to share..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>
      )}
    </div>
  );
}
