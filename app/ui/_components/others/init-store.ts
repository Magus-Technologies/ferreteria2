'use client'

import { useEffect } from 'react'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useStoreFiltrosProductos } from '../../gestion-comercial-e-inventario/mi-almacen/_store/store-filtros-productos'
import { Empresa } from '@prisma/client'

export function InitStore({
  marca_predeterminada,
  almacen_predeterminado,
}: {
  marca_predeterminada?: Empresa['marca_id']
  almacen_predeterminado?: Empresa['almacen_id']
}) {
  const setAlmacenId = useStoreAlmacen(store => store.setAlmacenId)
  const setFiltros = useStoreFiltrosProductos(state => state.setFiltros)

  useEffect(() => {
    // Inicializar almacen predeterminado de forma asíncrona
    if (almacen_predeterminado) {
      setTimeout(() => setAlmacenId(almacen_predeterminado), 100)
    }
    
    // Inicializar filtros solo con datos básicos, sin queries complejas
    if (marca_predeterminada) {
      setTimeout(() => {
        setFiltros({
          marca_id: marca_predeterminada,
          estado: true,
        })
      }, 200)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
