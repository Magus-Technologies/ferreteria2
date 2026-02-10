"use client";

import { FormInstance } from "antd";
import LabelBase from "~/components/form/label-base";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import SelectTipoMoneda from "~/app/_components/form/selects/select-tipo-moneda";
import InputNumberBase from "~/app/_components/form/inputs/input-number-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import SelectBase from "~/app/_components/form/selects/select-base";
import SelectMotivoNota from "~/app/_components/form/selects/select-motivo-nota";
import { FaCalendar } from "react-icons/fa6";

interface FormNotaDebitoProps {
  form: FormInstance;
}

export default function FormNotaDebito({ form }: FormNotaDebitoProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Primera fila: Fecha, Tipo Doc, Serie, Número */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6">
        <LabelBase
          label="Fecha:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto"
        >
          <DatePickerBase
            propsForm={{
              name: "fecha_emision",
              rules: [{ required: true, message: "Por favor, ingresa la fecha" }],
            }}
            placeholder="Fecha"
            className="w-full sm:!w-[160px] sm:!min-w-[160px] sm:!max-w-[160px]"
            prefix={<FaCalendar size={15} className="text-orange-600 mx-1" />}
          />
        </LabelBase>
        
        <LabelBase
          label="Tipo Doc:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto"
        >
          <SelectBase
            propsForm={{
              name: "tipo_documento_modifica",
              rules: [{ required: true, message: "Selecciona el tipo de documento" }],
            }}
            className="w-full sm:!w-[120px] sm:!min-w-[120px] sm:!max-w-[120px]"
            options={[
              { value: "01", label: "Factura" },
              { value: "03", label: "Boleta" },
            ]}
          />
        </LabelBase>
        
        <LabelBase
          label="Serie:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto"
        >
          <InputBase
            propsForm={{
              name: "serie_documento_modifica",
              rules: [{ required: true, message: "Ingresa la serie" }],
            }}
            placeholder="F001"
            maxLength={4}
            className="w-full sm:!w-[100px] sm:!min-w-[100px] sm:!max-w-[100px]"
          />
        </LabelBase>
        
        <LabelBase
          label="Número:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto"
        >
          <InputBase
            propsForm={{
              name: "numero_documento_modifica",
              rules: [{ required: true, message: "Ingresa el número" }],
            }}
            placeholder="00000001"
            maxLength={8}
            className="w-full sm:!w-[120px] sm:!min-w-[120px] sm:!max-w-[120px]"
          />
        </LabelBase>
      </div>

      {/* Segunda fila: RUC/DNI, Nombre Cliente */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6">
        <LabelBase
          label="RUC/DNI:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto"
        >
          <InputBase
            propsForm={{
              name: "cliente_numero_documento",
              hasFeedback: false,
              className: "w-full sm:!min-w-[150px] sm:!w-[150px] sm:!max-w-[150px]",
            }}
            placeholder="DNI/RUC"
            className="w-full"
            readOnly
          />
        </LabelBase>
        
        <LabelBase
          label="Cliente:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:flex-1"
        >
          <InputBase
            propsForm={{
              name: "cliente_nombre",
              hasFeedback: false,
              className: "w-full",
            }}
            placeholder="Nombre del cliente"
            className="w-full"
            readOnly
            uppercase={false}
          />
        </LabelBase>
      </div>

      {/* Tercera fila: Dirección, Teléfono, Email */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6">
        <LabelBase
          label="Dirección:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:flex-1"
        >
          <InputBase
            propsForm={{
              name: "cliente_direccion",
              hasFeedback: false,
              className: "w-full",
            }}
            placeholder="Dirección del cliente"
            className="w-full"
            readOnly
            uppercase={false}
          />
        </LabelBase>
        
        <LabelBase
          label="Teléfono:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto"
        >
          <InputBase
            propsForm={{
              name: "cliente_telefono",
              hasFeedback: false,
              className: "w-full sm:!min-w-[120px] sm:!w-[120px] sm:!max-w-[120px]",
            }}
            placeholder="Teléfono"
            className="w-full"
            readOnly
            uppercase={false}
          />
        </LabelBase>
        
        <LabelBase
          label="Email:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto"
        >
          <InputBase
            propsForm={{
              name: "cliente_email",
              hasFeedback: false,
              className: "w-full sm:!min-w-[200px] sm:!w-[200px] sm:!max-w-[200px]",
            }}
            placeholder="Email"
            className="w-full"
            readOnly
            uppercase={false}
          />
        </LabelBase>
      </div>

      {/* Cuarta fila: Motivo de Nota */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6">
        <LabelBase
          label="Motivo:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:flex-1"
        >
          <SelectMotivoNota
            tipo="debito"
            propsForm={{
              name: "motivo_nota_id",
              rules: [{ required: true, message: "Selecciona el motivo" }],
              hasFeedback: false,
              className: "w-full",
            }}
            placeholder="Seleccione motivo de nota de débito"
            className="w-full"
            showSearch
          />
        </LabelBase>
      </div>

      {/* Quinta fila: Moneda, Tipo de Cambio, Observaciones */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6">
        <LabelBase
          label="Moneda:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto"
        >
          <SelectTipoMoneda
            className="w-full sm:!w-[120px] sm:!min-w-[120px] sm:!max-w-[120px]"
            classNameIcon="text-orange-600 mx-1"
            propsForm={{
              name: "tipo_moneda",
              rules: [{ required: true, message: "Selecciona la moneda" }],
            }}
            onChangeTipoDeCambio={(value) =>
              form.setFieldValue("tipo_de_cambio", value)
            }
          />
        </LabelBase>
        
        <LabelBase
          label="T. Cambio:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto"
        >
          <InputNumberBase
            propsForm={{
              name: "tipo_de_cambio",
              rules: [{ required: true, message: "Ingresa el tipo de cambio" }],
            }}
            prefix={<span className="text-orange-600 font-bold">S/. </span>}
            precision={4}
            min={1}
            className="w-full sm:!w-[100px] sm:!min-w-[100px] sm:!max-w-[100px]"
          />
        </LabelBase>
        
        <LabelBase
          label="Observaciones:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:flex-1"
        >
          <InputBase
            propsForm={{
              name: "observaciones",
              hasFeedback: false,
              className: "w-full",
            }}
            placeholder="Observaciones adicionales"
            className="w-full"
            uppercase={false}
          />
        </LabelBase>
      </div>
    </div>
  );
}

