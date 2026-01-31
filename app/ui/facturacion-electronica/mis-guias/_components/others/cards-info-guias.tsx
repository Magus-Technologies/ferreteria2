'use client'

import CardMiniInfo from '../cards/card-mini-info'
import { useMemo } from 'react'
import useGetGuias from '../../_hooks/use-get-guias'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

export default function CardsInfoGuias() {
  const { guias } = useGetGuias()

  const stats = useMemo(() => {
    if (!guias || guias.length === 0) {
      return {
        total: 0,
        borradores: 0,
        emitidas: 0,
        anuladas: 0,
      }
    }

    return {
      total: guias.length,
      borradores: guias.filter((g: any) => g.estado === 'BORRADOR').length,
      emitidas: guias.filter((g: any) => g.estado === 'EMITIDA').length,
      anuladas: guias.filter((g: any) => g.estado === 'ANULADA').length,
    }
  }, [guias])

  return (
    <>
      <ConfigurableElement
        componentId='mis-guias.card-total'
        label='Card Total Guías'
      >
        <CardMiniInfo
          title='Total Guías'
          value={stats.total}
          className='h-full'
          valueColor='text-blue-700'
        />
      </ConfigurableElement>

      <ConfigurableElement
        componentId='mis-guias.card-borradores'
        label='Card Borradores'
      >
        <CardMiniInfo
          title='Borradores'
          value={stats.borradores}
          className='h-full'
          valueColor='text-orange-600'
        />
      </ConfigurableElement>

      <ConfigurableElement
        componentId='mis-guias.card-emitidas'
        label='Card Emitidas'
      >
        <CardMiniInfo
          title='Emitidas'
          value={stats.emitidas}
          className='h-full'
          valueColor='text-green-600'
        />
      </ConfigurableElement>

      <ConfigurableElement
        componentId='mis-guias.card-anuladas'
        label='Card Anuladas'
      >
        <CardMiniInfo
          title='Anuladas'
          value={stats.anuladas}
          className='h-full'
          valueColor='text-red-600'
        />
      </ConfigurableElement>
    </>
  )
}
