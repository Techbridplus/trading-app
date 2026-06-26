import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'YTManager — YouTube Multi-Channel Management Platform',
  description: 'Centralized management of multiple Google accounts and YouTube channels from a single premium dashboard.',
  keywords: ['YouTube', 'Channel Management', 'Multi-Account', 'SaaS', 'Dashboard'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}
