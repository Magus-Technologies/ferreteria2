'use client'

import React from 'react'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TableSeries from './_components/table-series'

export default function SeriesPage() {
  return (
    <ContenedorGeneral>
      <div className='w-full'>
        <TableSeries />
      </div>
    </ContenedorGeneral>
  )
}