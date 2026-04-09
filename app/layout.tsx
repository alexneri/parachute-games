import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Parachute — Game & Watch Recreation',
  description:
    'A pixel-faithful web recreation of the 1981 Nintendo Game & Watch Parachute (PR-21). Zero install. Open in browser. Play instantly.',
  keywords: ['game and watch', 'parachute', 'nintendo', 'retro', 'lcd game'],
  authors: [{ name: 'Parachute Game Contributors' }],
  openGraph: {
    title: 'Parachute — Game & Watch Recreation',
    description: 'Play the classic 1981 Nintendo Game & Watch Parachute in your browser.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a1a1a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
