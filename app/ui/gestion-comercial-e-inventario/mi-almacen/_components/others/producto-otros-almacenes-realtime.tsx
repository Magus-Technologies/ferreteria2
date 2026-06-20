"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeModelChanged } from "~/lib/realtime-bus";
import ProductoOtrosAlmacenes from "./producto-otros-almacenes";
import type { Producto } from "~/app/_types/producto";

interface ProductoOtrosAlmacenesRealtimeProps {
  productoId: number;
  almacenId: number;
  unidadesContenidas: number;
}

const STOCK_MODULES = [
  "transferencias-stock",
  "productos",
  "ingresos-salidas",
  "compras",
  "ventas",
  "recepciones-almacen",
  "entregas-productos",
  "prestamos",
];

export default function ProductoOtrosAlmacenesRealtime({
  productoId,
  almacenId,
  unidadesContenidas,
}: ProductoOtrosAlmacenesRealtimeProps) {
  const queryClient = useQueryClient();
  const [, forceRender] = useState(0);

  useEffect(() => {
    return subscribeModelChanged((payload) => {
      if (STOCK_MODULES.includes(payload.module)) {
        queryClient
          .refetchQueries({
            queryKey: ["productos-listado-completo", almacenId],
            exact: true,
          })
          .then(() => {
            forceRender((v) => v + 1);
          });
      }
    });
  }, [queryClient, almacenId]);

  const allProducts = queryClient.getQueryData<Producto[]>([
    "productos-listado-completo",
    almacenId,
  ]);
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
