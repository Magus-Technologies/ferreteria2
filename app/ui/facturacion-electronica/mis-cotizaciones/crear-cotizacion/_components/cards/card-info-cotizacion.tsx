"use client";

import { FormInstance } from "antd";
import { FormCreateCotizacion } from "../others/body-cotizar";
import { useEffect, useState } from "react";
import { calcularSubtotalCotizacion } from "../tables/columns-cotizar";
import { DescuentoTipo, TipoMoneda } from "@prisma/client";

export default function CardInfoCotizacion({
  form,
}: {
  form: FormInstance<FormCreateCotizacion>;
}) {
  const [totales, setTotales] = useState({
    subtotal: 0,
    total: 0,
    items: 0,
  });

  useEffect(() => {
    const productos = (form.getFieldValue("productos") ||
      []) as FormCreateCotizacion["productos"];

    const subtotal = productos.reduce((acc: number, producto) => {
      return (
        acc +
        Number(
          calcularSubtotalCotizacion({
            precio_venta: producto.precio_venta || 0,
            recargo: producto.recargo || 0,
            cantidad: producto.cantidad || 0,
            descuento: producto.descuento || 0,
            descuento_tipo: producto.descuento_tipo || DescuentoTipo.Monto,
          })
        )
      );
    }, 0);

    setTotales({
      subtotal,
      total: subtotal,
      items: productos.length,
    });
  }, [form]);

  const tipo_moneda = form.getFieldValue("tipo_moneda") || TipoMoneda.Soles;
  const simbolo = tipo_moneda === TipoMoneda.Soles ? "S/." : "$";

  return (
    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-6 shadow-lg border border-cyan-200">
      <h3 className="text-lg font-bold text-cyan-800 mb-4 text-center">
        Resumen de Cotización
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-cyan-200">
          <span className="text-gray-600 font-medium">Items:</span>
          <span className="text-gray-800 font-bold">{totales.items}</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-cyan-200">
          <span className="text-gray-600 font-medium">Subtotal:</span>
          <span className="text-gray-800 font-bold">
            {simbolo} {totales.subtotal.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center py-3 bg-cyan-100 rounded-lg px-3 mt-4">
          <span className="text-cyan-900 font-bold text-lg">TOTAL:</span>
          <span className="text-cyan-900 font-bold text-2xl">
            {simbolo} {totales.total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
