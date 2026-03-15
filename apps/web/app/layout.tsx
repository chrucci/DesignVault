import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Design Vault',
  description: 'Product clipping, project management, and PDF generation for interior decorators',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
