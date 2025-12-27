"use client";

import { FormInstance, Form, Select, InputNumber } from "antd";
import type { FormCreatePrestamo } from "../../_types/prestamo.types";
import {
  TipoOperacion,
  TipoEntidad,
  TipoMoneda,
  TipoInteres,
} from "~/lib/api/prestamo";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import SelectClientes from "~/app/_components/form/selects/select-clientes";
import InputBase from "~/app/_components/form/inputs/input-base";
import TextareaBase from "~/app/_components/form/inputs/textarea-base";
import LabelBase from "~/components/form/label-base";
import { FaCalendar } from "react-icons/fa6";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useAuth } from "~/lib/auth-context";
import { prestamoApi } from "~/lib/api/prestamo";
import { useStoreProductoAgregadoPrestamo } from "../../_store/store-producto-agregado-prestamo";
import RadioDireccionCliente from "~/app/_components/form/radio-direccion-cliente";

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

  // Inicializar D1 al montar el componente
  useEffect(() => {
    if (!form.getFieldValue("direccion_seleccionada")) {
      form.setFieldValue("direccion_seleccionada", "D1");
    }
  }, [form]);

  return (
    <div className="flex flex-col gap-4">
      {/* Campos ocultos para que Form.useWatch funcione */}
      <Form.Item name="direccion_seleccionada" hidden>
        <input type="hidden" />
      </Form.Item>
      <Form.Item name="_cliente_direccion_1" hidden>
        <input type="hidden" />
      </Form.Item>
      <Form.Item name="_cliente_direccion_2" hidden>
        <input type="hidden" />
      </Form.Item>
      <Form.Item name="_cliente_direccion_3" hidden>
        <input type="hidden" />
      </Form.Item>

      {/* Fila 1: Fecha, Fecha Vencimiento, Tipo Operación, Tipo Entidad */}
      <div className="flex gap-4">
        <LabelBase label="Fecha:" classNames={{ labelParent: "mb-6" }}>
          <DatePickerBase
            propsForm={{
              name: "fecha",
              initialValue: dayjs(),
              rules: [{ required: true, message: "Requerido" }],
            }}
            className="!w-[150px]"
            prefix={<FaCalendar size={15} className="text-amber-600 mx-1" />}
          />
        </LabelBase>

        <LabelBase label="F. Vencimiento:" classNames={{ labelParent: "mb-6" }}>
          <DatePickerBase
            propsForm={{
              name: "fecha_vencimiento",
              initialValue: dayjs().add(30, "days"),
              rules: [{ required: true, message: "Requerido" }],
            }}
            className="!w-[150px]"
            prefix={<FaCalendar size={15} className="text-amber-600 mx-1" />}
          />
        </LabelBase>

        <LabelBase label="Operación:" classNames={{ labelParent: "mb-6" }}>
          <Form.Item
            name="tipo_operacion"
            initialValue={TipoOperacion.PRESTAR}
            rules={[{ required: true }]}
          >
            <Select
              className="!w-[170px]"
              onChange={(value) => setTipoOperacion(value as TipoOperacion)}
              options={[
                { value: TipoOperacion.PRESTAR, label: "PRESTAR" },
                {
                  value: TipoOperacion.PEDIR_PRESTADO,
                  label: "PEDIR PRESTADO",
                },
              ]}
            />
          </Form.Item>
        </LabelBase>

        <LabelBase label="Tipo:" classNames={{ labelParent: "mb-6" }}>
          <Form.Item
            name="tipo_entidad"
            initialValue={TipoEntidad.CLIENTE}
            rules={[{ required: true }]}
          >
            <Select
              className="!w-[150px]"
              onChange={(value) => setTipoEntidad(value as TipoEntidad)}
              options={[
                { value: TipoEntidad.CLIENTE, label: "CLIENTE" },
                { value: TipoEntidad.PROVEEDOR, label: "PROVEEDOR" },
              ]}
            />
          </Form.Item>
        </LabelBase>

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
        </LabelBase>
      </div>

      {/* Fila 2: Cliente/Proveedor, RUC/DNI, Teléfono */}
      <div className="flex gap-4">
        {tipo_entidad === TipoEntidad.CLIENTE ? (
          <LabelBase label="Cliente:" classNames={{ labelParent: "mb-6" }}>
            <SelectClientes
              form={form}
              propsForm={{
                name: "cliente_id",
                rules: [{ required: true, message: "Selecciona un cliente" }],
              }}
              className="!w-[300px]"
            />
          </LabelBase>
        ) : (
          <LabelBase label="Proveedor:" classNames={{ labelParent: "mb-6" }}>
            <Form.Item
              name="proveedor_id"
              rules={[{ required: true, message: "Selecciona un proveedor" }]}
            >
              <Select
                className="!w-[300px]"
                placeholder="Selecciona proveedor"
                showSearch
                optionFilterProp="children"
              />
            </Form.Item>
          </LabelBase>
        )}

        <LabelBase label="RUC/DNI:" classNames={{ labelParent: "mb-6" }}>
          <InputBase
            propsForm={{ name: "ruc_dni" }}
            className="!w-[150px]"
            placeholder="20123456789"
          />
        </LabelBase>

        <LabelBase label="Teléfono:" classNames={{ labelParent: "mb-6" }}>
          <InputBase
            propsForm={{ name: "telefono" }}
            className="!w-[150px]"
            placeholder="999999999"
          />
        </LabelBase>

        <LabelBase label="Vendedor:" classNames={{ labelParent: "mb-6" }}>
          <InputBase
            propsForm={{ name: "vendedor" }}
            className="!w-[200px]"
            placeholder="Nombre vendedor"
          />
        </LabelBase>
      </div>

      {/* Fila 3: Intereses y Garantía */}
      <div className="flex gap-4">
        <LabelBase
          label="Tasa Interés (%):"
          classNames={{ labelParent: "mb-6" }}
        >
          <Form.Item name="tasa_interes">
            <InputNumber
              className="!w-[120px]"
              min={0}
              max={100}
              step={0.1}
              precision={2}
              placeholder="0.00"
            />
          </Form.Item>
        </LabelBase>

        <LabelBase label="Tipo Interés:" classNames={{ labelParent: "mb-6" }}>
          <Form.Item name="tipo_interes">
            <Select
              className="!w-[150px]"
              placeholder="Seleccionar"
              allowClear
              options={[
                { value: TipoInteres.SIMPLE, label: "SIMPLE" },
                { value: TipoInteres.COMPUESTO, label: "COMPUESTO" },
              ]}
            />
          </Form.Item>
        </LabelBase>

        <LabelBase label="Días Gracia:" classNames={{ labelParent: "mb-6" }}>
          <Form.Item name="dias_gracia" initialValue={0}>
            <InputNumber className="!w-[120px]" min={0} placeholder="0" />
          </Form.Item>
        </LabelBase>

        <LabelBase label="Garantía:" classNames={{ labelParent: "mb-6" }}>
          <InputBase
            propsForm={{ name: "garantia" }}
            className="!w-[300px]"
            placeholder="Descripción de la garantía"
          />
        </LabelBase>
        <div className="flex items-center ml-auto">
          <RadioDireccionCliente form={form} />
        </div>
      </div>

      {/* Fila 4: Dirección y Observaciones */}
      <div className="flex gap-4">
        <LabelBase
          label="Observaciones:"
          orientation="column"
          className="flex-1"
        >
          <TextareaBase
            propsForm={{ name: "observaciones" }}
            rows={3}
            placeholder="Observaciones adicionales del préstamo"
          />
        </LabelBase>
        <LabelBase label="Dirección:" orientation="column" className="flex-1">
          <InputBase
            propsForm={{ name: "direccion" }}
            placeholder="Dirección completa"
          />
        </LabelBase>
      </div>
    </div>
  );
}
