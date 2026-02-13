"use client";

import CardMiniInfo from "~/app/ui/facturacion-electronica/mis-ventas/_components/cards/card-mini-info";
import { useStoreFiltrosMisNotasCredito } from "../../_store/store-filtros-mis-notas-credito";
import { useMemo } from "react";
import useGetNotasCredito from "../../_hooks/use-get-notas-credito";

export default function CardsInfoNotasCredito() {
  const filtros = useStoreFiltrosMisNotasCredito((state) => state.filtros);
  const { response } = useGetNotasCredito({ where: filtros });

  const totales = useMemo(() => {
    if (!Array.isArray(response) || response.length === 0) {
      return { total: 0, aceptadas: 0, pendientes: 0, rechazadas: 0 };
    }
    let total = 0, aceptadas = 0, pendientes = 0, rechazadas = 0;
    response.forEach((nc: any) => {
      const monto = Number(nc.total || 0);
      total += monto;
      // Los estados SUNAT vienen en MAYÚSCULAS desde el backend
      if (nc.estado_sunat === "ACEPTADO") aceptadas += monto;
      else if (nc.estado_sunat === "PENDIENTE") pendientes += monto;
      else if (nc.estado_sunat === "RECHAZADO") rechazadas += monto;
    });
    return { total, aceptadas, pendientes, rechazadas };
  }, [response]);

  return (
    <>
      <CardMiniInfo title="Total NC" value={totales.total} className="h-full" valueColor="text-green-600" />
      <CardMiniInfo title="Aceptadas" value={totales.aceptadas} className="h-full" valueColor="text-green-600" />
      <CardMiniInfo title="Pendientes" value={totales.pendientes} className="h-full" valueColor="text-orange-600" />
      <CardMiniInfo title="Rechazadas" value={totales.rechazadas} className="h-full" valueColor="text-red-600" />
    </>
  );
}
