'use client'

import { useState } from 'react'
import { Form, Tooltip, Badge, Tag } from 'antd'
import { FaTicketAlt } from 'react-icons/fa'
import dynamic from 'next/dynamic'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'
import { useStoreValeForm } from '../../_store/store-vale-form'
import type { ValeCompra } from '~/lib/api/vales-compra'

const ModalCanjearVale = dynamic(
  () => import('../modals/modal-canjear-vale'),
  { ssr: false },
)

/**
 * Versión para el header que lee el form desde el store.
 * Siempre llama los hooks en el mismo orden (no hay form como prop).
 */
export default function BotonCanjearValeHeader() {
  const [open, setOpen] = useState(false)
  const storeForm = useStoreValeForm((s) => s.form)
  const codigoActual = Form.useWatch('codigo_vale', storeForm ?? undefined)
  const setValesAplicables = useStoreProductoAgregadoVenta((s) => s.setValesAplicables)
  const valesActuales = useStoreProductoAgregadoVenta((s) => s.valesAplicables)

  return (
    <div className='flex items-center gap-2'>
      <Tooltip title='Canjear código de vale (sorteo o próxima compra)'>
        <Badge dot={!!codigoActual} color='green' offset={[-4, 4]}>
          <button
            type='button'
            onClick={() => setOpen(true)}
            className='flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors cursor-pointer border border-orange-300'
            aria-label='Canjear código de vale'
          >
            <FaTicketAlt size={18} />
          </button>
        </Badge>
      </Tooltip>

      {codigoActual && (
        <Tag color='green' className='!m-0'>
          {codigoActual}
        </Tag>
      )}

      <ModalCanjearVale
        form={storeForm}
        open={open}
        setOpen={setOpen}
        codigoActual={codigoActual}
        onAplicar={(codigo, info) => {
          if (storeForm) storeForm.setFieldValue('codigo_vale', codigo)
          if (info?.vale_compra && !valesActuales.some(v => v.id === info.vale_compra.id)) {
            const v = info.vale_compra
            const valeParaStore: ValeCompra = {
              id: v.id,
              codigo: v.codigo,
              nombre: v.nombre,
              descripcion: null,
              tipo_promocion: v.tipo_promocion as any,
              momento_aplicacion: (v.momento_aplicacion ?? 'MISMA_COMPRA') as any,
              modalidad: v.modalidad as any,
              cantidad_minima: v.cantidad_minima,
              descuento_tipo: (v.descuento_tipo ?? null) as any,
              descuento_valor: v.descuento_valor ?? null,
              producto_gratis_id: (v as any).producto_gratis?.id ?? null,
              cantidad_producto_gratis: (v as any).cantidad_producto_gratis ?? 0,
              fecha_inicio: v.fecha_inicio,
              fecha_fin: v.fecha_fin ?? null,
              fecha_validez_vale: null,
              usa_limite_por_cliente: false,
              limite_usos_cliente: null,
              usa_limite_stock: false,
              stock_disponible: null,
              aplica_precio_publico: true,
              aplica_precio_especial: true,
              aplica_precio_minimo: true,
              aplica_precio_ultimo: true,
              estado: 'ACTIVO' as any,
              created_by: null,
              updated_by: null,
              created_at: '',
              updated_at: '',
              producto_gratis: (v as any).producto_gratis ?? null,
              categorias: (v as any).categorias ?? [],
              productos: (v as any).productos ?? [],
            }
            setValesAplicables([...valesActuales, valeParaStore])
          }
        }}
        onQuitar={(codigo) => {
          if (storeForm) storeForm.setFieldValue('codigo_vale', undefined)
          const codigoQuitar = codigo || codigoActual
          if (codigoQuitar) {
            const removido = valesActuales.filter(v => v.codigo !== codigoQuitar)
            if (removido.length !== valesActuales.length) {
              setValesAplicables(removido)
            }
          }
        }}
      />
    </div>
  )
}
