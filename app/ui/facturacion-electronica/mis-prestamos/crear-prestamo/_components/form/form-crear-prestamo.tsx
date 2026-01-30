"use client";

import { FormInstance, Form } from "antd";
import type { FormCreatePrestamo } from "../../_types/prestamo.types";
import {
  TipoOperacion,
  TipoEntidad,
} from "~/lib/api/prestamo";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import TextareaBase from "~/app/_components/form/inputs/textarea-base";
import LabelBase from "~/components/form/label-base";
import { FaCalendar, FaClipboardList, FaShieldAlt } from "react-icons/fa";
import { MdCategory } from "react-icons/md";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useAuth } from "~/lib/auth-context";
import { prestamoApi } from "~/lib/api/prestamo";
import { useStoreProductoAgregadoPrestamo } from "../../_store/store-producto-agregado-prestamo";
import FormSeccionCliente from "~/app/_components/form/form-seccion-cliente";
import SelectBase from "~/app/_components/form/selects/select-base";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";

export default function FormCrearPrestamo({
  form,
}: {
  form: FormInstance<FormCreatePrestamo>;
}) {
  const { user } = useAuth();
  const tipo_entidad = useStoreProductoAgregadoPrestamo(
    (state) => state.tipo_entidad
  );
  const tipo_operacion = useStoreProductoAgregadoPrestamo(
    (state) => state.tipo_operacion
  );
  const setTipoEntidad = useStoreProductoAgregadoPrestamo(
    (state) => state.setTipoEntidad
  );
  const setTipoOperacion = useStoreProductoAgregadoPrestamo(
    (state) => state.setTipoOperacion
  );

  // Autocompletar vendedor
  useEffect(() => {
    if (user?.name) {
      form.setFieldValue("vendedor", user.name);
    }
  }, [user, form]);

  // Cargar siguiente número
  useEffect(() => {
    const cargarSiguienteNumero = async () => {
      const response = await prestamoApi.getSiguienteNumero();
      if (response.data?.numero) {
        form.setFieldValue("numero", response.data.numero);
      }
    };
    cargarSiguienteNumero();
  }, [form]);

  // Sincronizar tipo_operacion y tipo_entidad con el store
  useEffect(() => {
    form.setFieldValue("tipo_operacion", tipo_operacion);
    form.setFieldValue("tipo_entidad", tipo_entidad);
  }, [tipo_operacion, tipo_entidad, form]);

  return (
    <div className="flex flex-col gap-4">
      {/* Fila 1: Fecha, Fecha Vencimiento, Tipo Operación, Tipo Entidad */}
      <div className="flex gap-4">
        <LabelBase label="Fecha:" classNames={{ labelParent: "mb-6" }}>
          <ConfigurableElement componentId="field-fecha-prestamo" label="Campo Fecha">
            <DatePickerBase
              propsForm={{
                name: "fecha",
                initialValue: dayjs(),
                rules: [{ required: true, message: "Requerido" }],
              }}
              className="!w-[150px]"
              prefix={<FaCalendar size={15} className="text-rose-700 mx-1" />}
            />
          </ConfigurableElement>
        </LabelBase>

        <LabelBase label="F. Vencimiento:" classNames={{ labelParent: "mb-6" }}>
          <ConfigurableElement componentId="field-fecha-vencimiento-prestamo" label="Campo Fecha Vencimiento">
            <DatePickerBase
              propsForm={{
                name: "fecha_vencimiento",
                initialValue: dayjs().add(30, "days"),
                rules: [{ required: true, message: "Requerido" }],
              }}
              className="!w-[150px]"
              prefix={<FaCalendar size={15} className="text-rose-700 mx-1" />}
            />
          </ConfigurableElement>
        </LabelBase>

        <LabelBase label="Operación:" classNames={{ labelParent: "mb-6" }}>
          <ConfigurableElement componentId="field-tipo-operacion-prestamo" label="Campo Tipo Operación">
            <SelectBase
              propsForm={{
                name: "tipo_operacion",
                initialValue: TipoOperacion.PRESTAR,
                rules: [{ required: true }],
              }}
              className="!w-[170px]"
              onChange={(value) => setTipoOperacion(value as TipoOperacion)}
              prefix={<FaClipboardList size={15} className="text-rose-700 mx-1" />}
              options={[
                { value: TipoOperacion.PRESTAR, label: "PRESTAR" },
                {
                  value: TipoOperacion.PEDIR_PRESTADO,
                  label: "PEDIR PRESTADO",
                },
              ]}
            />
          </ConfigurableElement>
        </LabelBase>

        <LabelBase label="Tipo:" classNames={{ labelParent: "mb-6" }}>
          <ConfigurableElement componentId="field-tipo-entidad-prestamo" label="Campo Tipo Entidad">
            <SelectBase
              propsForm={{
                name: "tipo_entidad",
                initialValue: TipoEntidad.CLIENTE,
                rules: [{ required: true }],
              }}
              className="!w-[150px]"
              onChange={(value) => setTipoEntidad(value as TipoEntidad)}
              prefix={<MdCategory size={15} className="text-rose-700 mx-1" />}
              options={[
                { value: TipoEntidad.CLIENTE, label: "CLIENTE" },
                { value: TipoEntidad.PROVEEDOR, label: "PROVEEDOR" },
              ]}
            />
          </ConfigurableElement>
        </LabelBase>
{/* 
        <LabelBase label="Moneda:" classNames={{ labelParent: "mb-6" }}>
          <Form.Item
            name="tipo_moneda"
            initialValue={TipoMoneda.SOLES}
            rules={[{ required: true }]}
          >
            <Select
              className="!w-[120px]"
              options={[
                { value: TipoMoneda.SOLES, label: "S/. Soles" },
                { value: TipoMoneda.DOLARES, label: "$ Dólares" },
              ]}
            />
          </Form.Item>
        </LabelBase> */}
      </div>

      {/* Fila 2: DNI/RUC, Cliente/Proveedor, Dirección, Radio */}
      <FormSeccionCliente
        form={form}
        tipoEntidad={tipo_entidad === TipoEntidad.CLIENTE ? "cliente" : "proveedor"}
        iconColor="text-amber-600"
        required={true}
        showContacto={false}
      />

      {/* Fila 3: Teléfono y Garantía */}
      <div className="flex flex-wrap gap-4">
        <LabelBase label="Teléfono:" classNames={{ labelParent: "mb-6" }}>
          <ConfigurableElement componentId="field-telefono-prestamo" label="Campo Teléfono">
            <InputBase
              propsForm={{
                name: "telefono",
                hasFeedback: false,
                className: "!min-w-[150px] !w-[150px] !max-w-[150px]",
              }}
              placeholder="999999999"
              readOnly
              uppercase={false}
            />
          </ConfigurableElement>
        </LabelBase>

        <LabelBase label="Garantía:" classNames={{ labelParent: "mb-6" }} className="flex-1">
          <ConfigurableElement componentId="field-garantia-prestamo" label="Campo Garantía">
            <InputBase
              propsForm={{ name: "garantia" }}
              className="w-full"
              placeholder="Ej: DNI 12345678, Taladro Bosch, etc."
              prefix={<FaShieldAlt size={15} className="text-cyan-600 mx-1" />}
            />
          </ConfigurableElement>
        </LabelBase>
      </div>

    

      {/* Fila 4: Observaciones */}
      <div className="flex gap-4">
        <LabelBase
          label="Observaciones:"
          orientation="column"
          className="flex-1"
        >
          <ConfigurableElement componentId="field-observaciones-prestamo" label="Campo Observaciones">
            <TextareaBase
              propsForm={{ name: "observaciones" }}
              rows={2}
              placeholder="Observaciones adicionales del préstamo"
            />
          </ConfigurableElement>
        </LabelBase>
      </div>
    </div>
  );
}
