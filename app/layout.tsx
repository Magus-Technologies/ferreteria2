import type { Metadata } from 'next'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import esES from 'antd/locale/es_ES'
import './globals.css'

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
      <body className={`antialiased`}>
        <AntdRegistry>
          <ConfigProvider locale={esES}>{children}</ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
