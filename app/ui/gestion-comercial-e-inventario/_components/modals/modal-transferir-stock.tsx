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
import { useStoreAlmacen } from '~/store/store-almacen'
import { transferenciaStockApi, type TransferenciaStock } from '~/lib/api/transferencia-stock'
import { getStock } from '~/app/_utils/get-stock'
import ModalDocTransferenciaStock from './modal-doc-transferencia-stock'
import { patchStockListadoCompleto } from './patch-stock-listado-completo'
import {
  useStoreProductoAgregadoTransferencia,
  type ValuesCardAgregarProductoTransferencia,
} from '../../mis-transferencias/_store/store-producto-agregado-transferencia'

// Tipo para cada fila de producto en la tabla
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

type FormTransferirStock = {
  fecha: Dayjs
  almacen_origen_id: number
  almacen_destino_id: number
  descripcion?: string
}

type ModalTransferirStockProps = {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function ModalTransferirStock({
  open,
  setOpen,
}: ModalTransferirStockProps) {
  const [form] = Form.useForm<FormTransferirStock>()
  const queryClient = useQueryClient()
  const almacenId = useStoreAlmacen((s) => s.almacen_id)

  const { message } = App.useApp()
  const [productos, setProductos] = useState<ProductoFila[]>([])
  const [openDoc, setOpenDoc] = useState(false)
  const [docData, setDocData] = useState<TransferenciaStock | undefined>()

  const almacenOrigenId = Form.useWatch('almacen_origen_id', form)
  const almacenDestinoId = Form.useWatch('almacen_destino_id', form)

  // Escuchar la store de producto agregado
  const productoAgregadoStore = useStoreProductoAgregadoTransferencia(
    (s) => s.productoAgregado
  )
  const setProductoAgregado = useStoreProductoAgregadoTransferencia(
    (s) => s.setProductoAgregado
  )

  // Cuando la store cambia, agregar el producto a la lista
  useEffect(() => {
    if (!productoAgregadoStore || !productoAgregadoStore.producto_id) return

    const p = { ...productoAgregadoStore }

    // Verificar si ya existe (mismo producto + misma unidad)
    const existente = productos.find(
      (item) =>
        item.producto_id === p.producto_id &&
        item.unidad_derivada_id === p.unidad_derivada_id
    )

    if (existente) {
      // Sumar cantidad
      setProductos((prev) =>
        prev.map((item) =>
          item.producto_id === p.producto_id &&
          item.unidad_derivada_id === p.unidad_derivada_id
            ? { ...item, cantidad: item.cantidad + Number(p.cantidad ?? 1) }
            : item
        )
      )
    } else {
      // Agregar nuevo
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

    // Limpiar store
    setProductoAgregado(undefined)
  }, [productoAgregadoStore])

  // Reset cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setProductos([])
      setProductoAgregado(undefined)
    }
  }, [open])

  // Eliminar producto de la lista
  const eliminarProducto = useCallback((key: string) => {
    setProductos((prev) => prev.filter((p) => p.key !== key))
  }, [])

  // Actualizar cantidad de un producto
  const actualizarCantidad = useCallback((key: string, cantidad: number) => {
    setProductos((prev) =>
      prev.map((p) => (p.key === key ? { ...p, cantidad } : p))
    )
  }, [])

  // Actualizar unidad derivada de un producto
  const actualizarUnidadDerivada = useCallback((key: string, udId: number) => {
    setProductos((prev) =>
      prev.map((p) => {
        if (p.key !== key) return p
        const ud = p.unidades_derivadas.find(
          (u: any) => u.unidad_derivada.id === udId
        )
        return {
          ...p,
          unidad_derivada_id: udId,
          unidad_derivada_name: ud?.unidad_derivada.name || '',
          factor: Number(ud?.factor ?? 0),
        }
      })
    )
  }, [])

  // Column definitions para AG Grid
  const columnDefs = useMemo<ColDef<ProductoFila>[]>(
    () => [
      {
        headerName: 'Código',
        field: 'cod_producto',
        width: 100,
        sortable: false,
        filter: false,
      },
      {
        headerName: 'Producto',
        field: 'producto_name',
        flex: 1,
        minWidth: 180,
        sortable: false,
        filter: false,
      },
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
          return (
            <div className="flex items-center h-full">
              <SelectBase
                size="small"
                variant="borderless"
                value={data.unidad_derivada_id}
                options={options}
                onChange={(val: number) =>
                  actualizarUnidadDerivada(data.key, val)
                }
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
                onChange={(val) =>
                  actualizarCantidad(data.key, Number(val ?? 0))
                }
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
          const stock = getStock({
            stock_fraccion: data.stock_fraccion,
            unidades_contenidas: data.unidades_contenidas,
          }).stock
          return (
            <div className="flex items-center h-full font-bold text-yellow-600">
              {stock}
            </div>
          )
        },
      },
      {
        headerName: 'Después',
        width: 90,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<ProductoFila>) => {
          const data = params.data
          if (!data) return null
          const cantFraccion = data.cantidad * data.factor
          const stockNuevo = data.stock_fraccion - cantFraccion
          const stock = getStock({
            stock_fraccion: stockNuevo,
            unidades_contenidas: data.unidades_contenidas,
          }).stock
          return (
            <div
              className={`flex items-center h-full font-bold ${stockNuevo < 0 ? 'text-red-600' : 'text-emerald-600'}`}
            >
              {stock}
            </div>
          )
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
              <Button
                type="text"
                danger
                size="small"
                icon={<FaTrash size={12} />}
                onClick={() => eliminarProducto(data.key)}
              />
            </div>
          )
        },
      },
    ],
    [actualizarCantidad, actualizarUnidadDerivada, eliminarProducto]
  )

  const mutation = useMutation({
    mutationFn: async (values: FormTransferirStock) => {
      if (productos.length === 0) {
        throw new Error('Debe agregar al menos un producto')
      }

      const payload = {
        almacen_origen_id: values.almacen_origen_id,
        almacen_destino_id: values.almacen_destino_id,
        productos: productos.map((p) => ({
          producto_id: p.producto_id,
          unidad_derivada_id: p.unidad_derivada_id,
          cantidad: p.cantidad,
        })),
        fecha: values.fecha ? values.fecha.format('YYYY-MM-DD HH:mm:ss') : undefined,
        descripcion: values.descripcion,
      }

      const result = await transferenciaStockApi.create(payload)

      if (result.error) {
        console.error('❌ Error transferencia:', result.error)
        throw new Error(result.error.message || 'Error del servidor')
      }
      const transferencia = (result.data as any)?.data || result.data
      return transferencia as TransferenciaStock
    },
    onSuccess: (data) => {
      message.success('Transferencia de stock creada correctamente')
      // Update instantáneo del grid de Mi Almacén (['productos-listado-completo'])
      // con el stock nuevo del response, sin pagar el refetch de ~12MB.
      patchStockListadoCompleto(queryClient, data)
      // Solo marcar stale (refetchType: 'none'): el patch ya muestra el valor
      // correcto y el websocket reconcilia en segundo plano. Evita disparar de
      // inmediato la recarga del listado completo.
      queryClient.invalidateQueries({ queryKey: ['productos-listado-completo'], refetchType: 'none' })
      queryClient.invalidateQueries({ queryKey: ['productos-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['productos-search'] })
      queryClient.invalidateQueries({ queryKey: ['transferencias-stock'] })
      setOpen(false)
      form.resetFields()
      setProductos([])
      setDocData(data)
      setOpenDoc(true)
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al crear la transferencia')
    },
  })

  return (
    <>
      <ModalDocTransferenciaStock
        open={openDoc}
        setOpen={setOpenDoc}
        data={docData}
      />
      <ModalForm
        modalProps={{
          title: (
            <TitleForm>
              <FaExchangeAlt className="inline mr-2" />
              Transferir Stock
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
          onOk: () => {
            form.validateFields().then((values) => {
              mutation.mutate(values)
            }).catch(() => {
              // Validation failed - Ant Design shows errors automatically
            })
          },
          okText: 'Transferir',
          styles: {
            body: {
              maxHeight: 'calc(100vh - 150px)',
              overflowY: 'auto',
            },
          },
        }}
        onCancel={() => {
          form.resetFields()
          setProductos([])
        }}
        open={open}
        setOpen={setOpen}
        formProps={{
          form,
          onFinish: (values: FormTransferirStock) => mutation.mutate(values),
          initialValues: {
            fecha: dayjs(),
            almacen_origen_id: almacenId ?? 1,
          },
        }}
      >
        {/* Fecha */}
        <LabelBase label="Fecha:" classNames={{ labelParent: 'mb-6' }}>
          <DatePickerBase
            prefix={<FaCalendar className="text-cyan-600 mx-1" />}
            propsForm={{ name: 'fecha' }}
            placeholder="Fecha"
            className="w-full"
          />
        </LabelBase>

        {/* Almacen Origen y Destino */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <LabelBase
            label="Almacen Origen:"
            className="w-full"
            classNames={{ labelParent: 'mb-6' }}
          >
            <SelectAlmacen
              size="middle"
              className="w-full"
              classNameIcon="text-emerald-700 mx-1"
              afecta_store={false}
              excludeIds={[almacenDestinoId]}
              propsForm={{
                name: 'almacen_origen_id',
                rules: [
                  { required: true, message: 'Selecciona almacen origen' },
                ],
              }}
              form={form}
              onChange={() => {
                setProductos([])
              }}
            />
          </LabelBase>
          <LabelBase
            label="Almacen Destino:"
            className="w-full"
            classNames={{ labelParent: 'mb-6' }}
          >
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
                  ({
                    getFieldValue,
                  }: {
                    getFieldValue: (name: string) => any
                  }) => ({
                    validator(_: any, value: number) {
                      if (
                        !value ||
                        getFieldValue('almacen_origen_id') !== value
                      ) {
                        return Promise.resolve()
                      }
                      return Promise.reject(
                        new Error('Debe ser diferente al origen')
                      )
                    },
                  }),
                ],
              }}
              form={form}
            />
          </LabelBase>
        </div>

        {/* Buscar Producto */}
        <LabelBase
          label="Buscar Producto:"
          classNames={{ labelParent: 'mb-4' }}
        >
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

        {/* Tabla de productos con AG Grid */}
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
              <div className="text-gray-400 text-sm py-8">
                Busca y agrega productos para transferir
              </div>
            )}
          />
        </div>

        {/* Observaciones */}
        <LabelBase label="Observaciones:" orientation="column">
          <TextareaBase propsForm={{ name: 'descripcion' }} />
        </LabelBase>
      </ModalForm>
    </>
  )
}
