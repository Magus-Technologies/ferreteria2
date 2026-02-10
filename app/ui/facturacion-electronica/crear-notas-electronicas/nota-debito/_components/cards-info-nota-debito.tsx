"use client";

import { Form, FormInstance } from "antd";
import ButtonBase from "~/components/buttons/button-base";
import { FaSave } from "react-icons/fa";
import { useMemo } from "react";
import CardInfoVenta from "~/app/ui/facturacion-electronica/mis-ventas/crear-venta/_components/cards/card-info-venta";
import { TipoMoneda } from "~/lib/api/venta";

interface CardsInfoNotaDebitoProps {
  form: FormInstance;
}

export default function CardsInfoNotaDebito({ form }: CardsInfoNotaDebitoProps) {
  const productos = Form.useWatch("productos", form) || [];
  const tipo_moneda = Form.useWatch("tipo_moneda", form) || "PEN";

  // IMPORTANTE: precio_venta ya incluye IGV (es el precio final con impuesto)
  // Por lo tanto, primero calculamos el TOTAL con IGV, luego extraemos el subtotal e IGV
  
  // Calcular Total CON IGV (precio_venta ya incluye IGV)
  const total = useMemo(
    () =>
      (productos || []).reduce(
        (acc: number, item: any) =>
          acc + Number(item?.precio_venta ?? 0) * Number(item?.cantidad ?? 0),
        0
      ),
    [productos]
  );

  // Calcular SubTotal SIN IGV (base imponible)
  // Fórmula: Si total = subtotal * 1.18, entonces subtotal = total / 1.18
  const subTotal = useMemo(() => total / 1.18, [total]);

  // Calcular IGV (18%)
  const igv = useMemo(() => total - subTotal, [total, subTotal]);

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
        className="border-orange-500 border-2"
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
        Buscar ND
      </ButtonBase>
    </div>
  );
}
