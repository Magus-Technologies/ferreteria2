import { useMemo } from 'react'
import { type ColDef } from 'ag-grid-community'
import { type Compra, type ProductoAlmacenCompra } from '~/lib/api/compra'
import { toLocalString } from '~/utils/fechas'
import { TipoMoneda } from '@prisma/client'
import dayjs from 'dayjs'

export const useColumnsOrdenesCompra = (): ColDef<Compra>[] => {
  return useMemo(
    () => [
      {
        headerName: 'Tipo Doc',
        field: 'tipo_documento',
        width: 100,
        cellStyle: { textAlign: 'center' },
      },
      {
        headerName: 'Serie',
        field: 'serie',
        width: 100,
        cellStyle: { textAlign: 'center' },
      },
      {
        headerName: 'Número',
        field: 'numero',
        width: 100,
        cellStyle: { textAlign: 'center' },
      },
      {
        headerName: 'Fecha',
        field: 'fecha',
        width: 120,
        valueFormatter: params =>
          params.value
            ? toLocalString({ date: dayjs(params.value), format: 'DD/MM/YYYY' })
            : '',
        cellStyle: { textAlign: 'center' },
      },
      {
        headerName: 'Proveedor',
        field: 'proveedor.razon_social',
        width: 250,
        valueGetter: params => params.data?.proveedor?.razon_social || '',
      },
      {
        headerName: 'RUC',
        field: 'proveedor.ruc',
        width: 120,
        valueGetter: params => params.data?.proveedor?.ruc || '',
        cellStyle: { textAlign: 'center' },
      },
      {
        headerName: 'Moneda',
        field: 'tipo_moneda',
        width: 100,
        cellStyle: { textAlign: 'center' },
      },
      {
        headerName: 'Subtotal',
        width: 120,
        valueGetter: params => {
          if (!params.data) return 0
          const compra = params.data
          let total = 0

          compra.productos_por_almacen?.forEach((pac: ProductoAlmacenCompra) => {
            const costo = Number(pac.costo) || 0
            pac.unidades_derivadas?.forEach(ud => {
              const cantidad = Number(ud.cantidad) || 0
              const factor = Number(ud.factor) || 0
              const flete = Number(ud.flete) || 0
              const bonificacion = ud.bonificacion || false
              const montoLinea =
                (bonificacion ? 0 : costo * cantidad * factor) + flete
              total += montoLinea
            })
          })

          return total
        },
        valueFormatter: params => {
          const value = params.value || 0
          return `S/ ${value.toFixed(2)}`
        },
        cellStyle: { textAlign: 'right' },
      },
      {
        headerName: 'IGV',
        width: 120,
        valueGetter: params => {
          if (!params.data) return 0
          const compra = params.data
          let subtotal = 0

          compra.productos_por_almacen?.forEach((pac: ProductoAlmacenCompra) => {
            const costo = Number(pac.costo) || 0
            pac.unidades_derivadas?.forEach(ud => {
              const cantidad = Number(ud.cantidad) || 0
              const factor = Number(ud.factor) || 0
              const flete = Number(ud.flete) || 0
              const bonificacion = ud.bonificacion || false
              const montoLinea =
                (bonificacion ? 0 : costo * cantidad * factor) + flete
              subtotal += montoLinea
            })
          })

          const igv = subtotal * 0.18
          return igv
        },
        valueFormatter: params => {
          const value = params.value || 0
          return `S/ ${value.toFixed(2)}`
        },
        cellStyle: { textAlign: 'right' },
      },
      {
        headerName: 'Total',
        width: 120,
        valueGetter: params => {
          if (!params.data) return 0
          const compra = params.data
          let subtotal = 0

          compra.productos_por_almacen?.forEach((pac: ProductoAlmacenCompra) => {
            const costo = Number(pac.costo) || 0
            pac.unidades_derivadas?.forEach(ud => {
              const cantidad = Number(ud.cantidad) || 0
              const factor = Number(ud.factor) || 0
              const flete = Number(ud.flete) || 0
              const bonificacion = ud.bonificacion || false
              const montoLinea =
                (bonificacion ? 0 : costo * cantidad * factor) + flete
              subtotal += montoLinea
            })
          })

          const percepcion = Number(compra.percepcion) || 0
          const totalConPercepcion = subtotal + percepcion
          const tipoCambio = Number(compra.tipo_de_cambio) || 1
          const totalSoles =
            compra.tipo_moneda === TipoMoneda.Soles
              ? totalConPercepcion
              : totalConPercepcion * tipoCambio

          return totalSoles
        },
        valueFormatter: params => {
          const value = params.value || 0
          return `S/ ${value.toFixed(2)}`
        },
        cellStyle: { textAlign: 'right', fontWeight: 'bold' },
      },
      {
        headerName: 'Estado',
        field: 'estado_de_compra',
        width: 120,
        cellStyle: { textAlign: 'center' },
      },
    ] as ColDef<Compra>[],
    []
  )
}
