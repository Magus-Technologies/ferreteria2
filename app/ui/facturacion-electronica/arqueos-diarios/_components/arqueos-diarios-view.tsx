'use client'

import { useRef, useState } from 'react'
import FiltrosArqueos from './filtros-arqueos'
import { cajaApi } from '~/lib/api/caja'
import { Spin, Tabs, Tag, Tooltip } from 'antd'
import { FaEye } from 'react-icons/fa'
import { useQuery } from '@tanstack/react-query'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import TableBase from '~/components/tables/table-base'
import TabVentas from '~/app/ui/facturacion-electronica/cierre-caja/_components/tabs/tab-ventas'
import TabMetodosPago from '~/app/ui/facturacion-electronica/cierre-caja/_components/tabs/tab-metodos-pago'
import TabOtrosIngresos from '~/app/ui/facturacion-electronica/cierre-caja/_components/tabs/tab-otros-ingresos'
import TabPrestamosRecibidos from '~/app/ui/facturacion-electronica/cierre-caja/_components/tabs/tab-prestamos-recibidos'
import TabGastos from '~/app/ui/facturacion-electronica/cierre-caja/_components/tabs/tab-gastos'
import TabPrestamosDados from '~/app/ui/facturacion-electronica/cierre-caja/_components/tabs/tab-prestamos-dados'
import TabMovimientos from '~/app/ui/facturacion-electronica/cierre-caja/_components/tabs/tab-movimientos'
import TabBancos from '~/app/ui/facturacion-electronica/cierre-caja/_components/tabs/tab-bancos'
import TabResumenFinal from '~/app/ui/facturacion-electronica/cierre-caja/_components/tabs/tab-resumen-final'
import TabIngresosOperativos from '~/app/ui/facturacion-electronica/cierre-caja/_components/tabs/tab-ingresos-operativos'
import TabGastosOperativos from '~/app/ui/facturacion-electronica/cierre-caja/_components/tabs/tab-gastos-operativos'
import TabCuentasPorPagar from '~/app/ui/facturacion-electronica/cierre-caja/_components/tabs/tab-cuentas-por-pagar'
import TabCobrosCreditos from '~/app/ui/facturacion-electronica/cierre-caja/_components/tabs/tab-cobros-creditos'
import { useStoreFiltrosArqueos } from '../_store/store-filtros-arqueos'
import dayjs from 'dayjs'

const columnasArqueos: ColDef[] = [
  {
    headerName: 'Vendedor',
    valueGetter: p => p.data.vendedor?.name || p.data.user?.name || 'N/A',
    flex: 1,
  },
  {
    headerName: 'Caja',
    valueGetter: p => p.data.caja_principal?.nombre || 'N/A',
    width: 160,
  },
  {
    headerName: 'Fecha',
    field: 'fecha_apertura',
    width: 120,
    valueFormatter: p => p.value ? dayjs(p.value).format('DD/MM/YYYY') : 'N/A',
  },
  {
    headerName: 'Estado',
    field: 'estado',
    width: 110,
    cellRenderer: (p: { value: string }) => {
      const color = p.value === 'cerrada' ? 'green' : 'orange'
      return <Tag color={color}>{p.value === 'cerrada' ? 'Cerrada' : 'Abierta'}</Tag>
    },
  },
  {
    headerName: 'Monto Apertura',
    field: 'monto_apertura',
    width: 140,
    valueFormatter: p => `S/. ${Number(p.value || 0).toFixed(2)}`,
    cellStyle: { textAlign: 'right' },
  },
  {
    headerName: 'Monto Cierre',
    field: 'monto_cierre',
    width: 130,
    valueFormatter: p => p.value ? `S/. ${Number(p.value).toFixed(2)}` : '—',
    cellStyle: { textAlign: 'right', fontWeight: 'bold' },
  },
  {
    headerName: '',
    width: 60,
    cellRenderer: () => (
      <div className='h-full flex items-center justify-center'>
        <Tooltip title='Ver detalle'>
          <button className='text-amber-600 hover:text-amber-800 cursor-pointer'>
            <FaEye size={16} />
          </button>
        </Tooltip>
      </div>
    ),
  },
]

export default function ArqueosDiariosView() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gridRef = useRef<AgGridReact<any>>(null)
  const filtros = useStoreFiltrosArqueos(state => state.filtros)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [arqueoSeleccionado, setArqueoSeleccionado] = useState<any>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resumenDetalle, setResumenDetalle] = useState<any>(null)
  const [fechaDetalle, setFechaDetalle] = useState<string | undefined>(undefined)

  const { data: arqueosData, isLoading: loadingArqueos } = useQuery({
    queryKey: ['arqueos-diarios', filtros.fecha_inicio, filtros.fecha_fin, filtros.user_id],
    queryFn: async () => {
      const res = await cajaApi.historialTodas({
        fecha_inicio: filtros.fecha_inicio,
        fecha_fin: filtros.fecha_fin,
        user_id: filtros.user_id,
        per_page: 200,
      })
      return res.data?.data || []
    },
    refetchOnWindowFocus: false,
  })

  const arqueos = arqueosData || []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleVerDetalle = async (arqueo: any) => {
    const cierreId = arqueo.id
    setArqueoSeleccionado(arqueo)
    setResumenDetalle(null)
    setFechaDetalle(undefined)
    setLoadingDetalle(true)
    try {
      const res = await cajaApi.obtenerCierre(String(cierreId))
      const cierreData = res.data?.data
      setResumenDetalle(cierreData?.resumen || null)
      setFechaDetalle(cierreData?.fecha_apertura || arqueo.fecha_arqueo || arqueo.fecha_cierre)
    } finally {
      setLoadingDetalle(false)
    }
  }

  // Cuando hay fila seleccionada: usa su fecha y su usuario específico
  // Sin selección: usa los filtros globales (fecha rango + usuario)
  const fechaInicioTabs = arqueoSeleccionado
    ? dayjs(arqueoSeleccionado.fecha_apertura).format('YYYY-MM-DD')
    : (filtros.fecha_inicio || dayjs().format('YYYY-MM-DD'))
  const fechaFinTabs = arqueoSeleccionado
    ? dayjs(arqueoSeleccionado.fecha_apertura).format('YYYY-MM-DD')
    : (filtros.fecha_fin || filtros.fecha_inicio || dayjs().format('YYYY-MM-DD'))
  const userIdParaTabs = arqueoSeleccionado?.vendedor_id || arqueoSeleccionado?.user_id || filtros.user_id || undefined

  const ventasData = resumenDetalle?.detalle_ventas || []
  const metodosPagoData = resumenDetalle?.detalle_metodos_pago || []
  const otrosIngresosData = resumenDetalle?.detalle_ingresos ? Object.values(resumenDetalle.detalle_ingresos) : []
  const prestamosRecibidosData = resumenDetalle?.prestamos_recibidos || []
  const gastosData = resumenDetalle?.detalle_egresos ? Object.values(resumenDetalle.detalle_egresos) : []
  const prestamosDadosData = resumenDetalle?.prestamos_dados || []
  const movimientosData = resumenDetalle?.movimientos_internos || []
  const bancosData = resumenDetalle?.resumen_bancos || []

  const totalOtrosIngresos = (resumenDetalle?.total_ingresos || 0) - (resumenDetalle?.total_ventas || 0) - (resumenDetalle?.total_prestamos_recibidos || 0)
  const totalGastos = (resumenDetalle?.total_egresos || 0) - (resumenDetalle?.total_prestamos_dados || 0)
  const montoEsperado = resumenDetalle
    ? Number(resumenDetalle.efectivo_inicial || 0) + Number(resumenDetalle.total_ingresos || 0) - Number(resumenDetalle.total_egresos || 0)
    : 0

  const detalleTabItems = [
    {
      key: '1',
      label: `Ventas del Día (${ventasData.length})`,
      children: <TabVentas data={ventasData} totalVentas={resumenDetalle?.total_ventas || 0} />,
    },
    {
      key: '2',
      label: `Cobros por Método de Pago (${metodosPagoData.length})`,
      children: <TabMetodosPago data={metodosPagoData} totalVentas={resumenDetalle?.total_ventas || 0} />,
    },
    {
      key: '3',
      label: `Otros Ingresos (${otrosIngresosData.length})`,
      children: <TabOtrosIngresos data={otrosIngresosData} total={totalOtrosIngresos} />,
    },
    {
      key: '4',
      label: `Préstamos Recibidos (${prestamosRecibidosData.length})`,
      children: <TabPrestamosRecibidos data={prestamosRecibidosData} total={resumenDetalle?.total_prestamos_recibidos || 0} />,
    },
    {
      key: '5',
      label: `Gastos (${gastosData.length})`,
      children: <TabGastos data={gastosData} total={totalGastos} />,
    },
    {
      key: '6',
      label: `Préstamos Dados (${prestamosDadosData.length})`,
      children: <TabPrestamosDados data={prestamosDadosData} total={resumenDetalle?.total_prestamos_dados || 0} />,
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
      label: 'Ingresos Operativos',
      children: <TabIngresosOperativos fecha={fechaInicioTabs} fecha_fin={fechaFinTabs} user_id={userIdParaTabs} />,
    },
    {
      key: '10',
      label: 'Gastos Operativos',
      children: <TabGastosOperativos fecha={fechaInicioTabs} fecha_fin={fechaFinTabs} user_id={userIdParaTabs} />,
    },
    {
      key: '11',
      label: 'Cuentas por Pagar',
      children: <TabCuentasPorPagar />,
    },
    {
      key: '12',
      label: 'Cobros de Créditos',
      children: <TabCobrosCreditos fecha={fechaInicioTabs} fecha_fin={fechaFinTabs} user_id={userIdParaTabs} />,
    },
    {
      key: '13',
      label: 'Resumen Final',
      children: <TabResumenFinal resumen={resumenDetalle || { efectivo_inicial: 0, total_ingresos: 0, total_egresos: 0 }} montoEsperado={montoEsperado} />,
    },
  ]

  return (
    <div className='w-full space-y-4 pb-12'>
      <FiltrosArqueos />

      {/* Tabla de arqueos */}
      <div className='h-[220px] w-full mt-6'>
        <TableBase<any>
          ref={gridRef}
          rowData={arqueos}
          columnDefs={columnasArqueos}
          rowSelection={false}
          withNumberColumn={true}
          headerColor='var(--color-amber-600)'
          loading={loadingArqueos}
          onRowClicked={e => e.data && handleVerDetalle(e.data)}
          rowStyle={{ cursor: 'pointer' }}
        />
      </div>

      {/* Arqueo seleccionado */}
      {arqueoSeleccionado && (
        <div className='flex items-center gap-3 px-1 text-sm'>
          <span className='font-bold text-slate-800'>
            {arqueoSeleccionado.vendedor?.name || arqueoSeleccionado.user?.name || 'Vendedor'}
          </span>
          <span className='text-slate-500'>
            — {arqueoSeleccionado.caja_principal?.nombre || ''}
            {fechaDetalle ? ` — ${dayjs(fechaDetalle).format('DD/MM/YYYY')}` : ''}
          </span>
          {loadingDetalle && <Spin size='small' />}
          <button
            onClick={() => { setArqueoSeleccionado(null); setResumenDetalle(null); setFechaDetalle(undefined) }}
            className='text-xs text-slate-400 hover:text-slate-600 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors ml-2'
          >
            Limpiar ✕
          </button>
        </div>
      )}

      <Tabs defaultActiveKey='1' items={detalleTabItems} />
    </div>
  )
}
