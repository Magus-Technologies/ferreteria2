'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import dayjs from 'dayjs'
import { formatFechaPeru } from '~/utils/fechas'

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
import { recepcionAlmacenApi } from '~/lib/api/recepcion-almacen'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import useApp from 'antd/es/app/useApp'
import { useState } from 'react'
import ModalFinalizarRecepcion from '../modals/modal-finalizar-recepcion'

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
  
  const [modalFinalizarOpen, setModalFinalizarOpen] = useState(false)
  const [compraAFinalizar, setCompraAFinalizar] = useState<string | null>(null)

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

  const finalizarRecepcionMutation = useMutation({
    mutationFn: async ({ compra_id, motivo }: { compra_id: string; motivo: string }) => {
      const result = await recepcionAlmacenApi.finalizarCompra(compra_id, motivo)
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COMPRAS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.RECEPCIONES_ALMACEN] })
      message.success(data?.message || 'Recepción finalizada correctamente')
      setModalFinalizarOpen(false)
      setCompraAFinalizar(null)
      router.push('/ui/gestion-comercial-e-inventario/mis-recepciones')
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al finalizar la recepción')
    },
  })

  const handleFinalizarClick = (compraId: string) => {
    setCompraAFinalizar(compraId)
    setModalFinalizarOpen(true)
  }

  const handleFinalizarConfirm = (motivo: string) => {
    if (compraAFinalizar) {
      finalizarRecepcionMutation.mutate({ compra_id: compraAFinalizar, motivo })
    }
  }

  const columns: ColDef<Compra>[] = [
    {
      colId: 'tipo_documento',
      headerName: 'Documento',
      field: 'tipo_documento',
      width: 80,
      minWidth: 80,
      valueFormatter: ({ value }) => {
        if (value === '01') return 'Factura'
        if (value === '03') return 'Boleta'
        if (value === 'nv') return 'Nota de Venta'
        return value
      },
      filter: true,
    },
    {
      colId: 'serie',
      headerName: 'Serie',
      field: 'serie',
      width: 60,
      minWidth: 60,
      filter: true,
    },
    {
      colId: 'numero',
      headerName: 'Número',
      field: 'numero',
      width: 60,
      minWidth: 60,
      filter: 'agNumberColumnFilter',
    },
    {
      colId: 'fecha',
      headerName: 'Fecha Emisión',
      field: 'fecha',
      width: 180,
      minWidth: 180,
      sort: 'desc',
      filter: 'agDateColumnFilter',
      valueFormatter: (params) =>
        params.value ? formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm:ss A') : '-',
    },
    {
      colId: 'fecha_vencimiento',
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
      colId: 'ruc',
      headerName: 'RUC',
      field: 'proveedor.ruc',
      width: 100,
      minWidth: 100,
      filter: true,
      valueGetter: (params) => params.data?.proveedor?.ruc || '',
    },
    {
      colId: 'proveedor',
      headerName: 'Proveedor',
      field: 'proveedor.razon_social',
      width: 200,
      minWidth: 200,
      filter: true,
      flex: 1,
      valueGetter: (params) => params.data?.proveedor?.razon_social || '',
    },
    {
      colId: 'subtotal',
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
      colId: 'igv',
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
      colId: 'percepcion',
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
      colId: 'total',
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
      colId: 'forma_pago',
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
      colId: 'total_pagado',
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
      colId: 'resta',
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
      colId: 'estado_cuenta',
      headerName: 'Estado de Cuenta',
      field: 'productos_por_almacen',
      width: 120,
      minWidth: 120,
      valueFormatter: (params) => {
        // Si es contado, siempre está pagado
        if (params.data?.forma_de_pago === 'co') {
          return 'Pagado'
        }
        
        // Si es crédito, verificar si está pagado completamente
        const total = Number(getSubTotal(params.value))
        const totalPagado = Number(params.data?.total_pagado || 0)
        const resta = total - totalPagado
        
        if (resta <= 0.01) { // Tolerancia de 1 centavo
          return 'Pagado'
        } else {
          return 'Crédito'
        }
      },
      filter: true,
      cellRenderer: (params: ICellRendererParams<Compra>) => {
        // Si es contado, siempre está pagado
        if (params.data?.forma_de_pago === 'co') {
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
              <span className='px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800'>
                Crédito
              </span>
            </div>
          )
        }
      },
    },
    {
      colId: 'registrador',
      headerName: 'Registrador',
      field: 'user.name',
      width: 80,
      minWidth: 80,
      filter: true,
    },
    {
      colId: 'orden_compra',
      headerName: 'Orden de Compra',
      field: 'orden_compra',
      width: 130,
      minWidth: 130,
      filter: true,
      valueGetter: (params) => {
        // Intentar acceder a la relación en diferentes formatos
        const ordenCompra = params.data?.orden_compra || params.data?.['orden_compra']
        return ordenCompra?.codigo ?? ''
      },
      cellRenderer: (params: ICellRendererParams<Compra>) => {
        // Intentar acceder a la relación en diferentes formatos
        const ordenCompra = params.data?.orden_compra || params.data?.['orden_compra']
        const codigo = ordenCompra?.codigo
        
        if (!codigo) return <div className='flex items-center h-full text-slate-300 text-xs'>—</div>
        return (
          <div className='flex items-center h-full'>
            <span className='px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200'>
              {codigo}
            </span>
          </div>
        )
      },
    },
    {
      colId: 'estado_documento',
      headerName: 'Estado de Compra',
      field: 'estado_de_compra',
      width: 130,
      minWidth: 130,
      cellRenderer: (params: ICellRendererParams<Compra>) => {
        let nombre = '';
        let colorObj = { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };

        switch (params.value) {
          case 'an':
            nombre = 'Anulado';
            colorObj = { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
            break;
          case 'ee':
            nombre = 'En Espera';
            colorObj = { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
            break;
          case 'cr':
          case 'pr':
            nombre = 'Registrado';
            colorObj = { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
            break;
          default:
            nombre = params.value;
            break;
        }

        return (
          <div className='flex items-center h-full'>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${colorObj.bg} ${colorObj.text} ${colorObj.border}`}>
              {nombre}
            </span>
          </div>
        );
      },
      filter: true,
    },
    {
      colId: 'estado_recepcion',
      headerName: 'Ingreso a Almacén',
      field: 'estado_de_compra',
      width: 140,
      minWidth: 140,
      cellRenderer: (params: ICellRendererParams<Compra>) => {
        let nombre = '';
        let colorObj = { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };

        if (params.value === 'cr') {
          nombre = 'Pendiente';
          colorObj = { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
        } else if (params.value === 'pr') {
          nombre = 'Recepcionado';
          colorObj = { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
        } else {
          return <div className='flex items-center h-full text-slate-400 text-xs text-center w-full justify-center'>—</div>;
        }

        return (
          <div className='flex items-center h-full'>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded border flex items-center gap-1 ${colorObj.bg} ${colorObj.text} ${colorObj.border}`}>
              <FaTruckLoading size={12} />
              {nombre}
            </span>
          </div>
        );
      },
      filter: true,
    },
    ...((setCompraRecepcion && setOpenModal
      ? [
          {
            colId: 'acciones',
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
                  showDelete={params.data?.estado_de_compra !== 'an'}
                  propsDelete={{
                    disabled: params.data?.estado_de_compra === 'pr',
                    disabledTooltip:
                      'No se puede anular: la compra ya tiene productos recepcionados en almacén',
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
                        params.data?.estado_de_compra === 'cr'
                          ? 'Recepcionar en Almacén'
                          : params.data?.estado_de_compra === 'pr'
                          ? 'Recepcionada en Almacén'
                          : 'No se puede Recepcionar'
                      }
                    >
                      <FaTruckLoading
                        onClick={() => {
                          if (params.data?.estado_de_compra === 'cr') {
                            setCompraRecepcion(params.data)
                            setOpenModal(true)
                          }
                        }}
                        size={15}
                        className={`cursor-pointer ${
                          params.data?.estado_de_compra === 'cr'
                            ? 'text-cyan-600'
                            : 'text-gray-500'
                        } hover:scale-105 transition-all active:scale-95 min-w-fit`}
                      />
                    </Tooltip>
                  )}
                  {can(permissions.RECEPCION_ALMACEN_FINALIZAR) &&
                    params.data?.estado_de_compra === 'cr' && (
                      <Tooltip title='Finalizar Recepción (marca como finalizados los productos no recibidos)'>
                        <FaFlag
                          onClick={() => handleFinalizarClick(params.value)}
                          className='cursor-pointer text-green-600 hover:scale-105 transition-all active:scale-95 min-w-fit'
                          size={15}
                        />
                      </Tooltip>
                    )}
                </ColumnAction>
              )
            },
          },
        ]
      : []) as ColDef<Compra>[]),
  ]
  
  return {
    columns,
    modalElement: (
      <ModalFinalizarRecepcion
        open={modalFinalizarOpen}
        onCancel={() => {
          setModalFinalizarOpen(false)
          setCompraAFinalizar(null)
        }}
        onConfirm={handleFinalizarConfirm}
        loading={finalizarRecepcionMutation.isPending}
      />
    )
  }
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
