"use client";

import { Form, FormInstance } from "antd";
import { FormCreateNotaDebito } from "./body-crear-nota-debito";
import InputBase from "~/app/_components/form/inputs/input-base";
import SelectBase from "~/app/_components/form/selects/select-base";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import TextAreaBase from "~/app/_components/form/inputs/textarea-base";
import SelectMotivoNota from "~/app/_components/form/selects/select-motivo-nota";
import { FaFileInvoice, FaCalendar, FaMoneyBill } from "react-icons/fa";
import dayjs from "dayjs";
import TableProductosNotaDebito from "./table-productos-nota-debito";

interface FormNotaDebitoProps {
  form: FormInstance<FormCreateNotaDebito>;
  loading: boolean;
}

export default function FormNotaDebito({ form, loading }: FormNotaDebitoProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Título */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FaFileInvoice />
          DATOS DE NOTAS DE DÉBITO
        </h2>
      </div>

      {/* Documento que modifica */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-semibold mb-3 text-gray-700">DOCUMENTO MODIFICA</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectBase
            propsForm={{
              name: "tipo_documento_modifica",
              label: "T Doc",
              rules: [{ required: true, message: "Requerido" }],
              initialValue: "01",
            }}
            prefix={<FaFileInvoice className="text-red-600" />}
            options={[
              { value: "01", label: "FACTURA ELECTRONICA" },
              { value: "03", label: "BOLETA ELECTRONICA" },
            ]}
          />

          <InputBase
            propsForm={{
              name: "serie_documento_modifica",
              label: "Serie",
              rules: [{ required: true, message: "Requerido" }],
            }}
            placeholder="F001"
            maxLength={4}
          />

          <InputBase
            propsForm={{
              name: "numero_documento_modifica",
              label: "Número",
              rules: [{ required: true, message: "Requerido" }],
            }}
            placeholder="000001"
            maxLength={8}
          />
        </div>
      </div>

      {/* Motivo de Nota de Débito */}
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <SelectMotivoNota
          tipo="debito"
          propsForm={{
            name: "motivo_nota_id",
            label: "Motivo de Nota de Débito",
            rules: [{ required: true, message: "Seleccione un motivo" }],
          }}
        />
        <p className="text-xs text-gray-600 mt-1">
          Escanee o digite el motivo de la nota de débito en letras
        </p>
      </div>

      {/* Cliente */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-semibold mb-3 text-gray-700 flex items-center gap-2">
          Cliente
          <button
            type="button"
            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
          >
            Visitante
          </button>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputBase
            propsForm={{
              name: "cliente_numero_documento",
              label: "RUC / DNI",
            }}
            placeholder="Número de documento"
          />

          <InputBase
            propsForm={{
              name: "cliente_nombre",
              label: "Cliente",
            }}
            placeholder="Nombre del cliente"
          />

          <div className="md:col-span-2">
            <InputBase
              propsForm={{
                name: "cliente_direccion",
                label: "Dirección",
              }}
              placeholder="Dirección del cliente"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <TableProductosNotaDebito form={form} />
      </div>

      {/* Datos del Comprobante */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-semibold mb-3 text-gray-700">
          Datos del Comprobante (Utilizar este formulario para ventas que no se hayan realizado, de antemano)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DatePickerBase
            propsForm={{
              name: "fecha_emision",
              label: "Fecha Nd",
              rules: [{ required: true, message: "Requerido" }],
              initialValue: dayjs(),
            }}
            prefix={<FaCalendar className="text-red-600" />}
          />

          <SelectBase
            propsForm={{
              name: "tipo_moneda",
              label: "Moneda",
              rules: [{ required: true, message: "Requerido" }],
              initialValue: "PEN",
            }}
            prefix={<FaMoneyBill className="text-green-600" />}
            options={[
              { value: "PEN", label: "SOLES" },
              { value: "USD", label: "DÓLARES" },
            ]}
          />

          <InputBase
            propsForm={{
              name: "observaciones",
              label: "F.Vence",
            }}
            placeholder="Fecha de vencimiento"
          />
        </div>
      </div>

      {/* Observaciones */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
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
