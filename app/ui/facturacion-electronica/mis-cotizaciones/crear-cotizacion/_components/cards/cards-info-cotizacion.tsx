"use client";

import { Form, FormInstance } from "antd";
import { useMemo } from "react";
import ButtonBase from "~/components/buttons/button-base";
import type { FormCreateCotizacion } from "../../_types/cotizacion.types";
import CardInfoCotizacion from "./card-info-cotizacion";
import { MdSell } from "react-icons/md";
import { FaPrint } from "react-icons/fa";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";

export default function CardsInfoCotizacion({
  form,
}: {
  form: FormInstance<FormCreateCotizacion>;
}) {
  const tipo_moneda = Form.useWatch("tipo_moneda", form);
  const productos = Form.useWatch(
    "productos",
    form
  ) as FormCreateCotizacion["productos"];

  // Calcular SubTotal (suma de productos sin descuento)
  const subTotal = useMemo(
    () =>
      (productos || []).reduce(
        (acc, item) =>
          acc +
          (Number(item?.precio_venta ?? 0) + Number(item?.recargo ?? 0)) *
            Number(item?.cantidad ?? 0),
        0
      ),
    [productos]
  );

  // Calcular Total Descuento
  const totalDescuento = useMemo(
    () =>
      (productos || []).reduce((acc, item) => {
        const descuento_tipo = item?.descuento_tipo ?? "Monto";
        const descuento = Number(item?.descuento ?? 0);
        const precio_venta = Number(item?.precio_venta ?? 0);
        const recargo = Number(item?.recargo ?? 0);
        const cantidad = Number(item?.cantidad ?? 0);

        if (descuento_tipo === "Porcentaje") {
          return acc + ((precio_venta + recargo) * descuento * cantidad) / 100;
        } else {
          return acc + descuento;
        }
      }, 0),
    [productos]
  );

  // Calcular Total
  const total = useMemo(
    () => subTotal - totalDescuento,
    [subTotal, totalDescuento]
  );

  return (
    <div className="flex flex-col gap-4 max-w-64">
      <ConfigurableElement
        componentId="crear-cotizacion.card-subtotal"
        label="Card SubTotal"
      >
        <CardInfoCotizacion
          title="SubTotal"
          value={subTotal}
          moneda={tipo_moneda}
        />
      </ConfigurableElement>

      <ConfigurableElement
        componentId="crear-cotizacion.card-descuento"
        label="Card Total Descuento"
      >
        <CardInfoCotizacion
          title="Total Dscto"
          value={totalDescuento}
          moneda={tipo_moneda}
        />
      </ConfigurableElement>

      <ConfigurableElement
        componentId="crear-cotizacion.card-total"
        label="Card Total"
      >
        <CardInfoCotizacion
          title="Total"
          value={total}
          moneda={tipo_moneda}
          className="border-cyan-500 border-2"
        />
      </ConfigurableElement>

      <ConfigurableElement
        componentId="crear-cotizacion.boton-guardar"
        label="Botón Guardar Cotización"
      >
        <ButtonBase
          onClick={() => {
            console.log('🔘 CLICK en botón Guardar Cotización');
            console.log('📋 Valores actuales del formulario:', form.getFieldsValue());
            form.submit();
          }}
          color="success"
          className="flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance"
        >
          <MdSell className="min-w-fit" size={30} />
          Guardar Cotización
        </ButtonBase>
      </ConfigurableElement>

      {/* <ConfigurableElement
        componentId="crear-cotizacion.boton-imprimir"
        label="Botón Imprimir"
      >
        <ButtonBase
          type="button"
          color="info"
          className="flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance"
          onClick={() => {
            console.log("Imprimir cotización");
          }}
        >
          <FaPrint className="min-w-fit" size={30} />
          Imprimir
        </ButtonBase>
      </ConfigurableElement> */}
    </div>
  );
}
