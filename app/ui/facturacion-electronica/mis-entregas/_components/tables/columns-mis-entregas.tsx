'use client'

import { ColDef } from 'ag-grid-community'
import { formatFechaPeru } from '~/utils/fechas'
import CellAccionesEntrega from './cell-acciones-entrega'
import {
  TIPO_ENTREGA_LABEL_CON_ICON,
  TIPO_DESPACHO_LABEL_CON_ICON,
} from '~/app/_lib/entrega-labels'
import {
  isEntregaParcialAgrupada,
} from '../../_lib/entregas-parciales'

/**
 * Formatea una hora "HH:mm[:ss]" (columna SQL `time`) a 12 horas con AM/PM.
 * Ej: "20:30:00" -> "8:30 PM", "08:05" -> "8:05 AM".
 */
function formatHora12(hora?: string | null): string | null {
  if (!hora) return null
  const [h, m] = hora.split(':')
  const hour = Number(h)
  if (Number.isNaN(hour)) return null
  const sufijo = hour < 12 ? 'AM' : 'PM'
  const hora12 = hour % 12 || 12
  return `${hora12}:${m ?? '00'} ${sufijo}`
}

/** "HH:MM" → minutos desde medianoche. Null si no es una hora válida. */
function aMinutos(hora?: string | null): number | null {
  if (!hora) return null
  const [h, m] = String(hora).split(':')
  const hh = Number(h)
  const mm = Number(m ?? 0)
  if (Number.isNaN(hh)) return null
  return hh * 60 + (Number.isNaN(mm) ? 0 : mm)
}

/** Minutos desde medianoche → "HH:MM". */
function aHHMM(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Hora en que se REGISTRÓ la entrega, en minutos.
 *
 * Para un despacho en tienda no hay franja programada porque se entrega en el
 * momento: su hora real es la de creación.
 */
function minutosDeRegistro(entrega: any): number | null {
  const iso = entrega?.created_at
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.getHours() * 60 + d.getMinutes()
}

/**
 * Valor por el que se ORDENA la columna Horario: la franja programada si
 * existe, y si no la hora de registro. Así todas las filas tienen un valor
 * comparable y el orden refleja la secuencia real del día — que es lo que
 * permite ver de un vistazo dos entregas pisadas a la misma hora.
 */
function minutosHorarioEntrega(entrega: any): number | null {
  return aMinutos(entrega?.hora_inicio) ?? minutosDeRegistro(entrega)
}

export function useColumnsMisEntregas(onRefetch?: () => void) {
  const columnDefs: ColDef<any>[] = [
    {
      // Indicador visual de rol: barra de color fija en el extremo izquierdo.
      // No usa boxShadow ni borderLeft (AG Grid los tapa con el bg de celda).
      // Purple = ORDEN (madre), Blue = DESPACHO (hija).
      headerName: '',
      colId: 'rol_indicator',
      width: 5,
      minWidth: 5,
      maxWidth: 5,
      resizable: false,
      sortable: false,
      filter: false,
      suppressMovable: true,
      suppressSizeToFit: true,
      suppressHeaderMenuButton: true,
      pinned: 'left' as const,
      cellStyle: (params: any) => {
        const grupoId = params.data?.grupo_entrega_id
        const propio = params.data?.id
        const esHija = grupoId && Number(grupoId) !== Number(propio)
        return {
          padding: 0,
          backgroundColor: esHija ? '#1d4ed8' : '#7c3aed',
          border: 'none',
        }
      },
      cellRenderer: () => '',
    },
    {
      headerName: 'Fecha Registro',
      colId: 'fecha_creacion',
      field: 'fecha_creacion',
      width: 170,
      sort: 'desc',
      comparator: (valueA, valueB) => {
        const fechaA = new Date(valueA || 0).getTime()
        const fechaB = new Date(valueB || 0).getTime()
        return fechaA - fechaB
      },
      valueFormatter: (params) =>
        params.value ? formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm:ss A') : '-',
    },
    {
      headerName: 'N° Venta',
      colId: 'venta_numero',
      field: 'venta.serie',
      width: 150,
      valueGetter: (params) => {
        const venta = params.data?.venta
        if (!venta) return '-'
        const serie = venta.serie || ''
        const numero = venta.numero || ''
        return serie && numero ? `${serie}-${numero}` : '-'
      },
    },
    /*
    {
      headerName: 'Rol',
      colId: 'rol_entrega',
      width: 120,
      cellRenderer: (params: any) => {
        const grupoId = params.data?.grupo_entrega_id
        const propio = params.data?.id
        const esMadre = !grupoId || Number(grupoId) === Number(propio)
        if (esMadre) {
          return (
            <span style={{
              background: '#f3e8ff',
              color: '#7c3aed',
              fontWeight: 'bold',
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '9999px',
              border: '1px solid #c4b5fd',
              whiteSpace: 'nowrap',
            }}>
              📋 ORDEN
            </span>
          )
        }
        return (
          <span style={{
            background: '#dbeafe',
            color: '#1d4ed8',
            fontWeight: 'bold',
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '9999px',
            border: '1px solid #93c5fd',
            whiteSpace: 'nowrap',
          }}>
            🚚 DESPACHO
          </span>
        )
      },
    },
    */
    {
      headerName: 'Cliente',
      colId: 'cliente_nombre',
      field: 'venta.cliente',
      width: 250,
      valueGetter: (params) => {
        const cliente = params.data?.venta?.cliente
        if (!cliente) return 'SIN CLIENTE'

        const nombre = cliente.razon_social ||
          `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim()
        const documento = cliente.numero_documento || ''

        return documento ? `${documento} - ${nombre}` : nombre
      },
    },
    {
      headerName: 'Teléfono',
      colId: 'cliente_telefono',
      width: 130,
      valueGetter: (params) => {
        const cliente = params.data?.venta?.cliente
        return cliente?.telefono || '—'
      },
    },
    {
      headerName: 'Dirección',
      colId: 'direccion_entrega',
      width: 250,
      valueGetter: (params) => {
        const d = params.data
        if (d?.direccion_entrega) return d.direccion_entrega
        // Sin dirección escrita pero con GPS o referencia = domicilio ubicado
        // por mapa (regla "dirección O GPS"). Mostrar la referencia con pin para
        // que la columna no quede vacía. Recojo en tienda no tiene ubicación → "—".
        const tieneGps = d?.latitud != null && d?.longitud != null
        if (tieneGps || d?.referencia_entrega) {
          return `📍 ${d?.referencia_entrega || 'Ubicación en mapa'}`
        }
        return '—'
      },
    },
    {
      headerName: 'Referencia',
      field: 'referencia_entrega',
      width: 200,
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'Fecha Programada',
      field: 'fecha_programada',
      width: 150,
      valueFormatter: (params) =>
        params.value ? formatFechaPeru(params.value, 'DD/MM/YYYY') : '-',
    },
    {
      headerName: 'Horario',
      colId: 'horario',
      field: 'hora_inicio',
      width: 140,
      sortable: true,
      valueGetter: (params) => {
        const horaInicio = formatHora12(params.data?.hora_inicio)
        const horaFin = formatHora12(params.data?.hora_fin)

        if (horaInicio && horaFin) return `${horaInicio} - ${horaFin}`
        if (horaInicio || horaFin) return horaInicio || horaFin

        // Sin franja programada (despacho en tienda: se entrega al momento).
        // Antes iba un guion, y al ordenar por horario esas filas quedaban
        // todas juntas sin decir NADA de cuándo se despacharon. Se cae a la
        // hora en que se registró la entrega — que para una entrega inmediata
        // ES su hora real — con "~" para no confundirla con una franja pactada.
        const registrada = minutosDeRegistro(params.data)
        return registrada !== null ? `~ ${formatHora12(aHHMM(registrada))}` : '-'
      },
      // Ordenar por el VALOR de la hora, no por el texto. Como string,
      // "01:00 PM" se ordena antes que "10:00 AM" (gana el "0"), así que dos
      // entregas de las 10 AM podían quedar separadas por una de 9:15 — que es
      // justo el caso que hizo que no se viera el choque de dos pedidos a la
      // misma hora en la misma unidad.
      comparator: (_a, _b, nodeA, nodeB) => {
        const ma = minutosHorarioEntrega(nodeA?.data)
        const mb = minutosHorarioEntrega(nodeB?.data)
        if (ma === null && mb === null) return 0
        if (ma === null) return 1 // sin hora, al final
        if (mb === null) return -1
        return ma - mb
      },
    },
    {
      headerName: 'Tipo Entrega',
      field: 'tipo_entrega',
      width: 140,
      valueFormatter: (params) => {
        const tipo = params.value as string
        return TIPO_ENTREGA_LABEL_CON_ICON[tipo] || tipo || '—'
      },
      cellStyle: (params) => {
        const tipo = params.value
        if (tipo === 'rt') return { color: '#0284c7', fontWeight: 'bold' }
        if (tipo === 'de') return { color: '#7c3aed', fontWeight: 'bold' }
        if (tipo === 'pa') return { color: '#d97706', fontWeight: 'bold' }
        return null
      },
    },
    {
      headerName: 'Tipo Despacho',
      field: 'tipo_despacho',
      width: 130,
      valueFormatter: (params) => {
        if (params.data?.tipo_entrega === 'pa' && !isEntregaParcialAgrupada(params.data)) {
          if (params.value === 'pr') return TIPO_DESPACHO_LABEL_CON_ICON.pr || 'Programado'
          if (params.value === 'in') return TIPO_DESPACHO_LABEL_CON_ICON.in || 'Inmediata'
          return 'Parcial'
        }
        if (isEntregaParcialAgrupada(params.data) || params.data?.tipo_entrega === 'pa') {
          return '🔀 PARCIAL'
        }
        const tipo = params.value as string
        return TIPO_DESPACHO_LABEL_CON_ICON[tipo] || tipo || '—'
      },
      cellStyle: (params) => {
        if (params.data?.tipo_entrega === 'pa' && !isEntregaParcialAgrupada(params.data)) {
          if (params.value === 'pr') return { color: '#2563eb', fontWeight: 'bold' }
          if (params.value === 'in') return { color: '#16a34a', fontWeight: 'bold' }
          return { color: '#9333ea', fontWeight: 'bold' }
        }
        if (isEntregaParcialAgrupada(params.data) || params.data?.tipo_entrega === 'pa') {
          return { color: '#9333ea', fontWeight: 'bold' }
        }
        const tipo = params.value
        if (tipo === 'in') return { color: '#16a34a', fontWeight: 'bold' }
        if (tipo === 'pr') return { color: '#2563eb', fontWeight: 'bold' }
        return null
      },
    },
    {
      headerName: 'Vehículo',
      colId: 'vehiculo',
      field: 'vehiculo',
      width: 160,
      valueGetter: (params) => {
        const vehiculo = params.data?.vehiculo
        if (!vehiculo) return '—'
        return `${vehiculo.name}${vehiculo.placa ? ` (${vehiculo.placa})` : ''}`
      },
    },
    {
      headerName: 'Estado',
      field: 'estado_entrega',
      width: 150,
      cellRenderer: (params: any) => {
        const estado = params.value
        const estaProgramada = estado === 'pe' && params.data?.tipo_despacho === 'pr'
        // En filas individuales, "en" significa que esa entrega ya termino.
        // El pendiente global de la venta se muestra en el detalle.
        const tienePendienteAgrupado = isEntregaParcialAgrupada(params.data)
          ? (params.data?.entregas_agrupadas || []).some((e: any) => e?.estado_entrega !== 'en')
          : false
        const config: Record<string, { label: string; bg: string; text: string }> = {
          'pe': estaProgramada
            ? { label: 'Programado', bg: '#dbeafe', text: '#2563eb' }
            : { label: 'Pendiente',  bg: '#f1f5f9', text: '#475569' },
          'ec': { label: 'En Camino',  bg: '#dbeafe', text: '#2563eb' },
          'en': { label: tienePendienteAgrupado ? 'Entregado Parcial' : 'Entregado',  bg: tienePendienteAgrupado ? '#fef3c7' : '#dcfce7', text: tienePendienteAgrupado ? '#d97706' : '#16a34a' },
          'ca': { label: 'Cancelado',  bg: '#fee2e2', text: '#dc2626' },
        }
        const { label, bg, text } = config[estado] ?? { label: estado || '', bg: '#f1f5f9', text: '#475569' }
        // Si está pendiente PERO tiene motivo_anulacion, indicar al usuario
        // que esta entrega fue marcada como entregada antes y se anuló — así
        // sabe el contexto antes de marcarla otra vez.
        const motivoAnulacion = params.data?.motivo_anulacion
        const fueAnulada = estado === 'pe' && !!motivoAnulacion
        const tooltipTitle = fueAnulada
          ? `Anulada el ${params.data?.fecha_anulacion ?? 'previamente'}. Motivo: ${motivoAnulacion}`
          : undefined
        return (
          <div className="flex items-center h-full gap-1.5" title={tooltipTitle}>
            <span style={{ background: bg, color: text, fontWeight: 'bold', fontSize: '11px', padding: '2px 8px', borderRadius: '9999px' }}>
              {label}
            </span>
            {fueAnulada && (
              <span
                className="text-amber-600"
                style={{ fontSize: '11px', fontWeight: 'bold' }}
              >
                ⚠ Anulada antes
              </span>
            )}
          </div>
        )
      },
    },
    {
      headerName: 'Observaciones',
      field: 'observaciones',
      flex: 1,
      minWidth: 150,
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 120,
      pinned: 'right',
      cellRenderer: CellAccionesEntrega,
      cellRendererParams: (params: { data?: any }) => ({
        entrega: params.data,
        onRefetch,
      }),
    },
  ]

  return columnDefs
}
