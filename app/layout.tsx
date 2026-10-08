import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CallMissed AI Studio',
  description:
    'Unified AI workspace for text chat, image generation, and real-time voice interaction — exclusively powered by CallMissed.',
  keywords: ['CallMissed', 'AI Voice Agent', 'WebRTC', 'Text Chat', 'Image Generation', 'Next.js'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" style={{ background: '#ffffff', color: '#000000' }}>
      <body
        className="min-h-full flex flex-col"
        style={{
          background: '#ffffff',
          color: '#000000',
          fontFamily:
            "'Labil Grotesk', 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          letterSpacing: '-0.01em',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {children}
      </body>
    </html>
  );
}
