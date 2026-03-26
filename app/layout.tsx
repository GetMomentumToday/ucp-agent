import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UCP Agent',
  description: 'AI shopping assistant powered by the Universal Commerce Protocol',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
