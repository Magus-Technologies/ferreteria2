import type { Metadata } from 'next'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import esES from 'antd/locale/es_ES'
import './globals.css'
import { Ubuntu } from 'next/font/google'
import Script from 'next/script'

const ubuntu = Ubuntu({ weight: ['400', '500', '700'], subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ferretería',
  description: 'Ferretería',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='es' className='overflow-y-hidden'>
      {process.env.NODE_ENV !== 'production' && (
        <head>
          <Script
            src='//unpkg.com/react-scan/dist/auto.global.js'
            strategy='afterInteractive'
            crossOrigin='anonymous'
          />
        </head>
      )}
      <body className={`antialiased overflow-y-hidden ${ubuntu.className}`}>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                fontSize: 13,
              },
            }}
            locale={esES}
          >
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
