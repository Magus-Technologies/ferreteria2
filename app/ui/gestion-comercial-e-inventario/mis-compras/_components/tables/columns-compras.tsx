'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { EstadoDeCompra, TipoDocumento } from '@prisma/client'
import { IGV } from '~/lib/constantes'
import ColumnAction from '~/components/tables/column-action'
import { permissions } from '~/lib/permissions'
import usePermission from '~/hooks/use-permission'
import { Popconfirm, Tooltip } from 'antd'
import { FaTruckLoading } from 'react-icons/fa'
import {
  eliminarCompra,
  getComprasResponseProps,
  updateCompra,
} from '~/app/_actions/compra'
import { useRouter } from 'next/navigation'
import TagEstadoDeCompra from '../others/tag-estado-de-compra'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useServerMutation } from '~/hooks/use-server-mutation'
import { FaFlag } from 'react-icons/fa6'

export function useColumnsCompras({
  setCompraRecepcion,
  setOpenModal,
}: {
  setCompraRecepcion?: (compra: getComprasResponseProps | undefined) => void
  setOpenModal?: (open: boolean) => void
} = {}) {
  const router = useRouter()
  const can = usePermission()

  const { execute, loading } = useServerMutation({
    action: updateCompra,
    queryKey: [QueryKeys.COMPRAS],
    msgSuccess: `Recepción Finalizada correctamente`,
  })

  const columns: ColDef<getComprasResponseProps>[] = [
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
      headerName: 'Fecha',
      field: 'fecha',
      width: 90,
      minWidth: 90,
      type: 'date',
      filter: 'agDateColumnFilter',
    },
    {
      headerName: 'RUC',
      field: 'proveedor.ruc',
      width: 100,
      minWidth: 100,
      filter: true,
    },
    {
      headerName: 'Proveedor',
      field: 'proveedor.razon_social',
      width: 200,
      minWidth: 200,
      filter: true,
      flex: 1,
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
        value: getComprasResponseProps['productos_por_almacen']
      }) => String(Number(getSubTotal(value)) / (IGV + 1)),
      type: 'pen',
    },
    {
      headerName: 'IGV',
      field: 'productos_por_almacen',
      width: 90,
      minWidth: 90,
      valueFormatter: ({
        value,
      }: {
        value: getComprasResponseProps['productos_por_almacen']
      }) =>
        String(
          Number(getSubTotal(value)) - Number(getSubTotal(value)) / (IGV + 1)
        ),
      filter: 'agNumberColumnFilter',
      type: 'pen',
    },
    {
      headerName: 'Total',
      field: 'productos_por_almacen',
      width: 90,
      minWidth: 90,
      valueFormatter: ({
        value,
      }: {
        value: getComprasResponseProps['productos_por_almacen']
      }) => getSubTotal(value),
      filter: 'agNumberColumnFilter',
      type: 'pen',
    },
    {
      headerName: 'Forma de Pago',
      field: 'forma_de_pago',
      width: 80,
      minWidth: 80,
      filter: true,
    },
    {
      headerName: 'Total Pagado',
      field: 'productos_por_almacen',
      width: 90,
      minWidth: 90,
      valueFormatter: () => '0',
      filter: 'agNumberColumnFilter',
      type: 'pen',
    },
    {
      headerName: 'Resta',
      field: 'productos_por_almacen',
      width: 90,
      minWidth: 90,
      valueFormatter: () => '0',
      filter: 'agNumberColumnFilter',
      type: 'pen',
    },
    {
      headerName: 'Estado de Cuenta',
      field: 'productos_por_almacen',
      width: 80,
      minWidth: 80,
      valueFormatter: () => 'Pagado',
      filter: true,
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
      cellRenderer: (params: ICellRendererParams<getComprasResponseProps>) => (
        <div className='flex items-center h-full'>
          <TagEstadoDeCompra estado_de_compra={params.value}>
            {params.value}
          </TagEstadoDeCompra>
        </div>
      ),
      filter: true,
    },
    ...((setCompraRecepcion && setOpenModal
      ? [
          {
            headerName: 'Acciones',
            field: 'id',
            width: 95,
            cellRenderer: (
              params: ICellRendererParams<getComprasResponseProps>
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
                    action: eliminarCompra,
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
                            execute({
                              id: params.value,
                              data: {
                                estado_de_compra: EstadoDeCompra.Procesado,
                              },
                            })
                          }
                          okText='Finalizar'
                          cancelText='Cancelar'
                          disabled={loading}
                        >
                          <FaFlag
                            size={15}
                            className={`cursor-pointer text-rose-600 hover:scale-105 transition-all active:scale-95 min-w-fit`}
                          />
                        </Popconfirm>
                      </Tooltip>
                    )}
                </ColumnAction>
              )
            },
            type: 'actions',
          },
        ]
      : []) as ColDef<getComprasResponseProps>[]),
  ]

  return columns
}

function getSubTotal(value: getComprasResponseProps['productos_por_almacen']) {
  return String(
    value.reduce(
      (acc, item) =>
        acc +
        item.unidades_derivadas.reduce(
          (acc2, item2) =>
            acc2 +
            Number(item2.cantidad) *
              Number(item2.factor) *
              Number(item.costo) *
              (item2.bonificacion ? 0 : 1),
          0
        ),
      0
    )
  )
}
