"use client";

import ProductoOtrosAlmacenes from "./producto-otros-almacenes";
import { useProductosListadoCompleto } from "../../_hooks/useProductosListadoCompleto";

interface ProductoOtrosAlmacenesRealtimeProps {
  productoId: number;
  almacenId: number;
  unidadesContenidas: number;
}

export default function ProductoOtrosAlmacenesRealtime({
  productoId,
  almacenId,
  unidadesContenidas,
}: ProductoOtrosAlmacenesRealtimeProps) {
  // Suscribirse a la MISMA query del listado (`['productos-listado-completo', almacenId]`)
  // que alimenta la tabla. Así el modal se re-renderiza reactivamente ante cualquier
  // actualización de la cache: tanto por WebSocket como por la invalidación directa de
  // React Query (p. ej. al "Deshacer" una recepción). Antes leía la cache de forma
  // imperativa (getQueryData) y solo se actualizaba con el evento de WebSocket, por lo
  // que si Reverb estaba caído el stock por almacén quedaba viejo.
  const { data: allProducts } = useProductosListadoCompleto(almacenId);

  const producto = allProducts?.find((p) => p.id === productoId);
  const otherWarehouses =
    producto?.producto_en_almacenes?.filter(
      (pa) => pa.almacen_id !== almacenId,
    ) ?? [];

  if (otherWarehouses.length === 0) {
    return <div className="text-gray-500 text-sm">Sin datos de almacén</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4 py-2">
      {otherWarehouses.map((item, index) => {
        if (
          !item?.unidades_derivadas ||
          item.unidades_derivadas.length === 0
        ) {
          return null;
        }

        const unidadDerivada =
          item.unidades_derivadas.find(
            (ud) => Number(ud.factor) === Number(unidadesContenidas),
          ) ?? item.unidades_derivadas[0];

        if (!unidadDerivada?.unidad_derivada) {
          return null;
        }

        return (
          <ProductoOtrosAlmacenes
            key={index}
            stock_fraccion={Number(item.stock_fraccion)}
            unidades_contenidas={Number(unidadesContenidas)}
            producto_almacen_unidad_derivada={{
              ...unidadDerivada,
              unidad_derivada: {
                ...unidadDerivada.unidad_derivada,
                estado: true,
              },
            }}
            almacen={item.almacen?.name}
          />
        );
      })}
    </div>
  );
}
