import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CallMissed AI Workspace',
  description:
    'A unified, restrained AI workspace for text chat, image generation, and real-time voice interaction powered exclusively by CallMissed.',
  keywords: ['CallMissed', 'AI Voice Agent', 'WebRTC', 'Text Chat', 'Image Generation', 'Next.js'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-white text-[#0d0d0d]">
      <body className="min-h-full flex flex-col bg-white text-[#0d0d0d] font-sans">
        {children}
      </body>
    </html>
  );
}
