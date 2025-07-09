import type { Metadata } from 'next'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import esES from 'antd/locale/es_ES'
import './globals.css'
import { Ubuntu } from 'next/font/google'

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
    <html lang='es'>
      <body className={`antialiased ${ubuntu.className}`}>
        <AntdRegistry>
          <ConfigProvider locale={esES}>{children}</ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
