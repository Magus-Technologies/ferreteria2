"use client";

import CardMiniInfo from "~/app/ui/facturacion-electronica/mis-ventas/_components/cards/card-mini-info";
import { useStoreFiltrosMisFacturas } from "../../_store/store-filtros-mis-facturas";
import { useMemo } from "react";
import useGetFacturas from "../../_hooks/use-get-facturas";

export default function CardsInfoFacturas() {
  const filtros = useStoreFiltrosMisFacturas((state) => state.filtros);
  const { response } = useGetFacturas({ where: filtros });

  const totales = useMemo(() => {
    if (!Array.isArray(response) || response.length === 0) {
      return {
        totalFacturas: 0,
        aceptadas: 0,
        pendientes: 0,
        rechazadas: 0,
      };
    }

    let totalFacturas = 0;
    let aceptadas = 0;
    let pendientes = 0;
    let rechazadas = 0;

    response.forEach((factura: any) => {
      const total = Number(factura.total || 0);
      totalFacturas += total;

      if (factura.estado_sunat === "Aceptado") {
        aceptadas += total;
      } else if (factura.estado_sunat === "Pendiente") {
        pendientes += total;
      } else if (factura.estado_sunat === "Rechazado") {
        rechazadas += total;
      }
    });

    return {
      totalFacturas,
      aceptadas,
      pendientes,
      rechazadas,
    };
  }, [response]);

  return (
    <>
      <CardMiniInfo
        title="Total Facturas"
        value={totales.totalFacturas}
        className="h-full"
        valueColor="text-blue-600"
      />
      <CardMiniInfo
        title="Aceptadas"
        value={totales.aceptadas}
        className="h-full"
        valueColor="text-green-600"
      />
      <CardMiniInfo
        title="Pendientes"
        value={totales.pendientes}
        className="h-full"
        valueColor="text-orange-600"
      />
      <CardMiniInfo
        title="Rechazadas"
        value={totales.rechazadas}
        className="h-full"
        valueColor="text-red-600"
      />
    </>
  );
}
