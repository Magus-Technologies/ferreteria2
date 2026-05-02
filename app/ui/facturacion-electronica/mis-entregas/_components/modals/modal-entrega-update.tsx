'use client'

import { useEffect, useMemo, useState } from 'react'
import { Form, Modal } from 'antd'
import useApp from 'antd/es/app/useApp'
import { useQueryClient } from '@tanstack/react-query'
import { FaExchangeAlt, FaFilePdf } from 'react-icons/fa'
import dayjs from 'dayjs'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { entregaProductoApi, TipoEntrega, EstadoEntrega, TipoDespacho } from '~/lib/api/entrega-producto'
import ModalDetallesEntrega from '../../../mis-ventas/crear-venta/_components/modals/modal-detalles-entrega'
import ModalSeleccionarTipoDespacho from '../../../mis-ventas/crear-venta/_components/modals/modal-seleccionar-tipo-despacho'
import type {
  SeccionOcultable,
  TipoDespachoUI,
} from '../../../mis-ventas/crear-venta/_components/modals/detalles-entrega/types'
import type { ProductoEntrega } from '../../../mis-ventas/_hooks/use-productos-entrega'
import { useStoreModalPdfEntrega } from '../../_store/store-modal-pdf-entrega'
import ButtonBase from '~/components/buttons/button-base'
import TitleForm from '~/components/form/title-form'

interface ModalEntregaUpdateProps {
  open: boolean
  setOpen: (open: boolean) => void
  entrega?: any
  onSuccess?: () => void
  restante?: boolean
}

export default function ModalEntregaUpdate({
  open,
  setOpen,
  entrega,
  onSuccess,
  restante,
}: ModalEntregaUpdateProps) {
  const [form] = Form.useForm()
  const { message } = useApp()
  const queryClient = useQueryClient()
  const [modalSeleccionarTipoOpen, setModalSeleccionarTipoOpen] = useState(false)
  const openPdfModal = useStoreModalPdfEntrega((s) => s.openModal)
  const [creandoRestante, setCreandoRestante] = useState(false)

  const handleSelectTipoDespacho = async (tipo: 'EnTienda' | 'Domicilio' | 'Parcial') => {
    const nuevoTipo: TipoEntrega =
      tipo === 'EnTienda' ? TipoEntrega.RECOJO_EN_TIENDA
        : tipo === 'Domicilio' ? TipoEntrega.DESPACHO
        : TipoEntrega.PARCIAL

    if (!entrega) return
    if (nuevoTipo === entrega.tipo_entrega) {
      message.info('La entrega ya es de ese tipo')
      return
    }

    try {
      const response = await entregaProductoApi.update(entrega.id, { tipo_entrega: nuevoTipo })
      if (response.error) {
        message.error(response.error.message || 'Error al cambiar tipo de entrega')
        return
      }
      const labelNuevo = tipo === 'EnTienda' ? 'Recojo en Tienda'
        : tipo === 'Domicilio' ? 'Despacho a Domicilio' : 'Despacho Parcial'
      message.success(`Tipo de entrega cambiado a ${labelNuevo}`)
      setModalSeleccionarTipoOpen(false)
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      onSuccess?.()
    } catch (err: any) {
      message.error(err?.message || 'Error al cambiar tipo de entrega')
    }
  }

  useEffect(() => {
    if (!open || !entrega) return
    form.setFieldsValue({
      quien_entrega: entrega.quien_entrega || 'almacen',
      observaciones: entrega.observaciones || '',
      despachador_id: entrega.chofer_id || undefined,
      tipo_pedido: entrega.tipo_pedido || 'interno',
      cargo_destino: entrega.cargo_destino || undefined,
      fecha_programada: entrega.fecha_programada ? dayjs(entrega.fecha_programada).format('YYYY-MM-DD') : undefined,
      hora_inicio: entrega.hora_inicio || undefined,
      hora_fin: entrega.hora_fin || undefined,
      direccion_entrega: entrega.direccion_entrega || '',
      referencia_entrega: entrega.referencia_entrega || '',
      latitud: entrega.latitud != null ? Number(entrega.latitud) : undefined,
      longitud: entrega.longitud != null ? Number(entrega.longitud) : undefined,
      vehiculo_id: entrega.vehiculo_id || undefined,
    })
  }, [open, entrega, form])

  const productosIniciales: ProductoEntrega[] = useMemo(() => {
    if (!entrega?.productos_entregados) return []

    if (restante) {
      return entrega.productos_entregados
        .map((p: any, index: number) => {
          const ud = p.unidad_derivada_venta || {}
          const pav = ud.producto_almacen_venta || {}
          const prod = pav.producto_almacen?.producto || {}
          const pendiente = Number(ud.cantidad_pendiente || 0)
          if (pendiente <= 0) return null
          return {
            id: index + 1,
            producto: prod.name || p.producto_name || '',
            ubicacion: '',
            total: pendiente,
            entregado: 0,
            pendiente,
            entregar: pendiente,
            entregar_programado: 0,
            unidad_derivada_venta_id: ud.id ?? p.unidad_derivada_venta_id,
          }
        })
        .filter(Boolean) as ProductoEntrega[]
    }

    const yaEntregada = entrega.estado_entrega === 'en'
    return entrega.productos_entregados.map((p: any, index: number) => {
      const ud = p.unidad_derivada_venta || {}
      const pav = ud.producto_almacen_venta || {}
      const pa = pav.producto_almacen || {}
      const prod = pa.producto || {}
      const total = Number(ud.cantidad ?? p.cantidad_entregada ?? 0)
      const entregadoReal = yaEntregada ? total : 0
      const pendienteReal = total - entregadoReal
      return {
        id: index + 1,
        producto: prod.name || p.producto_name || '',
        ubicacion: '',
        total,
        entregado: entregadoReal,
        pendiente: pendienteReal,
        entregar: pendienteReal,
        entregar_programado: 0,
        unidad_derivada_venta_id: ud.id ?? p.unidad_derivada_venta_id,
      }
    })
  }, [entrega, restante])

  if (!entrega) return null

  const tipoEntrega = entrega.tipo_entrega as 'rt' | 'de' | 'pa'
  const tipoDespachoUI: TipoDespachoUI = tipoEntrega === 'de' ? 'Domicilio' : 'Parcial'

  // Modo restante: modal simplificado que solo crea la nueva entrega
  if (restante) {
    const handleConfirmarRestante = async () => {
      const productos = productosIniciales
      if (productos.length === 0) {
        message.info('No hay productos pendientes')
        return
      }
      setCreandoRestante(true)
      try {
        const response = await entregaProductoApi.create({
          venta_id: entrega.venta_id,
          tipo_entrega: entrega.tipo_entrega,
          tipo_despacho: TipoDespacho.INMEDIATO,
          estado_entrega: EstadoEntrega.ENTREGADO,
          fecha_entrega: new Date().toISOString().split('T')[0],
          almacen_salida_id: entrega.almacen_salida_id,
          quien_entrega: entrega.quien_entrega || 'almacen',
          user_id: entrega.user_id,
          productos_entregados: productos.map((p: any) => ({
            unidad_derivada_venta_id: p.unidad_derivada_venta_id,
            cantidad_entregada: p.entregar,
          })),
        })
        if (response.error) {
          message.error(response.error.message || 'Error al crear entrega')
          return
        }
        message.success('Restante entregado exitosamente')
        queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
        onSuccess?.()
        setOpen(false)
      } catch (err: any) {
        message.error(err?.message || 'Error al crear entrega')
      } finally {
        setCreandoRestante(false)
      }
    }

    return (
      <Modal
        title={
          <TitleForm className="!pb-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span>ENTREGAR RESTANTE</span>
            </div>
          </TitleForm>
        }
        open={open}
        onCancel={() => setOpen(false)}
        width={800}
        centered
        footer={
          <div className="flex justify-end gap-2">
            <ButtonBase color="default" size="md" onClick={() => setOpen(false)}>Cancelar</ButtonBase>
            <ButtonBase color="success" size="md" onClick={handleConfirmarRestante} disabled={creandoRestante}>
              {creandoRestante ? 'Creando...' : 'Entregar Ahora'}
            </ButtonBase>
          </div>
        }
      >
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">Productos pendientes por entregar:</p>
          <div className="space-y-2">
            {productosIniciales.map((p, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-2">
                <span className="text-sm text-gray-700">{p.producto}</span>
                <span className="text-sm font-semibold text-emerald-700">{p.pendiente} unidades</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    )
  }

  const ocultarBase: SeccionOcultable[] = ['omitir', 'quien-entrega', 'tipo-pedido']
  const ocultar: SeccionOcultable[] =
    tipoEntrega === 'rt'
      ? [...ocultarBase, 'programar-resto']
      : tipoEntrega === 'de'
      ? [...ocultarBase]
      : [...ocultarBase, 'programar-resto']

  const tituloPorTipo: Record<string, string> = {
    rt: 'Despacho en Tienda',
    de: 'Despacho a Domicilio',
    pa: 'Despacho Parcial',
  }
  const tituloOverride = tituloPorTipo[tipoEntrega] ?? 'Configurar Entrega'

  const quienEntregaLabel: Record<string, string> = {
    almacen: 'Almacén',
    vendedor: 'Vendedor',
    chofer: 'Chofer',
  }
  const quienEntregaInfo = entrega.quien_entrega
    ? `Entrega: ${quienEntregaLabel[entrega.quien_entrega] ?? entrega.quien_entrega}`
    : undefined

  const puedeCambiarTipo = entrega.estado_entrega !== 'en' && entrega.estado_entrega !== 'ca'
  const accionesHeader = (
    <div className="flex items-center gap-2">
      <ButtonBase color="danger" size="sm" onClick={() => openPdfModal(entrega)}>
        <FaFilePdf size={11} className="mr-1 inline-block" /> Ticket
      </ButtonBase>
      {puedeCambiarTipo && (
        <ButtonBase color="warning" size="sm" onClick={() => setModalSeleccionarTipoOpen(true)}>
          <FaExchangeAlt size={11} className="mr-1 inline-block" /> Cambiar tipo
        </ButtonBase>
      )}
    </div>
  )

  return (
    <>
      <ModalDetallesEntrega
        open={open}
        setOpen={setOpen}
        form={form}
        tipoDespacho={tipoDespachoUI}
        mode={{ kind: 'actualizar-entrega', entregaId: entrega.id }}
        ocultar={ocultar}
        productosIniciales={productosIniciales}
        tituloOverride={tituloOverride}
        infoExtra={quienEntregaInfo}
        accionesHeader={accionesHeader}
        clienteNombre={entrega.venta?.cliente?.razon_social || entrega.venta?.cliente?.nombres}
        direccion={entrega.direccion_entrega || ''}
        onConfirmar={() => {
          message.success('Entrega actualizada')
          queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
          onSuccess?.()
        }}
        onEditarCliente={() => {
          message.info('Edita el cliente desde la venta original')
        }}
      />

      <ModalSeleccionarTipoDespacho
        open={modalSeleccionarTipoOpen}
        setOpen={setModalSeleccionarTipoOpen}
        onSelectTipo={handleSelectTipoDespacho}
        defaultTipo={tipoEntrega === 'rt' ? 'EnTienda' : tipoEntrega === 'de' ? 'Domicilio' : 'Parcial'}
      />
    </>
  )
}
