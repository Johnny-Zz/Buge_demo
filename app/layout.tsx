import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: '不鸽 - 校园AI智能助手',
  description: '不鸽 AI Agent - 智能解析校园信息，告别信息过载',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

// Global Demo Disclaimer Banner - Click-through watermark at bottom
function DemoDisclaimer() {
  return (
    <div className="fixed bottom-2 left-0 w-full z-[100] pointer-events-none flex justify-center">
      <span className="text-[10px] text-gray-400/50 tracking-wide select-none">
        Demo仅为前端功能展示，并非接入AI的最终版本
      </span>
    </div>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="font-sans antialiased bg-background">
        <DemoDisclaimer />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
