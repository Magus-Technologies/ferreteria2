'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from 'use-debounce'
import { DatePicker, Select, Tag, Tooltip } from 'antd'
import { FaSearch, FaMoneyBillWave, FaArrowUp, FaArrowDown, FaWallet, FaUser } from 'react-icons/fa'
import { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import { formatFechaPeru } from '~/utils/fechas'
import TableWithTitle from '~/components/tables/table-with-title'
import { blueColors } from '~/lib/colors'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { kardexApi, type MovimientoKardex } from '~/lib/api/kardex'
import ButtonBase from '~/components/buttons/button-base'
import { metodoDePagoApi } from '~/lib/api/metodo-de-pago'
import { subCajaApi } from '~/lib/api/sub-caja'
import { usuariosApi } from '~/lib/api/usuarios'

const { RangePicker } = DatePicker

const tipoColors: Record<string, string> = {
  VENTA: 'blue',
  COBRO: 'cyan',
  COMPRA: 'red',
  ING_EXTRA: 'green',
  GAS_EXTRA: 'orange',
}

const tipoLabels: Record<string, string> = {
  VENTA: 'Venta',
  COBRO: 'Cobro',
  COMPRA: 'Compra',
  ING_EXTRA: 'Ingreso Extra',
  GAS_EXTRA: 'Gasto Extra',
}

export default function KardexFinanzasView() {
  const [metodoPagoId, setMetodoPagoId] = useState<string>('')
  const [subCajaId, setSubCajaId] = useState<string>('')
  const [vendedorId, setVendedorId] = useState<string>('')
  const [fechas, setFechas] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([dayjs(), dayjs()])
  const [searchText, setSearchText] = useState('')
  const [debouncedSearchText] = useDebounce(searchText, 300)
  const isSearching = searchText !== debouncedSearchText
  const [searchKey, setSearchKey] = useState(0)

  // Consultas para filtros
  const { data: metodosData } = useQuery({
    queryKey: ['metodos-pago-all'],
    queryFn: async () => {
      const result = await metodoDePagoApi.getAll()
      return result.data?.data || []
    }
  })

  // Para sub-cajas, necesitamos una caja principal. Como esto es reporte general, tal vez listar todas?
  // Pero la API de sub-cajas suele pedir ID de principal.
  // Por ahora buscaremos las sub-cajas activas si hay alguna forma, o simplemente el filtro de método de pago.
  // Actualización: Usaremos los métodos de pago como filtro principal.

  const { data: usuariosData } = useQuery({
    queryKey: ['vendedores-all'],
    queryFn: async () => {
      const result = await usuariosApi.getAll({ rol_sistema: 'VENDEDOR' })
      return result.data?.data || []
    }
  })

  const { data: kardexData, isFetching } = useQuery({
    queryKey: [QueryKeys.KARDEX_FINANZAS, metodoPagoId, subCajaId, vendedorId, fechas?.[0]?.format('YYYY-MM-DD'), fechas?.[1]?.format('YYYY-MM-DD'), searchKey],
    queryFn: async () => {
      const result = await kardexApi.getMovimientosFinanzas({
        metodo_pago_id: metodoPagoId || undefined,
        sub_caja_id: subCajaId || undefined,
        vendedor_id: vendedorId || undefined,
        desde: fechas?.[0]?.format('YYYY-MM-DD'),
        hasta: fechas?.[1]?.format('YYYY-MM-DD'),
        per_page: -1,
      })
      if (result.error) throw new Error(result.error.message)
      return result.data!
    },
    staleTime: 0,
  })

  const columns: ColDef<MovimientoKardex>[] = [
    {
      headerName: 'Fecha',
      field: 'fecha',
      width: 200,
      minWidth: 180,
      sortable: true,
      valueFormatter: (params) => formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm:ss A') || '-',
    },
    {
      headerName: 'Tipo',
      field: 'tipo',
      width: 120,
      minWidth: 110,
      cellRenderer: (params: any) => {
        const tipo = params.value as string
        return (
          <div className='flex items-center h-full'>
            <Tag color={tipoColors[tipo] || 'default'} className='!m-0 font-medium'>
              {tipoLabels[tipo] || tipo}
            </Tag>
          </div>
        )
      },
    },
    {
      headerName: 'Documento / Concepto',
      field: 'documento',
      flex: 1,
      minWidth: 250,
      cellStyle: { fontWeight: '500' }
    },
    {
      headerName: 'Método de Pago',
      field: 'metodo_pago' as any,
      width: 180,
      minWidth: 150,
      cellRenderer: (params: any) => (
        <div className='flex items-center gap-2 h-full'>
          <FaWallet size={12} className='text-gray-400' />
          <span>{params.value || '-'}</span>
        </div>
      )
    },
    {
      headerName: 'Entrada',
      field: 'entrada',
      width: 120,
      minWidth: 100,
      type: 'numericColumn',
      cellStyle: { color: '#16a34a', fontWeight: 'bold' },
      valueFormatter: (params) => params.value > 0 ? `S/. ${Number(params.value).toFixed(2)}` : '-',
    },
    {
      headerName: 'Salida',
      field: 'salida',
      width: 120,
      minWidth: 100,
      type: 'numericColumn',
      cellStyle: { color: '#dc2626', fontWeight: 'bold' },
      valueFormatter: (params) => params.value > 0 ? `S/. ${Number(params.value).toFixed(2)}` : '-',
    },
    {
      headerName: 'Saldo',
      field: 'saldo',
      width: 130,
      minWidth: 110,
      type: 'numericColumn',
      cellStyle: { color: '#1d4ed8', fontWeight: 'bold', background: '#f8faff' },
      valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`,
    },
  ]

  // Calcular totales del set de datos actual
  const totalEntradas = kardexData?.data.reduce((sum, m) => sum + Number(m.entrada ?? 0), 0) ?? 0
  const totalSalidas = kardexData?.data.reduce((sum, m) => sum + Number(m.salida ?? 0), 0) ?? 0
  const saldoNeto = totalEntradas - totalSalidas

  return (
    <div className='flex flex-col gap-4 w-full h-full p-2 bg-[#f8fafc]'>
      {/* Cabecera y Filtros en una sola línea */}
      <div className='flex flex-col gap-4 py-2'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-blue-100 rounded-lg'>
            <FaMoneyBillWave size={20} className='text-blue-600' />
          </div>
          <div>
            <h1 className='text-xl font-bold text-slate-800 leading-none'>Kardex de Finanzas</h1>
            <p className='text-xs text-slate-500 mt-1'>Flujo de caja detallado por cuentas y usuarios</p>
          </div>
        </div>

        <div className='flex flex-wrap items-end gap-3 w-full'>
          <div className='flex-1 min-w-[180px] space-y-1.5'>
            <label className='text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-2 px-1'>
              <FaWallet className='text-blue-400' /> Cuenta / Banco
            </label>
            <Select
              className='w-full'
              placeholder='Todos los bancos'
              value={metodoPagoId}
              onChange={setMetodoPagoId}
              options={[
                { value: '', label: 'Todos los bancos' },
                ...(metodosData?.map(m => ({ value: m.id, label: m.name })) || [])
              ]}
              size='middle'
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          </div>

          <div className='flex-1 min-w-[180px] space-y-1.5'>
            <label className='text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-2 px-1'>
              <FaUser className='text-blue-400' /> Responsable
            </label>
            <Select
              className='w-full'
              placeholder='Todos los usuarios'
              value={vendedorId}
              onChange={setVendedorId}
              options={[
                { value: '', label: 'Todos los usuarios' },
                ...(usuariosData?.map(u => ({ value: u.id, label: u.name })) || [])
              ]}
              size='middle'
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          </div>

          <div className='flex-1 min-w-[220px] space-y-1.5'>
            <label className='text-[10px] uppercase tracking-wider font-bold text-slate-400 px-1'>Período</label>
            <RangePicker
              className='w-full'
              value={fechas}
              onChange={(dates) => setFechas(dates)}
              format='DD/MM/YYYY'
              size='middle'
            />
          </div>

          <div className='flex-[2] min-w-[300px] space-y-1.5'>
            <label className='text-[10px] uppercase tracking-wider font-bold text-slate-400 px-1'>Búsqueda rápida</label>
            <div className='relative'>
              <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10' size={14} />
              <input
                type='text'
                placeholder='Buscar por número de documento, serie, concepto o descripción...'
                className='w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          <ButtonBase
            color='info'
            size='md'
            className='flex items-center gap-2 h-[32px] mb-[2px]'
            onClick={() => setSearchKey(k => k + 1)}
            loading={isFetching}
          >
            <FaSearch size={14} />
            Actualizar
          </ButtonBase>
        </div>
      </div>

      <div className='flex flex-col lg:flex-row gap-4 flex-1'>
        {/* Columna Principal (Tabla) */}
        <div className='flex-1 h-full min-h-[600px]'>
          <TableWithTitle<MovimientoKardex>
            id='kardex.finanzas.movimientos'
            title=''
            selectionColor='#ffe4e6'
            loading={isFetching || isSearching}
            columnDefs={columns}
            rowData={kardexData?.data || []}
            pagination={false}
            persistColumnState={false}
            quickFilterText={debouncedSearchText}
          />
        </div>

        {/* Sidebar Derecha (Resumen alineado con los datos de la tabla) */}
        <div className='lg:w-80 flex flex-col gap-3 flex-shrink-0 pt-[20px]'>
          {/* Ingresos */}
          <div className='bg-white border border-slate-200 rounded-lg p-4'>
            <div className='flex items-center justify-center gap-2 mb-2'>
              <FaArrowUp className='text-emerald-600' size={16} />
              <div className='text-sm text-slate-600 font-medium'>Total Ingresos</div>
            </div>
            <div className='text-2xl font-bold text-emerald-600 text-center'>
              S/. {totalEntradas.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Egresos */}
          <div className='bg-white border border-slate-200 rounded-lg p-4'>
            <div className='flex items-center justify-center gap-2 mb-2'>
              <FaArrowDown className='text-rose-600' size={16} />
              <div className='text-sm text-slate-600 font-medium'>Total Egresos</div>
            </div>
            <div className='text-2xl font-bold text-rose-600 text-center'>
              S/. {totalSalidas.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Balance */}
          <div className='bg-white border border-slate-200 rounded-lg p-4'>
            <div className='flex items-center justify-center gap-2 mb-2'>
              <FaMoneyBillWave className={saldoNeto >= 0 ? 'text-blue-600' : 'text-amber-600'} size={16} />
              <div className='text-sm text-slate-600 font-medium'>Balance Neto</div>
            </div>
            <div className={`text-2xl font-bold ${saldoNeto >= 0 ? 'text-blue-600' : 'text-amber-600'} text-center`}>
              S/. {saldoNeto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
