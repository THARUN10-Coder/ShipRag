import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SHIPRAG — Autonomous Production RAG Pipeline & Deployment Platform',
  description: 'Your GitHub Repository. Now an AI-Native Codebase. Understand, debug, review, and deploy your codebase with grounded AI.',
};

import { AuthProvider } from '@/context/auth-context';
import { SettingsProvider } from '@/context/settings-context';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#FFFAF3] text-[#211c1d] antialiased selection:bg-[#FFE5BF] selection:text-[#F62440]">
        <AuthProvider>
          <SettingsProvider>{children}</SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
