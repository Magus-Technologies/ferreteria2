"use client";

import { Form, FormInstance, Alert } from "antd";
import LabelBase from "~/components/form/label-base";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import SelectTipoMoneda from "~/app/_components/form/selects/select-tipo-moneda";
import InputNumberBase from "~/app/_components/form/inputs/input-number-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import SelectBase from "~/app/_components/form/selects/select-base";
import SelectMotivoNota from "~/app/_components/form/selects/select-motivo-nota";
import { FaCalendar } from "react-icons/fa";
import { useMotivoInfo } from "../_hooks/use-motivo-info";

interface FormNotaDebitoProps {
  form: FormInstance;
}

export default function FormNotaDebito({ form }: FormNotaDebitoProps) {
  // Observar el motivo seleccionado para mostrar ayuda contextual
  const motivoNotaId = Form.useWatch("motivo_nota_id", form);
  const observaciones = Form.useWatch("observaciones", form) || "";
  
  // Obtener información del motivo seleccionado
  const motivoInfo = useMotivoInfo(motivoNotaId);
  
  // Validar longitud de observaciones para motivos que lo requieren
  const longitudObservaciones = observaciones.length;
  const requiereDescripcion = motivoInfo?.requiereDescripcion || false;
  const descripcionValida = !requiereDescripcion || longitudObservaciones >= 20;
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
      <div className="flex flex-col gap-3">
        <LabelBase
          label="Motivo:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full"
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
        
        {/* Ayuda contextual del motivo seleccionado */}
        {motivoInfo && (
          <Alert
            message={
              <div className="flex items-start gap-2">
                <span className="text-lg">{motivoInfo.emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{motivoInfo.texto}</div>
                  {motivoInfo.requiereDescripcion && (
                    <div className="text-xs mt-1 text-orange-600">
                      {descripcionValida ? (
                        <span className="text-green-600">✓ Descripción válida ({longitudObservaciones} caracteres)</span>
                      ) : (
                        <span>⚠️ Faltan {20 - longitudObservaciones} caracteres en observaciones</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            }
            type={motivoInfo.requiereDescripcion && !descripcionValida ? "warning" : "info"}
            showIcon={false}
            className="!border-orange-200 !bg-orange-50"
          />
        )}
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
          label={
            <div className="flex items-center gap-2">
              <span>Observaciones:</span>
              {requiereDescripcion && (
                <span className="text-orange-600 text-xs font-normal">
                  (Requerido - mín. 20 caracteres)
                </span>
              )}
            </div>
          }
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:flex-1"
        >
          <InputBase
            propsForm={{
              name: "observaciones",
              rules: requiereDescripcion ? [
                { required: true, message: "Las observaciones son requeridas para este motivo" },
                { min: 20, message: "Debe ingresar al menos 20 caracteres" },
              ] : undefined,
              hasFeedback: requiereDescripcion,
              className: "w-full",
            }}
            placeholder={
              requiereDescripcion
                ? "Describa detalladamente el motivo de la nota de débito (mínimo 20 caracteres)"
                : "Observaciones adicionales"
            }
            className="w-full"
            uppercase={false}
            maxLength={500}
          />
        </LabelBase>
      </div>
    </div>
  );
}

