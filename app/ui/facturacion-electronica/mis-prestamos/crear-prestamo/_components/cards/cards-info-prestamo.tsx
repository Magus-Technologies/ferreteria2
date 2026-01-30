"use client";

import { FormInstance, Form } from "antd";
import { useMemo } from "react";
import ButtonBase from "~/components/buttons/button-base";
import type { FormCreatePrestamo } from "../../_types/prestamo.types";
import CardInfoPrestamo from "./card-info-prestamo";
import { MdSave, MdAccountBalance } from "react-icons/md";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";

export default function CardsInfoPrestamo({
  form,
}: {
  form: FormInstance<FormCreatePrestamo>;
}) {
  const tipo_moneda = Form.useWatch("tipo_moneda", form);
  const productos = Form.useWatch("productos", form) as FormCreatePrestamo["productos"];

  // Calcular SubTotal - Comentado: Solo se maneja por cantidad
  // const subTotal = useMemo(
  //   () =>
  //     (productos || []).reduce(
  //       (acc, item) =>
  //         acc + Number(item?.costo ?? 0) * Number(item?.cantidad ?? 0),
  //       0
  //     ),
  //   [productos]
  // );

  // Total de Items
  const totalItems = useMemo(
    () => (productos || []).length,
    [productos]
  );

  // Total Cantidad
  const totalCantidad = useMemo(
    () =>
      (productos || []).reduce(
        (acc, item) => acc + Number(item?.cantidad ?? 0),
        0
      ),
    [productos]
  );

  return (
    <div className="flex flex-col gap-4 max-w-64">
      <ConfigurableElement
        componentId="crear-prestamo.card-total-items"
        label="Card Total Items"
      >
        <CardInfoPrestamo title="Total Items" value={totalItems} moneda={tipo_moneda} />
      </ConfigurableElement>

      <ConfigurableElement
        componentId="crear-prestamo.card-total-unidades"
        label="Card Total Unidades"
      >
        <CardInfoPrestamo title="Total Unidades" value={totalCantidad} moneda={tipo_moneda} />
      </ConfigurableElement>

      {/* Comentado: Solo se maneja por cantidad
      <CardInfoPrestamo
        title="Monto Total"
        value={subTotal}
        moneda={tipo_moneda}
        className="border-amber-500 border-2"
      />
      */}

      <ConfigurableElement
        componentId="crear-prestamo.boton-crear"
        label="Botón Crear Préstamo"
      >
        <ButtonBase
          onClick={() => {
            form.submit();
          }}
          color="success"
          className="flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance"
        >
          <MdAccountBalance className="min-w-fit" size={30} />
          Crear Préstamo
        </ButtonBase>
      </ConfigurableElement>
    </div>
  );
}
