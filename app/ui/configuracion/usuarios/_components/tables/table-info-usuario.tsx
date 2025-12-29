'use client'

import { useMemo } from 'react'
import { ColDef } from 'ag-grid-community'
import TableBase from '~/components/tables/table-base'
import { Usuario } from '~/lib/api/usuarios'

interface TableInfoUsuarioProps {
  usuario: Usuario | null
}

export default function TableInfoUsuario({ usuario }: TableInfoUsuarioProps) {
  // Definir columnas horizontales
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: 'Tipo Doc',
        field: 'tipo_documento',
        width: 100,
      },
      {
        headerName: 'Nro Documento',
        field: 'numero_documento',
        width: 120,
      },
      {
        headerName: 'Teléfono',
        field: 'telefono',
        width: 110,
      },
      {
        headerName: 'Celular',
        field: 'celular',
        width: 110,
      },
      {
        headerName: 'Género',
        field: 'genero',
        width: 100,
        valueFormatter: (params) => {
          if (!params.value) return '-'
          return params.value === 'M' ? 'Masculino' : params.value === 'F' ? 'Femenino' : 'Otro'
        },
      },
      {
        headerName: 'Estado Civil',
        field: 'estado_civil',
        width: 120,
      },
      {
        headerName: 'Email Corporativo',
        field: 'email_corporativo',
        flex: 1,
        minWidth: 200,
      },
      {
        headerName: 'Dirección 1',
        field: 'direccion_linea1',
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: 'Dirección 2',
        field: 'direccion_linea2',
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: 'Ciudad',
        field: 'ciudad',
        width: 120,
      },
      {
        headerName: 'Nacionalidad',
        field: 'nacionalidad',
        width: 120,
      },
      {
        headerName: 'Fecha Nacimiento',
        field: 'fecha_nacimiento',
        width: 140,
        valueFormatter: (params) => {
          if (!params.value) return '-'
          return new Date(params.value).toLocaleDateString('es-PE')
        },
      },
      {
        headerName: 'Rol Sistema',
        field: 'rol_sistema',
        width: 140,
      },
      {
        headerName: 'Cargo',
        field: 'cargo',
        width: 180,
      },
      {
        headerName: 'Fecha Inicio',
        field: 'fecha_inicio',
        width: 120,
        valueFormatter: (params) => {
          if (!params.value) return '-'
          return new Date(params.value).toLocaleDateString('es-PE')
        },
      },
      {
        headerName: 'Fecha Baja',
        field: 'fecha_baja',
        width: 120,
        valueFormatter: (params) => {
          if (!params.value) return '-'
          return new Date(params.value).toLocaleDateString('es-PE')
        },
      },
      {
        headerName: 'Vacaciones',
        field: 'vacaciones_dias',
        width: 110,
        valueFormatter: (params) => {
          if (!params.value) return '-'
          return `${params.value} días`
        },
      },
      {
        headerName: 'Sueldo',
        field: 'sueldo_boleta',
        width: 120,
        valueFormatter: (params) => {
          if (!params.value) return '-'
          return `S/ ${Number(params.value).toFixed(2)}`
        },
      },
    ],
    []
  )

  return (
    <div>
      <h3 className='text-lg font-semibold mb-3 text-blue-600'>
        Información Completa del Usuario
      </h3>
      <TableBase
        rowData={usuario ? [usuario] : []}
        columnDefs={columnDefs}
        domLayout='autoHeight'
        pagination={false}
      />
    </div>
  )
}
