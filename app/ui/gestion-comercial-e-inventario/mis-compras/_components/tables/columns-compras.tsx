'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { EstadoDeCompra, TipoDocumento, FormaDePago } from '@prisma/client'
import { IGV } from '~/lib/constantes'
import ColumnAction from '~/components/tables/column-action'
import { permissions } from '~/lib/permissions'
import usePermissionHook from '~/hooks/use-permission'
import { Popconfirm, Tooltip } from 'antd'
import { FaTruckLoading } from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import TagEstadoDeCompra from '../others/tag-estado-de-compra'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { FaFlag } from 'react-icons/fa6'
import { compraApi, type Compra } from '~/lib/api/compra'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import useApp from 'antd/es/app/useApp'

// Helper para formatear moneda según el tipo
const formatCurrency = (value: number, tipoMoneda: string | undefined) => {
  const formatted = Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  // Verificar si es dólar (d o D) o soles (s o S o cualquier otro valor)
  const isDolar = tipoMoneda?.toLowerCase() === 'd'
  return isDolar ? `$. ${formatted}` : `S/. ${formatted}`
}

export function useColumnsCompras({
  setCompraRecepcion,
  setOpenModal,
}: {
  setCompraRecepcion?: (compra: Compra | undefined) => void
  setOpenModal?: (open: boolean) => void
} = {}) {
  const router = useRouter()
  const { can } = usePermissionHook()
  const queryClient = useQueryClient()
  const { message } = useApp()

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { estado_de_compra: string } }) => {
      const result = await compraApi.update(id, data)
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data!.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COMPRAS] })
      message.success('Recepción Finalizada correctamente')
    },
  })

  const columns: ColDef<Compra>[] = [
    {
      headerName: 'Documento',
      field: 'tipo_documento',
      width: 80,
      minWidth: 80,
      valueFormatter: ({ value }) => {
        return value == TipoDocumento.NotaDeVenta ? 'Nota de Venta' : value
      },
      filter: true,
    },
    {
      headerName: 'Serie',
      field: 'serie',
      width: 60,
      minWidth: 60,
      filter: true,
    },
    {
      headerName: 'Número',
      field: 'numero',
      width: 60,
      minWidth: 60,
      filter: 'agNumberColumnFilter',
    },
    {
      headerName: 'Fecha Emisión',
      field: 'fecha',
      width: 110,
      minWidth: 110,
      type: 'date',
      filter: 'agDateColumnFilter',
    },
    {
      headerName: 'Fecha Vencimiento',
      field: 'fecha_vencimiento',
      width: 130,
      minWidth: 130,
      type: 'date',
      filter: 'agDateColumnFilter',
      valueFormatter: ({ value }) => {
        if (!value) return '-'
        return value
      },
    },
    {
      headerName: 'RUC',
      field: 'proveedor.ruc',
      width: 100,
      minWidth: 100,
      filter: true,
      valueGetter: (params) => params.data?.proveedor?.ruc || '',
    },
    {
      headerName: 'Proveedor',
      field: 'proveedor.razon_social',
      width: 200,
      minWidth: 200,
      filter: true,
      flex: 1,
      valueGetter: (params) => params.data?.proveedor?.razon_social || '',
    },
    {
      headerName: 'Subtotal',
      field: 'productos_por_almacen',
      width: 90,
      minWidth: 90,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({
        value,
      }: {
        value: Compra['productos_por_almacen']
      }) => String(Number(getSubTotal(value)) / (IGV + 1)),
      cellRenderer: (params: ICellRendererParams<Compra>) => {
        const subtotal = Number(getSubTotal(params.value)) / (IGV + 1)
        return formatCurrency(subtotal, params.data?.tipo_moneda)
      },
    },
    {
      headerName: 'IGV',
      field: 'productos_por_almacen',
      width: 90,
      minWidth: 90,
      valueFormatter: ({
        value,
      }: {
        value: Compra['productos_por_almacen']
      }) =>
        String(
          Number(getSubTotal(value)) - Number(getSubTotal(value)) / (IGV + 1)
        ),
      filter: 'agNumberColumnFilter',
      cellRenderer: (params: ICellRendererParams<Compra>) => {
        const igv = Number(getSubTotal(params.value)) - Number(getSubTotal(params.value)) / (IGV + 1)
        return formatCurrency(igv, params.data?.tipo_moneda)
      },
    },
    {
      headerName: 'Percepción',
      field: 'percepcion',
      width: 90,
      minWidth: 90,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => String(Number(value || 0)),
      cellRenderer: (params: ICellRendererParams<Compra>) => {
        const percepcion = Number(params.value || 0)
        return formatCurrency(percepcion, params.data?.tipo_moneda)
      },
    },
    {
      headerName: 'Total',
      field: 'productos_por_almacen',
      width: 90,
      minWidth: 90,
      valueFormatter: ({
        value,
      }: {
        value: Compra['productos_por_almacen']
      }) => getSubTotal(value),
      filter: 'agNumberColumnFilter',
      cellRenderer: (params: ICellRendererParams<Compra>) => {
        const total = Number(getSubTotal(params.value))
        return formatCurrency(total, params.data?.tipo_moneda)
      },
    },
    {
      headerName: 'Forma de Pago',
      field: 'forma_de_pago',
      width: 80,
      minWidth: 80,
      valueFormatter: ({ value }) => {
        if (value === 'co') return 'Contado';
        if (value === 'cr') return 'Crédito';
        return value || '';
      },
      filter: true,
    },
    {
      headerName: 'Total Pagado',
      field: 'productos_por_almacen',
      width: 90,
      minWidth: 90,
      valueFormatter: (params) => {
        const totalPagado = Number(params.data?.total_pagado || 0)
        return String(totalPagado)
      },
      filter: 'agNumberColumnFilter',
      cellRenderer: (params: ICellRendererParams<Compra>) => {
        const totalPagado = Number(params.data?.total_pagado || 0)
        return formatCurrency(totalPagado, params.data?.tipo_moneda)
      },
    },
    {
      headerName: 'Resta',
      field: 'productos_por_almacen',
      width: 90,
      minWidth: 90,
      valueFormatter: (params) => {
        const total = Number(getSubTotal(params.value))
        const totalPagado = Number(params.data?.total_pagado || 0)
        const resta = total - totalPagado
        return String(resta)
      },
      filter: 'agNumberColumnFilter',
      cellRenderer: (params: ICellRendererParams<Compra>) => {
        const total = Number(getSubTotal(params.value))
        const totalPagado = Number(params.data?.total_pagado || 0)
        const resta = total - totalPagado
        return formatCurrency(resta, params.data?.tipo_moneda)
      },
    },
    {
      headerName: 'Estado de Cuenta',
      field: 'productos_por_almacen',
      width: 120,
      minWidth: 120,
      valueFormatter: (params) => {
        // Si es contado, siempre está pagado
        if (params.data?.forma_de_pago === FormaDePago.Contado) {
          return 'Pagado'
        }
        
        // Si es crédito, verificar si está pagado completamente
        const total = Number(getSubTotal(params.value))
        const totalPagado = Number(params.data?.total_pagado || 0)
        const resta = total - totalPagado
        
        if (resta <= 0.01) { // Tolerancia de 1 centavo
          return 'Pagado'
        } else {
          return 'Pendiente'
        }
      },
      filter: true,
      cellRenderer: (params: ICellRendererParams<Compra>) => {
        // Si es contado, siempre está pagado
        if (params.data?.forma_de_pago === FormaDePago.Contado) {
          return (
            <div className='flex items-center h-full'>
              <span className='px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800'>
                Pagado
              </span>
            </div>
          )
        }
        
        // Si es crédito, verificar si está pagado completamente
        const total = Number(getSubTotal(params.value))
        const totalPagado = Number(params.data?.total_pagado || 0)
        const resta = total - totalPagado
        
        if (resta <= 0.01) { // Tolerancia de 1 centavo
          return (
            <div className='flex items-center h-full'>
              <span className='px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800'>
                Pagado
              </span>
            </div>
          )
        } else {
          return (
            <div className='flex items-center h-full'>
              <span className='px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800'>
                Pendiente
              </span>
            </div>
          )
        }
      },
    },
    {
      headerName: 'Registrador',
      field: 'user.name',
      width: 80,
      minWidth: 80,
      filter: true,
    },
    {
      headerName: 'Estado',
      field: 'estado_de_compra',
      width: 90,
      minWidth: 90,
      cellRenderer: (params: ICellRendererParams<Compra>) => {
        // Mapear código a nombre usando strings directos
        const estadoNombre: Record<string, string> = {
          'cr': 'Creado',
          'ee': 'En Espera',
          'pr': 'Procesado',
          'an': 'Anulado',
        };

        const nombre = estadoNombre[params.value as string] || params.value;

        return (
          <div className='flex items-center h-full'>
            <TagEstadoDeCompra estado_de_compra={params.value}>
              {nombre}
            </TagEstadoDeCompra>
          </div>
        );
      },
      filter: true,
    },
    ...((setCompraRecepcion && setOpenModal
      ? [
          {
            headerName: 'Acciones',
            field: 'id',
            width: 95,
            cellRenderer: (
              params: ICellRendererParams<Compra>
            ) => {
              return (
                <ColumnAction
                  titleDelete='Anular'
                  id={params.value}
                  permiso={permissions.COMPRAS_BASE}
                  showDelete={
                    params.data?.estado_de_compra !== EstadoDeCompra.Anulado &&
                    params.data?.estado_de_compra !== EstadoDeCompra.Procesado
                  }
                  propsDelete={{
                    action: async ({ id }: { id: string }) => {
                      const result = await compraApi.delete(id)
                      if (result.error) {
                        throw new Error(result.error.message)
                      }
                      return { data: 'ok' }
                    },
                    msgSuccess: 'Compra anulada correctamente',
                    queryKey: [QueryKeys.COMPRAS],
                  }}
                  onEdit={() =>
                    router.push(
                      `/ui/gestion-comercial-e-inventario/mis-compras/editar-compra/${params.value}`
                    )
                  }
                >
                  {can(permissions.RECEPCION_ALMACEN_CREATE) && (
                    <Tooltip
                      title={
                        params.data?.estado_de_compra === EstadoDeCompra.Creado
                          ? 'Recepcionar en Almacén'
                          : params.data?.estado_de_compra ===
                            EstadoDeCompra.Procesado
                          ? 'Recepcionada en Almacén'
                          : 'No se puede Recepcionar'
                      }
                    >
                      <FaTruckLoading
                        onClick={() => {
                          if (
                            params.data?.estado_de_compra ===
                            EstadoDeCompra.Creado
                          ) {
                            setCompraRecepcion(params.data)
                            setOpenModal(true)
                          }
                        }}
                        size={15}
                        className={`cursor-pointer ${
                          params.data?.estado_de_compra ===
                          EstadoDeCompra.Creado
                            ? 'text-cyan-600'
                            : 'text-gray-500'
                        } hover:scale-105 transition-all active:scale-95 min-w-fit`}
                      />
                    </Tooltip>
                  )}
                  {can(permissions.RECEPCION_ALMACEN_FINALIZAR) &&
                    params.data?.estado_de_compra === EstadoDeCompra.Creado && (
                      <Tooltip title='Finalizar Recepción'>
                        <Popconfirm
                          title='Finalizar Recepción'
                          description={`¿Estas seguro de marcar la recepción de almacén de esta compra como Finalizado?`}
                          onConfirm={() =>
                            updateMutation.mutate({
                              id: params.value,
                              data: { estado_de_compra: EstadoDeCompra.Procesado },
                            })
                          }
                          okText='Si'
                          cancelText='No'
                        >
                          <FaFlag
                            className={`cursor-pointer text-green-600 hover:scale-105 transition-all active:scale-95 min-w-fit`}
                            size={15}
                          />
                        </Popconfirm>
                      </Tooltip>
                    )}
                </ColumnAction>
              )
            },
          },
        ]
      : []) as ColDef<Compra>[]),
  ]
  return columns
}

function getSubTotal(productos: Compra['productos_por_almacen']) {
  if (!productos || productos.length === 0) return '0'

  let total = 0
  for (const item of productos) {
    const costo = Number(item.costo ?? 0)
    for (const u of item.unidades_derivadas ?? []) {
      const cantidad = Number(u.cantidad ?? 0)
      const factor = Number(u.factor ?? 0)
      const flete = Number(u.flete ?? 0)
      const bonificacion = Boolean(u.bonificacion)
      const montoLinea = (bonificacion ? 0 : costo * cantidad * factor) + flete
      total += montoLinea
    }
  }

  return total.toFixed(2)
}
