"use client";

import CardMiniInfo from "~/app/ui/facturacion-electronica/mis-ventas/_components/cards/card-mini-info";
import { useStoreFiltrosMisNotasDebito } from "../../_store/store-filtros-mis-notas-debito";
import { useMemo } from "react";
import useGetNotasDebito from "../../_hooks/use-get-notas-debito";

export default function CardsInfoNotasDebito() {
  const filtros = useStoreFiltrosMisNotasDebito((state) => state.filtros);
  const { response } = useGetNotasDebito({ where: filtros });

  const totales = useMemo(() => {
    if (!Array.isArray(response) || response.length === 0) {
      return { total: 0, aceptadas: 0, pendientes: 0, rechazadas: 0 };
    }
    let total = 0, aceptadas = 0, pendientes = 0, rechazadas = 0;
    response.forEach((nd: any) => {
      const monto = Number(nd.total || 0);
      total += monto;
      // Los estados SUNAT vienen en MAYÚSCULAS desde el backend
      if (nd.estado_sunat === "ACEPTADO") aceptadas += monto;
      else if (nd.estado_sunat === "PENDIENTE") pendientes += monto;
      else if (nd.estado_sunat === "RECHAZADO") rechazadas += monto;
    });
    return { total, aceptadas, pendientes, rechazadas };
  }, [response]);

  return (
    <>
      <CardMiniInfo title="Total ND" value={totales.total} className="h-full" valueColor="text-orange-600" />
      <CardMiniInfo title="Aceptadas" value={totales.aceptadas} className="h-full" valueColor="text-green-600" />
      <CardMiniInfo title="Pendientes" value={totales.pendientes} className="h-full" valueColor="text-orange-600" />
      <CardMiniInfo title="Rechazadas" value={totales.rechazadas} className="h-full" valueColor="text-red-600" />
    </>
  );
}
