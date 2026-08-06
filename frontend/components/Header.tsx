'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, ArrowRight, Sparkles, FolderUp } from 'lucide-react';

export default function Header() {
  const [pin, setPin] = useState('');
  const router = useRouter();

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim()) {
      router.push(`/share/${pin.trim().toUpperCase()}`);
      setPin('');
    }
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-purple-500 p-0.5 shadow-glow">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <FolderUp className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <span className="font-outfit font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
              Anywhere<span className="gradient-text">Door</span>
            </span>
            <span className="text-[10px] text-slate-400 block -mt-1 tracking-wider uppercase">File & Text Share</span>
          </div>
        </Link>

        {/* Quick PIN lookup form */}
        <form onSubmit={handleLookup} className="flex items-center gap-2">
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter 6-digit PIN..."
              value={pin}
              onChange={(e) => setPin(e.target.value.toUpperCase())}
              maxLength={10}
              className="w-36 sm:w-48 pl-9 pr-3 py-1.5 bg-slate-900/80 border border-slate-700/80 rounded-lg text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase tracking-wider"
            />
          </div>
          <button
            type="submit"
            disabled={!pin.trim()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-all"
          >
            <span>Open</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </header>
  );
}
