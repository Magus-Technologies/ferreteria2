"use client";

import { Form, FormInstance } from "antd";
import { FormCreateNotaDebito } from "./body-crear-nota-debito";
import ButtonBase from "~/components/buttons/button-base";
import { FaSave, FaPrint, FaFileAlt } from "react-icons/fa";
import { useMemo } from "react";

interface CardsInfoNotaDebitoProps {
  form: FormInstance<FormCreateNotaDebito>;
  loading: boolean;
}

export default function CardsInfoNotaDebito({ form, loading }: CardsInfoNotaDebitoProps) {
  const productos = Form.useWatch("productos", form) || [];

  const totales = useMemo(() => {
    const subtotal = productos.reduce((sum: number, p: any) => sum + (p.subtotal || 0), 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    const comision = 0; // Por ahora en 0

    return {
      subtotal: subtotal.toFixed(2),
      igv: igv.toFixed(2),
      total: total.toFixed(2),
      comision: comision.toFixed(2),
    };
  }, [productos]);

  return (
    <div className="flex flex-col gap-4">
      {/* Card de Totales */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Subtotal</span>
            <span className="text-xl font-bold text-gray-800">
              {totales.subtotal}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">IGV</span>
            <span className="text-xl font-bold text-gray-800">
              {totales.igv}
            </span>
          </div>

          <div className="border-t pt-3 flex justify-between items-center">
            <span className="text-gray-700 font-bold text-lg">Total</span>
            <span className="text-2xl font-bold text-red-600">
              {totales.total}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Comisión</span>
            <span className="text-gray-800 font-semibold">
              {totales.comision}
            </span>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-col gap-2">
        <ButtonBase
          type="submit"
          color="success"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2"
        >
          <FaSave />
          {loading ? "Guardando..." : "Guardar [F10]"}
        </ButtonBase>

        <ButtonBase
          type="button"
          color="primary"
          className="w-full flex items-center justify-center gap-2"
        >
          <FaPrint />
          Impr [Ctrl + B]
        </ButtonBase>

        <ButtonBase
          type="button"
          color="default"
          className="w-full flex items-center justify-center gap-2"
        >
          <FaFileAlt />
          Enviar [Ctrl + E]
        </ButtonBase>
      </div>

      {/* Información Adicional */}
      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
        <h4 className="font-semibold text-red-800 mb-2 text-sm">Valor Refer.</h4>
        <div className="text-xs text-gray-600">
          <p>Ninguno</p>
        </div>
      </div>

      {/* Ayuda */}
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <FaFileAlt className="text-red-600 text-2xl" />
          </div>
        </div>
        <p className="text-xs text-center text-gray-600 mt-2">
          Complete los datos del documento que modifica y agregue los productos
        </p>
      </div>
    </div>
  );
}
