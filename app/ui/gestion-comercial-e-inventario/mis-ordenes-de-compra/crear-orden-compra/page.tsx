'use client'

import dynamic from 'next/dynamic'
import { Spin } from 'antd'

const BodyCrearOrdenCompra = dynamic(
  () => import('./_components/others/body-crear-orden-compra'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-40">
        <Spin size="large" />
      </div>
    ),
  },
)

export default function CrearOrdenCompraPage() {
  return <BodyCrearOrdenCompra />
}
