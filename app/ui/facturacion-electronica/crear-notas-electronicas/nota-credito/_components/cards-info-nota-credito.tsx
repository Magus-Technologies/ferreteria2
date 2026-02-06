"use client";

import { Form, FormInstance } from "antd";
import { FormCreateNotaCredito } from "./body-crear-nota-credito";
import ButtonBase from "~/components/buttons/button-base";
import { FaSave } from "react-icons/fa";
import { useMemo } from "react";
import CardInfoVenta from "~/app/ui/facturacion-electronica/mis-ventas/crear-venta/_components/cards/card-info-venta";
import { TipoMoneda } from "~/lib/api/venta";

interface CardsInfoNotaCreditoProps {
  form: FormInstance<FormCreateNotaCredito>;
}

export default function CardsInfoNotaCredito({ form }: CardsInfoNotaCreditoProps) {
  const productos = Form.useWatch("productos", form) || [];
  const tipo_moneda = Form.useWatch("tipo_moneda", form) || "PEN";

  // Calcular SubTotal (base imponible sin IGV)
  const subTotal = useMemo(
    () =>
      (productos || []).reduce(
        (acc: number, item: any) =>
          acc + Number(item?.precio_venta ?? 0) * Number(item?.cantidad ?? 0),
        0
      ),
    [productos]
  );

  // Calcular IGV (18%)
  const igv = useMemo(() => subTotal * 0.18, [subTotal]);

  // Calcular Total
  const total = useMemo(() => subTotal + igv, [subTotal, igv]);

  return (
    <div className="flex flex-col gap-4 max-w-64 p-4">
      <CardInfoVenta
        title="SubTotal"
        value={subTotal}
        moneda={tipo_moneda === "USD" ? TipoMoneda.DOLARES : TipoMoneda.SOLES}
      />

      <CardInfoVenta
        title="IGV (18%)"
        value={igv}
        moneda={tipo_moneda === "USD" ? TipoMoneda.DOLARES : TipoMoneda.SOLES}
      />

      <CardInfoVenta
        title="Total"
        value={total}
        moneda={tipo_moneda === "USD" ? TipoMoneda.DOLARES : TipoMoneda.SOLES}
        className="border-rose-500 border-2"
      />

      <CardInfoVenta
        title="Comisión"
        value={0}
        moneda={tipo_moneda === "USD" ? TipoMoneda.DOLARES : TipoMoneda.SOLES}
      />

      <ButtonBase
        type="submit"
        color="success"
        className="flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance"
      >
        <FaSave className="min-w-fit" size={30} />
        Guardar [F10]
      </ButtonBase>
      
      <ButtonBase
        type="button"
        color="default"
        className="flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance"
      >
        Buscar NC
      </ButtonBase>
    </div>
  );
}
