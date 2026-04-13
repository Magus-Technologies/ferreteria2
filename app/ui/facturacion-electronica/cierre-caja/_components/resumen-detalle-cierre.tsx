'use client'

import { Tabs } from 'antd'
import TabVentas from './tabs/tab-ventas'
import TabMetodosPago from './tabs/tab-metodos-pago'
import TabOtrosIngresos from './tabs/tab-otros-ingresos'
import TabPrestamosRecibidos from './tabs/tab-prestamos-recibidos'
import TabGastos from './tabs/tab-gastos'
import TabPrestamosDados from './tabs/tab-prestamos-dados'
import TabMovimientos from './tabs/tab-movimientos'
import TabBancos from './tabs/tab-bancos'
import TabResumenFinal from './tabs/tab-resumen-final'
import TabIngresosOperativos from './tabs/tab-ingresos-operativos'
import TabGastosOperativos from './tabs/tab-gastos-operativos'
import TabCuentasPorPagar from './tabs/tab-cuentas-por-pagar'
import TabCobrosCreditos from './tabs/tab-cobros-creditos'

interface ResumenDetalleCierreProps {
  resumen: any
  montoEsperado: number
  fecha?: string
}

export default function ResumenDetalleCierre({ resumen, montoEsperado, fecha }: ResumenDetalleCierreProps) {
  const ventasData = resumen.detalle_ventas || []
  const metodosPagoData = resumen.detalle_metodos_pago || []
  const otrosIngresosData = resumen.detalle_ingresos ? Object.values(resumen.detalle_ingresos) : []
  const ingresosExtrasData = resumen.detalle_ingresos_extras ? Object.values(resumen.detalle_ingresos_extras) : []
  const prestamosRecibidosData = resumen.prestamos_recibidos || []
  const gastosData = resumen.detalle_egresos ? Object.values(resumen.detalle_egresos) : []
  const gastosExtrasData = resumen.detalle_gastos_extras ? Object.values(resumen.detalle_gastos_extras) : []
  const prestamosDadosData = resumen.prestamos_dados || []
  const movimientosData = resumen.movimientos_internos || []
  const bancosData = resumen.resumen_bancos || []

  const totalOtrosIngresos = resumen.total_otros_ingresos || 0
  const totalIngresosExtras = resumen.total_ingresos_extras || 0
  const totalGastos = resumen.total_gastos || 0
  const totalGastosExtras = resumen.total_gastos_extras || 0

  const items = [
    {
      key: '1',
      label: `Ventas del Día (${ventasData.length})`,
      children: <TabVentas data={ventasData} totalVentas={resumen.total_ventas} />,
    },
    {
      key: '2',
      label: `Cobros por Método de Pago (${metodosPagoData.length})`,
      children: <TabMetodosPago data={metodosPagoData} totalVentas={resumen.total_ventas} />,
    },
    {
      key: 'extras_in',
      label: `Ingresos Extras (${ingresosExtrasData.length})`,
      children: <TabOtrosIngresos data={ingresosExtrasData} total={totalIngresosExtras} />,
    },
    {
      key: '4',
      label: `Préstamos Recibidos (${prestamosRecibidosData.length})`,
      children: <TabPrestamosRecibidos data={prestamosRecibidosData} total={resumen.total_prestamos_recibidos} />,
    },
    {
      key: 'extras_out',
      label: `Gastos Extras (${gastosExtrasData.length})`,
      children: <TabGastos data={gastosExtrasData} total={totalGastosExtras} />,
    },
    {
      key: '6',
      label: `Préstamos Dados (${prestamosDadosData.length})`,
      children: <TabPrestamosDados data={prestamosDadosData} total={resumen.total_prestamos_dados} />,
    },
    {
      key: '7',
      label: `Movimientos Internos (${movimientosData.length})`,
      children: <TabMovimientos data={movimientosData} />,
    },
    {
      key: '8',
      label: `Resumen de Bancos (${bancosData.length})`,
      children: <TabBancos data={bancosData} />,
    },
    {
      key: '9',
      label: 'Resumen Final',
      children: <TabResumenFinal resumen={resumen} montoEsperado={montoEsperado} />,
    },
    ...(fecha ? [
      {
        key: '10',
        label: 'Ingresos Operativos',
        children: <TabIngresosOperativos fecha={fecha} />,
      },
      {
        key: '11',
        label: 'Gastos Operativos',
        children: <TabGastosOperativos fecha={fecha} />,
      },
      {
        key: '12',
        label: 'Cuentas por Pagar',
        children: <TabCuentasPorPagar />,
      },
      {
        key: '13',
        label: 'Cobros de Créditos',
        children: <TabCobrosCreditos fecha={fecha} />,
      },
    ] : []),
  ]

  return (
    <div className='p-4'>
      <Tabs defaultActiveKey='1' items={items} />
    </div>
  )
}
