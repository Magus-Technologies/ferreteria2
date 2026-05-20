"use client";

import React from "react";
import { Tabs, Spin } from "antd";
import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import EditorPlantillaImpresion from "./_components/editor-plantilla-impresion";
import { useAuth } from "~/lib/auth-context";

const COMPROBANTES = [
  { key: "venta", label: "Venta", formats: ["A4", "Ticket"] },
  { key: "compra", label: "Compra", formats: ["A4"] },
  { key: "cotizacion", label: "Cotización", formats: ["A4", "Ticket"] },
  { key: "guia", label: "Guía", formats: ["A4", "Ticket"] },
  { key: "orden-compra", label: "Orden de compra", formats: ["A4", "Ticket"] },
  { key: "entrega", label: "Entrega", formats: ["A4", "Ticket"] },
  { key: "ingreso-salida", label: "Ingreso / Salida", formats: ["A4", "Ticket"] },
  { key: "nota-credito", label: "Nota de crédito", formats: ["A4"] },
  { key: "nota-debito", label: "Nota de débito", formats: ["A4"] },
  { key: "prestamo", label: "Préstamo", formats: ["A4", "Ticket"] },
  { key: "recepcion-almacen", label: "Recepción de almacén", formats: ["A4", "Ticket"] },
  { key: "transferencia-stock", label: "Transferencia de stock", formats: ["A4", "Ticket"] },
  { key: "requerimiento-interno", label: "Requerimiento interno", formats: ["A4"] },
  { key: "ventas-por-cobrar", label: "Ventas por cobrar", formats: ["A4"] },
  { key: "cierre-caja", label: "Cierre de caja", formats: ["A4", "Ticket"] },
  { key: "apertura-caja", label: "Apertura de caja", formats: ["Ticket"] },
  { key: "cobro-venta", label: "Cobro de venta", formats: ["Ticket"] },
  { key: "cobro-venta-masivo", label: "Cobro de venta masivo", formats: ["Ticket"] },
  { key: "pago-compra", label: "Pago de compra", formats: ["Ticket"] },
  { key: "vale-compra", label: "Vale de compra", formats: ["Ticket"] },
  { key: "vale-generado", label: "Vale generado", formats: ["Ticket"] },
];

export default function PlantillaImpresionPage() {
  const { user } = useAuth();
  const empresaId = user?.empresa?.id;

  if (!empresaId) {
    return (
      <ContenedorGeneral>
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </ContenedorGeneral>
    );
  }

  const tabsItems = COMPROBANTES.map((comprobante) => ({
    key: comprobante.key,
    label: comprobante.label,
    children: (
      <Tabs
        defaultActiveKey={comprobante.formats[0]}
        size="small"
        items={comprobante.formats.map((formato) => ({
          key: formato,
          label: formato === "A4" ? "PDF A4" : "Ticket",
          children: (
            <div className="pt-4">
              <EditorPlantillaImpresion
                comprobante={comprobante.label}
                formato={formato}
              />
            </div>
          ),
        }))}
      />
    ),
  }));

  return (
    <ContenedorGeneral>
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-6">Plantilla de Impresión</h1>
        <Tabs defaultActiveKey="venta" items={tabsItems} type="card" />
      </div>
    </ContenedorGeneral>
  );
}
