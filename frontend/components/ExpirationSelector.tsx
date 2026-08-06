'use client';

import React from 'react';
import { Clock, DownloadCloud, Lock, Hash, ShieldAlert } from 'lucide-react';

interface ExpirationSelectorProps {
  expiresInMinutes: number;
  setExpiresInMinutes: (val: number) => void;
  maxDownloads: number;
  setMaxDownloads: (val: number) => void;
  customCode: string;
  setCustomCode: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
}

export default function ExpirationSelector({
  expiresInMinutes,
  setExpiresInMinutes,
  maxDownloads,
  setMaxDownloads,
  customCode,
  setCustomCode,
  password,
  setPassword,
}: ExpirationSelectorProps) {
  return (
    <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4">
      <h4 className="font-outfit font-semibold text-sm text-slate-300 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-cyan-400" />
        <span>Share Settings & Expiration Controls</span>
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expiration Time */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Auto Expiration</span>
          </label>
          <select
            value={expiresInMinutes}
            onChange={(e) => setExpiresInMinutes(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value={10}>10 Minutes</option>
            <option value={60}>1 Hour (Default)</option>
            <option value={1440}>24 Hours</option>
            <option value={10080}>7 Days</option>
            <option value={-1}>Never Expire</option>
          </select>
        </div>

        {/* Max Downloads Self-Destruct */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <DownloadCloud className="w-3.5 h-3.5 text-purple-400" />
            <span>Self-Destruct Download Limit</span>
          </label>
          <select
            value={maxDownloads}
            onChange={(e) => setMaxDownloads(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value={-1}>Unlimited Downloads</option>
            <option value={1}>Self-Destruct after 1 Download</option>
            <option value={5}>Self-Destruct after 5 Downloads</option>
            <option value={10}>Self-Destruct after 10 Downloads</option>
          </select>
        </div>

        {/* Custom Room PIN / Slug */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-amber-400" />
            <span>Custom PIN / Alias (Optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. MYROOM (Auto-generated if empty)"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
            maxLength={10}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm font-mono text-slate-200 uppercase placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Password Protection */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>Passcode Lock (Optional)</span>
          </label>
          <input
            type="password"
            placeholder="Set room password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}
