import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Anywhere Door | Instant Universal File & Text Share',
  description: 'Share all file types, videos, documents, images, code snippets & text instantly across devices with PIN codes and QR codes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
        <footer className="py-6 border-t border-slate-800/60 text-center text-sm text-slate-500">
          <p>Anywhere Door &copy; 2026 • Universal Cross-Device File & Clipboard Hub</p>
        </footer>
      </body>
    </html>
  );
}
