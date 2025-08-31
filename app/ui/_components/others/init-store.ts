'use client'

import { useEffect } from 'react'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useStoreFiltrosProductos } from '../../gestion-comercial-e-inventario/mi-almacen/store/store-filtros-productos'
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
    if (almacen_predeterminado) {
      setAlmacenId(almacen_predeterminado)
    }
    if (marca_predeterminada) {
      setFiltros({
        producto_en_almacenes: {
          some: {
            almacen_id: almacen_predeterminado,
          },
        },
        marca_id: marca_predeterminada,
        estado: true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
