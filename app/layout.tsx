import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CiteIQ - AI Search Visibility',
  description: 'Track and monitor your AI visibility, rankings, and recommendations',
  generator: 'v0.app',
  icons: {
    icon: {
      url: '/mascot-robot.svg',
      type: 'image/svg+xml',
    },
    apple: '/mascot-robot.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased" style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
        <AuthProvider>
          {children}
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
