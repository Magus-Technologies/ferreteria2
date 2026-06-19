'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Form, App, Button } from 'antd'
import { FaCalendar, FaExchangeAlt, FaTrash } from 'react-icons/fa'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import LabelBase from '~/components/form/label-base'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectProductos from '~/app/_components/form/selects/select-productos'
import SelectBase from '~/app/_components/form/selects/select-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import TableBase from '~/components/tables/table-base'
import { transferenciaStockApi, type TransferenciaStock } from '~/lib/api/transferencia-stock'
import { getStock } from '~/app/_utils/get-stock'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { patchStockListadoCompleto } from './patch-stock-listado-completo'
import {
  useStoreProductoAgregadoTransferencia,
} from '../../mis-transferencias/_store/store-producto-agregado-transferencia'

type ProductoFila = {
  key: string
  producto_id: number
  producto_name: string
  cod_producto: string
  unidad_derivada_id: number
  unidad_derivada_name: string
  cantidad: number
  factor: number
  stock_fraccion: number
  unidades_contenidas: number
  unidades_derivadas: any[]
}

type FormValues = {
  fecha: Dayjs
  almacen_origen_id: number
  almacen_destino_id: number
  descripcion?: string
}

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  transferencia: TransferenciaStock | null
  onSuccess?: (updated: TransferenciaStock) => void
}

export default function ModalEditTransferenciaStock({ open, setOpen, transferencia, onSuccess }: Props) {
  const [form] = Form.useForm<FormValues>()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [productos, setProductos] = useState<ProductoFila[]>([])

  const almacenOrigenId = Form.useWatch('almacen_origen_id', form)
  const almacenDestinoId = Form.useWatch('almacen_destino_id', form)

  const productoAgregadoStore = useStoreProductoAgregadoTransferencia((s) => s.productoAgregado)
  const setProductoAgregado = useStoreProductoAgregadoTransferencia((s) => s.setProductoAgregado)

  // Pre-cargar datos de la transferencia cuando se abre
  useEffect(() => {
    if (!open || !transferencia) return
    form.setFieldsValue({
      fecha: dayjs(transferencia.fecha),
      almacen_origen_id: transferencia.almacen_origen_id,
      almacen_destino_id: transferencia.almacen_destino_id,
      descripcion: transferencia.descripcion ?? undefined,
    })
    const filas: ProductoFila[] = (transferencia.productos || []).map((p, i) => ({
      key: `existing-${p.id}-${i}`,
      producto_id: p.producto_almacen_origen?.producto?.id ?? 0,
      producto_name: p.producto_almacen_origen?.producto?.name ?? '',
      cod_producto: p.producto_almacen_origen?.producto?.cod_producto ?? '',
      unidad_derivada_id: p.unidad_derivada_id ?? 0,
      unidad_derivada_name: p.unidad_derivada_inmutable?.name ?? '',
      cantidad: Number(p.cantidad),
      factor: Number(p.factor),
      stock_fraccion: Number(p.stock_nuevo_origen),
      unidades_contenidas: 0,
      unidades_derivadas: p.unidad_derivada_id
        ? [{ unidad_derivada: { id: p.unidad_derivada_id, name: p.unidad_derivada_inmutable?.name }, factor: p.factor }]
        : [],
    }))
    setProductos(filas)
  }, [open, transferencia])

  // Limpiar al cerrar
  useEffect(() => {
    if (!open) {
      setProductos([])
      setProductoAgregado(undefined)
    }
  }, [open])

  // Agregar producto desde store
  useEffect(() => {
    if (!productoAgregadoStore?.producto_id) return
    const p = { ...productoAgregadoStore }
    const existente = productos.find(
      (item) => item.producto_id === p.producto_id && item.unidad_derivada_id === p.unidad_derivada_id
    )
    if (existente) {
      setProductos((prev) =>
        prev.map((item) =>
          item.producto_id === p.producto_id && item.unidad_derivada_id === p.unidad_derivada_id
            ? { ...item, cantidad: item.cantidad + Number(p.cantidad ?? 1) }
            : item
        )
      )
    } else {
      setProductos((prev) => [
        ...prev,
        {
          key: `${p.producto_id}-${p.unidad_derivada_id}-${Date.now()}`,
          producto_id: p.producto_id!,
          producto_name: p.producto_name || '',
          cod_producto: p.cod_producto || '',
          unidad_derivada_id: p.unidad_derivada_id!,
          unidad_derivada_name: p.unidad_derivada_name || '',
          cantidad: Number(p.cantidad ?? 1),
          factor: Number(p.unidad_derivada_factor ?? 0),
          stock_fraccion: Number(p.stock_fraccion ?? 0),
          unidades_contenidas: Number(p.unidades_contenidas ?? 0),
          unidades_derivadas: p.unidades_derivadas_disponibles || [],
        },
      ])
    }
    setProductoAgregado(undefined)
  }, [productoAgregadoStore])

  const eliminarProducto = useCallback((key: string) => {
    setProductos((prev) => prev.filter((p) => p.key !== key))
  }, [])

  const actualizarCantidad = useCallback((key: string, cantidad: number) => {
    setProductos((prev) => prev.map((p) => (p.key === key ? { ...p, cantidad } : p)))
  }, [])

  const actualizarUnidadDerivada = useCallback((key: string, udId: number) => {
    setProductos((prev) =>
      prev.map((p) => {
        if (p.key !== key) return p
        const ud = p.unidades_derivadas.find((u: any) => u.unidad_derivada.id === udId)
        return {
          ...p,
          unidad_derivada_id: udId,
          unidad_derivada_name: ud?.unidad_derivada.name || '',
          factor: Number(ud?.factor ?? 0),
        }
      })
    )
  }, [])

  const columnDefs = useMemo<ColDef<ProductoFila>[]>(
    () => [
      { headerName: 'Código', field: 'cod_producto', width: 100, sortable: false, filter: false },
      { headerName: 'Producto', field: 'producto_name', flex: 1, minWidth: 180, sortable: false, filter: false },
      {
        headerName: 'Unidad',
        field: 'unidad_derivada_name',
        width: 130,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<ProductoFila>) => {
          const data = params.data
          if (!data) return null
          const options = data.unidades_derivadas.map((u: any) => ({
            value: u.unidad_derivada.id,
            label: u.unidad_derivada.name,
          }))
          if (options.length === 0) return <div className="flex items-center h-full">{data.unidad_derivada_name}</div>
          return (
            <div className="flex items-center h-full">
              <SelectBase
                size="small"
                variant="borderless"
                value={data.unidad_derivada_id}
                options={options}
                onChange={(val: number) => actualizarUnidadDerivada(data.key, val)}
                className="w-full"
              />
            </div>
          )
        },
      },
      {
        headerName: 'Cantidad',
        field: 'cantidad',
        width: 110,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<ProductoFila>) => {
          const data = params.data
          if (!data) return null
          return (
            <div className="flex items-center h-full">
              <InputNumberBase
                size="small"
                value={data.cantidad}
                precision={3}
                min={0.001}
                onChange={(val) => actualizarCantidad(data.key, Number(val ?? 0))}
                className="w-full"
              />
            </div>
          )
        },
      },
      {
        headerName: 'Stock',
        width: 90,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<ProductoFila>) => {
          const data = params.data
          if (!data) return null
          const stock = getStock({ stock_fraccion: data.stock_fraccion, unidades_contenidas: data.unidades_contenidas }).stock
          return <div className="flex items-center h-full font-bold text-yellow-600">{stock}</div>
        },
      },
      {
        headerName: '',
        width: 50,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<ProductoFila>) => {
          const data = params.data
          if (!data) return null
          return (
            <div className="flex items-center justify-center h-full">
              <Button type="text" danger size="small" icon={<FaTrash size={12} />} onClick={() => eliminarProducto(data.key)} />
            </div>
          )
        },
      },
    ],
    [actualizarCantidad, actualizarUnidadDerivada, eliminarProducto]
  )

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!transferencia) throw new Error('Sin transferencia')
      if (productos.length === 0) throw new Error('Debe agregar al menos un producto')
      const result = await transferenciaStockApi.update(transferencia.id, {
        almacen_origen_id: values.almacen_origen_id,
        almacen_destino_id: values.almacen_destino_id,
        productos: productos.map((p) => ({
          producto_id: p.producto_id,
          unidad_derivada_id: p.unidad_derivada_id,
          cantidad: p.cantidad,
        })),
        fecha: values.fecha.format('YYYY-MM-DD HH:mm:ss'),
        descripcion: values.descripcion,
      })
      if (result.error) throw new Error(result.error.message)
      return (result.data as any)?.data ?? result.data as TransferenciaStock
    },
    onSuccess: (updated) => {
      message.success('Transferencia actualizada correctamente')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.TRANSFERENCIAS_STOCK] })
      // Update instantáneo del grid de Mi Almacén con el stock nuevo del response,
      // sin pagar el refetch de ~12MB; el websocket reconcilia en segundo plano.
      patchStockListadoCompleto(queryClient, updated)
      queryClient.invalidateQueries({ queryKey: ['productos-listado-completo'], refetchType: 'none' })
      queryClient.invalidateQueries({ queryKey: ['productos-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['productos-search'] })
      onSuccess?.(updated)
      setOpen(false)
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al actualizar')
    },
  })

  const numero = transferencia
    ? `TS${String(transferencia.serie).padStart(4, '0')}-${String(transferencia.numero).padStart(8, '0')}`
    : ''

  return (
    <ModalForm
      modalProps={{
        title: (
          <TitleForm>
            <FaExchangeAlt className="inline mr-2" />
            Editar Transferencia {numero}
          </TitleForm>
        ),
        className: 'w-[95vw] xl:w-auto xl:min-w-[850px] max-w-[950px]',
        wrapClassName: '!flex !items-center',
        centered: true,
        okButtonProps: {
          loading: mutation.isPending,
          disabled: mutation.isPending || productos.length === 0,
          htmlType: 'button' as const,
        },
        onOk: () => form.validateFields().then((v) => mutation.mutate(v)).catch(() => {}),
        okText: 'Guardar cambios',
        styles: { body: { maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' } },
      }}
      open={open}
      setOpen={setOpen}
      formProps={{ form, initialValues: { fecha: dayjs() } }}
    >
      <LabelBase label="Fecha:" classNames={{ labelParent: 'mb-6' }}>
        <DatePickerBase
          prefix={<FaCalendar className="text-cyan-600 mx-1" />}
          propsForm={{ name: 'fecha' }}
          placeholder="Fecha"
          className="w-full"
        />
      </LabelBase>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <LabelBase label="Almacen Origen:" className="w-full" classNames={{ labelParent: 'mb-6' }}>
          <SelectAlmacen
            size="middle"
            className="w-full"
            classNameIcon="text-emerald-700 mx-1"
            afecta_store={false}
            excludeIds={[almacenDestinoId]}
            propsForm={{
              name: 'almacen_origen_id',
              rules: [{ required: true, message: 'Selecciona almacen origen' }],
            }}
            form={form}
            onChange={() => setProductos([])}
          />
        </LabelBase>
        <LabelBase label="Almacen Destino:" className="w-full" classNames={{ labelParent: 'mb-6' }}>
          <SelectAlmacen
            size="middle"
            className="w-full"
            classNameIcon="text-blue-700 mx-1"
            afecta_store={false}
            excludeIds={[almacenOrigenId]}
            propsForm={{
              name: 'almacen_destino_id',
              rules: [
                { required: true, message: 'Selecciona almacen destino' },
                ({ getFieldValue }: { getFieldValue: (name: string) => any }) => ({
                  validator(_: any, value: number) {
                    if (!value || getFieldValue('almacen_origen_id') !== value) return Promise.resolve()
                    return Promise.reject(new Error('Debe ser diferente al origen'))
                  },
                }),
              ],
            }}
            form={form}
          />
        </LabelBase>
      </div>

      <LabelBase label="Buscar Producto:" classNames={{ labelParent: 'mb-4' }}>
        <SelectProductos
          className="w-full"
          classNameIcon="text-rose-700 mx-1"
          withSearch
          form={form}
          limpiarOnChange
          showCardAgregarProductoTransferencia
          almacenOrigenIdTransferencia={almacenOrigenId}
          showUltimasCompras={false}
        />
      </LabelBase>

      <div className="h-[250px] w-full mb-4">
        <TableBase<ProductoFila>
          rowData={productos}
          columnDefs={columnDefs}
          getRowId={(params) => params.data.key}
          rowSelection={false}
          withNumberColumn={true}
          pagination={false}
          persistColumnState={false}
          domLayout="normal"
          rowHeight={40}
          headerHeight={36}
          noRowsOverlayComponent={() => (
            <div className="text-gray-400 text-sm py-8">Busca y agrega productos para transferir</div>
          )}
        />
      </div>

      <LabelBase label="Observaciones:" orientation="column">
        <TextareaBase propsForm={{ name: 'descripcion' }} />
      </LabelBase>
    </ModalForm>
  )
}
