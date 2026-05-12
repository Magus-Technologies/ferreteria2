'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from 'use-debounce'
import { DatePicker, Select, Tag } from 'antd'
import { FaMoneyBillWave, FaSearch, FaArrowUp, FaArrowDown } from 'react-icons/fa'
import { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import { formatFechaPeru } from '~/utils/fechas'
import TableWithTitle from '~/components/tables/table-with-title'
import { blueColors } from '~/lib/colors'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { kardexApi, type MovimientoKardex } from '~/lib/api/kardex'
import ButtonBase from '~/components/buttons/button-base'
import { subCajaApi } from '~/lib/api/sub-caja'
import { usuariosApi } from '~/lib/api/usuarios'

const { RangePicker } = DatePicker

const tipoColors: Record<string, string> = {
  VENTA: 'blue',
  COBRO: 'cyan',
  'COBRO ANULADO': 'red',
  COMPRA: 'red',
  'PAGO ANULADO': 'orange',
  ING_EXTRA: 'green',
  GAS_EXTRA: 'orange',
}

const tipoLabels: Record<string, string> = {
  VENTA: 'Venta',
  COBRO: 'Cobro',
  'COBRO ANULADO': 'Cobro Anulado',
  COMPRA: 'Compra',
  'PAGO ANULADO': 'Pago Anulado',
  ING_EXTRA: 'Ingreso Extra',
  GAS_EXTRA: 'Gasto Extra',
}

export default function KardexFinanzasView() {
  const [desplieguePagoId, setDesplieguePagoId] = useState<string>('')
  const [vendedorId, setVendedorId] = useState<string>('')
  const [fechas, setFechas] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([dayjs(), dayjs()])
  const [searchText, setSearchText] = useState('')
  const [debouncedSearchText] = useDebounce(searchText, 300)
  const isSearching = searchText !== debouncedSearchText
  const [searchKey, setSearchKey] = useState(0)

  // Ensure Responsable column is visible by default
  useEffect(() => {
    const storageKey = 'ag-grid-state-kardex.finanzas.movimientos'
    try {
      // Clear localStorage to force default columns on first load
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }, [])

  // Consultas para filtros
  const { data: desplieguesData } = useQuery({
    queryKey: ['metodos-pago-ventas'],
    queryFn: async () => {
      const result = await subCajaApi.getMetodosParaVentas()
      return result.data?.data || []
    }
  })

  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios-all-activos'],
    queryFn: async () => {
      const result = await usuariosApi.getAll({ estado: true })
      return result.data?.data || []
    }
  })

  const { data, isFetching } = useQuery({
    queryKey: [QueryKeys.KARDEX_FINANZAS, desplieguePagoId, vendedorId, fechas?.[0]?.format('YYYY-MM-DD'), fechas?.[1]?.format('YYYY-MM-DD'), searchKey],
    queryFn: async () => {
      const result = await kardexApi.getMovimientosFinanzas({
        metodo_pago_id: desplieguePagoId || undefined,
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
      headerName: 'Responsable / Tercero',
      field: 'cliente_nombre',
      width: 300,
      minWidth: 250,
      cellRenderer: (params: any) => {
        const data = params.data as MovimientoKardex
        const tipo = data.tipo as string
        
        // Determinar qué mostrar según el tipo de transacción
        let tercero = ''
        if (tipo === 'VENTA' || tipo === 'COBRO' || tipo === 'COBRO ANULADO') {
          tercero = data.cliente_nombre || '-'
        } else if (tipo === 'COMPRA' || tipo === 'PAGO ANULADO') {
          tercero = data.proveedor_nombre || '-'
        } else {
          tercero = '-'
        }
        
        const usuario = data.usuario_nombre || '-'
        
        return (
          <div className='flex flex-col gap-0.5 h-full justify-center'>
            <div className='text-sm' style={{ color: '#059669', fontStyle: 'italic' }}>
              {tercero}
            </div>
            <div className='text-xs' style={{ color: '#7c3aed', fontStyle: 'italic' }}>
              {usuario}
            </div>
          </div>
        )
      },
    },
    {
      headerName: 'Documento',
      field: 'documento',
      flex: 1,
      minWidth: 250,
      cellStyle: { fontWeight: '500' }
    },
    {
      headerName: 'Despliegue de Pago',
      field: 'metodo_pago',
      width: 180,
      minWidth: 150,
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

  // Calcular totales
  const totalEntradas = data?.data.reduce((sum, m) => sum + Number(m.entrada ?? 0), 0) ?? 0
  const totalSalidas = data?.data.reduce((sum, m) => sum + Number(m.salida ?? 0), 0) ?? 0
  const saldoNeto = totalEntradas - totalSalidas

  return (
    <div className='flex flex-col gap-4 w-full'>
      {/* Filtros */}
      <div className='bg-white rounded-xl border p-4 flex flex-col gap-3'>
        <div className='flex items-center gap-2 mb-1'>
          <FaMoneyBillWave size={18} className='text-blue-600' />
          <span className='font-bold text-gray-800'>Kardex de Finanzas</span>
          <span className='text-xs text-gray-500'>Flujo de caja detallado</span>
        </div>

        <div className='flex flex-wrap gap-3 items-end'>
          <div>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Despliegue de Pago</label>
            <Select
              className='!min-w-[250px] !w-[250px]'
              placeholder='Todos los despliegues'
              value={desplieguePagoId}
              onChange={setDesplieguePagoId}
              options={[
                { value: '', label: 'Todos los despliegues' },
                ...(desplieguesData?.map(m => ({ 
                  value: m.despliegue_pago_id, 
                  label: m.label 
                })) || [])
              ]}
              size='middle'
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          </div>

          <div>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Responsable</label>
            <Select
              className='!min-w-[250px] !w-[250px]'
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

          <div>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Período</label>
            <RangePicker
              className='w-full'
              value={fechas}
              onChange={(dates) => setFechas(dates)}
              format='DD/MM/YYYY'
              size='middle'
            />
          </div>

          <div className='flex-1 min-w-[200px]'>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Búsqueda rápida</label>
            <div className='relative'>
              <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10' size={14} />
              <input
                type='text'
                placeholder='Buscar documento, concepto...'
                className='w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          <ButtonBase
            color='info'
            size='md'
            className='flex items-center gap-2 w-fit self-end'
            onClick={() => setSearchKey(k => k + 1)}
            loading={isFetching}
          >
            <FaSearch />
            Buscar
          </ButtonBase>
        </div>
      </div>

      {/* Resumen */}
      {data && (
        <div className='grid grid-cols-3 gap-4'>
          <div className='bg-white rounded-lg border p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <FaArrowUp className='text-emerald-600' size={16} />
              <span className='text-sm text-gray-600 font-medium'>Total Ingresos</span>
            </div>
            <div className='text-2xl font-bold text-emerald-600'>
              S/. {totalEntradas.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className='bg-white rounded-lg border p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <FaArrowDown className='text-rose-600' size={16} />
              <span className='text-sm text-gray-600 font-medium'>Total Egresos</span>
            </div>
            <div className='text-2xl font-bold text-rose-600'>
              S/. {totalSalidas.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className='bg-white rounded-lg border p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <FaMoneyBillWave className={saldoNeto >= 0 ? 'text-blue-600' : 'text-amber-600'} size={16} />
              <span className='text-sm text-gray-600 font-medium'>Balance Neto</span>
            </div>
            <div className={`text-2xl font-bold ${saldoNeto >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
              S/. {saldoNeto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className='h-[calc(100vh-480px)] min-h-[300px]'>
        <TableWithTitle<MovimientoKardex>
          id='kardex.finanzas.movimientos'
          title='Movimientos de Finanzas'
          selectionColor={blueColors[10]}
          loading={isFetching || isSearching}
          columnDefs={columns}
          rowData={data?.data || []}
          pagination={false}
          persistColumnState={true}
          quickFilterText={debouncedSearchText}
          optionsSelectColumns={[
            {
              label: 'Default',
              columns: ['Fecha', 'Tipo', 'Responsable / Tercero', 'Documento', 'Despliegue de Pago', 'Entrada', 'Salida', 'Saldo'],
            },
          ]}
        />
      </div>

      {/* Barra de estado */}
      <div className='flex-shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-1.5 min-h-[32px]'>
        {(isFetching || isSearching) && (
          <div className='text-xs text-gray-500 text-center'>
            Cargando movimientos...
          </div>
        )}
      </div>
    </div>
  )
}
