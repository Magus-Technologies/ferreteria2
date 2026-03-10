import { create } from 'zustand'
import { type OrdenCompraFilters } from '~/lib/api/orden-compra'

type UseStoreFiltrosOrdenesCompraProps = {
    filtros: OrdenCompraFilters
    setFiltros: (
        value:
            | OrdenCompraFilters
            | ((prev: OrdenCompraFilters) => OrdenCompraFilters)
    ) => void
}

export const useStoreFiltrosOrdenesCompra = create<UseStoreFiltrosOrdenesCompraProps>(
    set => {
        return {
            // Inicializar con almacen_id = 1 por defecto
            filtros: { almacen_id: 1 },
            setFiltros: value =>
                set(state => ({
                    filtros: typeof value === 'function' ? value(state.filtros) : value,
                })),
        }
    }
)
