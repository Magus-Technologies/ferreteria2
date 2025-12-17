"use client";

import { FormInstance } from "antd";
import { FormCreateCotizacion } from "../others/body-cotizar";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import SelectClientes from "~/app/_components/form/selects/select-clientes";
import SelectTipoMoneda from "~/app/_components/form/selects/select-tipo-moneda";
import InputNumberBase from "~/app/_components/form/inputs/input-number-base";
import TextAreaBase from "~/app/_components/form/inputs/textarea-base";
import {
  FaCalendar,
  FaUser,
  FaMoneyBill,
  FaClock,
} from "react-icons/fa";
import dayjs from "dayjs";
import { TipoMoneda } from "@prisma/client";
import { useStoreProductoAgregadoCotizacion } from "../../_store/store-producto-agregado-cotizacion";

export default function FormCrearCotizacion({
  form,
}: {
  form: FormInstance<FormCreateCotizacion>;
}) {
  const setTipoMoneda = useStoreProductoAgregadoCotizacion(
    (store) => store.setTipoMoneda
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow">
      <DatePickerBase
        propsForm={{
          name: "fecha",
          label: "Fecha",
          initialValue: dayjs(),
          rules: [{ required: true, message: "Fecha requerida" }],
        }}
        prefix={<FaCalendar className="text-cyan-600" />}
      />

      <SelectClientes
        propsForm={{
          name: "cliente_id",
          label: "Cliente",
        }}
        form={form}
        prefix={<FaUser className="text-cyan-600" />}
        placeholder="Seleccione cliente"
      />

      <SelectTipoMoneda
        propsForm={{
          name: "tipo_moneda",
          label: "Moneda",
          initialValue: TipoMoneda.Soles,
          rules: [{ required: true, message: "Moneda requerida" }],
        }}
        onChange={(value) => setTipoMoneda(value as TipoMoneda)}
        prefix={<FaMoneyBill className="text-cyan-600" />}
      />

      <InputNumberBase
        propsForm={{
          name: "tipo_de_cambio",
          label: "Tipo de Cambio",
        }}
        prefix={<FaMoneyBill className="text-cyan-600" />}
        placeholder="3.80"
        precision={2}
        min={0}
      />

      <InputNumberBase
        propsForm={{
          name: "vigencia_dias",
          label: "Vigencia (días)",
          initialValue: 7,
        }}
        prefix={<FaClock className="text-cyan-600" />}
        placeholder="7"
        precision={0}
        min={1}
      />

      <div className="md:col-span-2 lg:col-span-3">
        <TextAreaBase
          propsForm={{
            name: "observaciones",
            label: "Observaciones",
          }}
          placeholder="Observaciones adicionales..."
          rows={3}
        />
      </div>
    </div>
  );
}
