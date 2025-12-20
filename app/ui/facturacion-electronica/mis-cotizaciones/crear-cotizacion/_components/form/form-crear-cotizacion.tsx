"use client";

import { FormInstance } from "antd";
import type { FormCreateCotizacion } from "../../_types/cotizacion.types";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import SelectClientes from "~/app/_components/form/selects/select-clientes";
import InputNumberBase from "~/app/_components/form/inputs/input-number-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import SelectFormaDePago from "~/app/_components/form/selects/select-forma-de-pago";
import SelectTipoDocumento from "~/app/_components/form/selects/select-tipo-documento";
import LabelBase from "~/components/form/label-base";
import { FaCalendar } from "react-icons/fa6";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useAuth } from "~/lib/auth-context";
import { cotizacionesApi } from "~/lib/api/cotizaciones";

export default function FormCrearCotizacion({
  form,
}: {
  form: FormInstance<FormCreateCotizacion>;
}) {
  const { user } = useAuth();

  // Autocompletar vendedor con el usuario logueado
  useEffect(() => {
    if (user?.name) {
      form.setFieldValue("vendedor", user.name);
    }
  }, [user, form]);

  // Cargar el siguiente número de cotización automáticamente
  useEffect(() => {
    const cargarSiguienteNumero = async () => {
      const response = await cotizacionesApi.getSiguienteNumero();
      if (response.data?.numero) {
        form.setFieldValue("numero", response.data.numero);
      }
    };

    cargarSiguienteNumero();
  }, [form]);

  return (
    <div className="flex flex-col">
      {/* Fila 1: Fecha Proforma, Vendedor, N° Cotización, Moneda */}
      <div className="flex gap-6">
        {/* Fecha de la cotización (REQUERIDO) - Se usa como fecha y fecha_proforma */}
        <LabelBase label="Fecha Proforma:" classNames={{ labelParent: "mb-6" }}>
          <DatePickerBase
            propsForm={{
              name: "fecha",
              initialValue: dayjs(),
              hasFeedback: false,
              rules: [
                {
                  required: true,
                  message: "La fecha es requerida",
                },
              ],
            }}
            placeholder="Fecha"
            className="!w-[160px] !min-w-[160px] !max-w-[160px]"
            prefix={<FaCalendar size={15} className="text-rose-700 mx-1" />}
          />
        </LabelBase>

        <LabelBase label="Vendedor:" classNames={{ labelParent: "mb-6" }}>
          <InputBase
            propsForm={{
              name: "vendedor",
              hasFeedback: false,
              className: "!min-w-[250px] !w-[250px] !max-w-[250px]",
            }}
            placeholder="Código o nombre del vendedor"
            prefix={<span className="text-rose-700 mx-1">👤</span>}
          />
        </LabelBase>

        {/* N° Cotización: Generado automáticamente (COT-2025-001) */}
        <LabelBase label="N° Cotización:" classNames={{ labelParent: "mb-6" }}>
          <InputBase
            propsForm={{
              name: "numero",
              hasFeedback: false,
              className: "!min-w-[180px] !w-[180px] !max-w-[180px]",
            }}
            placeholder="COT-2025-001"
            prefix={<span className="text-rose-700 mx-1">#</span>}
            disabled
            readOnly
          />
        </LabelBase>

        {/* TODO: Agregar campo Tipo de Moneda cuando sea necesario */}
        {/* <LabelBase label="Moneda:" classNames={{ labelParent: "mb-6" }}>
          <select
            className="h-[40px] px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 !min-w-[120px] !w-[120px] !max-w-[120px]"
            onChange={(e) => {
              form.setFieldValue("tipo_moneda", e.target.value as "s" | "d");
            }}
            defaultValue="s"
          >
            <option value="s">💵 Soles</option>
            <option value="d">💲 Dólares</option>
          </select>
        </LabelBase> */}
      </div>

      {/* Fila 2: f.pago, n dias, f vence , t.doc */}
      <div className="flex gap-6">
        <LabelBase label="F. Pago:" classNames={{ labelParent: "mb-6" }}>
          <SelectFormaDePago
            classNameIcon="text-rose-700 mx-1"
            className="!w-[135px] !min-w-[135px] !max-w-[135px]"
            propsForm={{
              name: "forma_de_pago",
              hasFeedback: false,
            }}
          />
        </LabelBase>
        <LabelBase label="N° DIAS:" classNames={{ labelParent: "mb-6" }}>
          <InputNumberBase
            propsForm={{
              name: "vigencia_dias",
              initialValue: 7,
              hasFeedback: false,
              className: "!min-w-[100px] !w-[100px] !max-w-[100px]",
            }}
            placeholder="7"
            precision={0}
            min={1}
            prefix={<span className="text-rose-700 mx-1">📅</span>}
          />
        </LabelBase>
        <LabelBase label="F VENCE:" classNames={{ labelParent: "mb-6" }}>
          <DatePickerBase
            propsForm={{
              name: "fecha_vencimiento",
              hasFeedback: false,
            }}
            placeholder="Fecha vencimiento"
            className="!w-[160px] !min-w-[160px] !max-w-[160px]"
            prefix={<FaCalendar size={15} className="text-rose-700 mx-1" />}
          />
        </LabelBase>
        <LabelBase label="T.Doc:" classNames={{ labelParent: "mb-6" }}>
          <SelectTipoDocumento
            propsForm={{
              name: "tipo_documento",
              hasFeedback: false,
              className: "!min-w-[150px] !w-[150px] !max-w-[150px]",
            }}
            className="w-full"
            classNameIcon="text-rose-700 mx-1"
          />
        </LabelBase>
      </div>

      {/* Fila 3: RUC/DNI, Cliente */}
      <div className="flex gap-6">
        <LabelBase label="Ruc / Dni:" classNames={{ labelParent: "mb-6" }}>
          <InputBase
            propsForm={{
              name: "ruc_dni",
              hasFeedback: false,
              className: "!min-w-[200px] !w-[200px] !max-w-[200px]",
            }}
            placeholder="RUC o DNI"
            prefix={<span className="text-rose-700 mx-1">🆔</span>}
          />
        </LabelBase>
        <LabelBase label="Cliente:" classNames={{ labelParent: "mb-6" }}>
          <SelectClientes
            form={form}
            propsForm={{
              name: "cliente_id",
              hasFeedback: false,
              className: "!min-w-[250px] !w-[250px] !max-w-[250px]",
              rules: [
                {
                  required: true,
                  message: "Selecciona el cliente",
                },
              ],
            }}
            className="w-full"
            classNameIcon="text-rose-700 mx-1"
            onChange={(_, cliente) => {
              // Autocompletar dirección y teléfono del cliente seleccionado
              if (cliente) {
                if (cliente.direccion) {
                  form.setFieldValue("direccion", cliente.direccion);
                }
                if (cliente.telefono) {
                  form.setFieldValue("telefono", cliente.telefono);
                }
                // También autocompletar RUC/DNI
                if (cliente.numero_documento) {
                  form.setFieldValue("ruc_dni", cliente.numero_documento);
                }
              }
            }}
          />
        </LabelBase>
        
        {/* Checkbox: Reservar Stock */}
        <LabelBase label="Opciones:" classNames={{ labelParent: "mb-6" }}>
          <div className="flex items-center gap-2 h-[40px]">
            <input
              type="checkbox"
              id="reservar_stock"
              className="w-4 h-4 text-rose-600 bg-gray-100 border-gray-300 rounded focus:ring-rose-500 focus:ring-2 cursor-pointer"
              onChange={(e) => {
                form.setFieldValue("reservar_stock", e.target.checked);
              }}
            />
            <label
              htmlFor="reservar_stock"
              className="text-sm font-medium text-gray-700 cursor-pointer select-none"
            >
              📦 Reservar Stock
            </label>
          </div>
        </LabelBase>
      </div>

      {/* Fila 4: Dirección, Telefono, cred .disp */}
      <div className="flex gap-6">
        <LabelBase label="Dirección:" classNames={{ labelParent: "mb-6" }}>
          <InputBase
            propsForm={{
              name: "direccion",
              hasFeedback: false,
              className: "!min-w-[300px] !w-[300px] !max-w-[300px]",
            }}
            placeholder="Dirección del cliente"
            prefix={<span className="text-rose-700 mx-1">📍</span>}
          />
        </LabelBase>
        <LabelBase label="Tele/Cel:" classNames={{ labelParent: "mb-6" }}>
          <InputBase
            propsForm={{
              name: "telefono",
              hasFeedback: false,
              className: "!min-w-[150px] !w-[150px] !max-w-[150px]",
            }}
            placeholder="Teléfono"
            prefix={<span className="text-rose-700 mx-1">📞</span>}
          />
        </LabelBase>
      </div>
    </div>
  );
}
