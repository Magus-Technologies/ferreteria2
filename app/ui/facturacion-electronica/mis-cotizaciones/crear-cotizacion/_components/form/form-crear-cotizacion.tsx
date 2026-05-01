"use client";

import { FormInstance, Form } from "antd";
import type { FormCreateCotizacion } from "../../_types/cotizacion.types";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import SelectClientes from "~/app/_components/form/selects/select-clientes";
import InputNumberBase from "~/app/_components/form/inputs/input-number-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import FormFormaDePago from "~/app/_components/form/form-forma-de-pago";
import SelectTipoDocumento from "~/app/_components/form/selects/select-tipo-documento";
import LabelBase from "~/components/form/label-base";
import { FaCalendar } from "react-icons/fa6";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useAuth } from "~/lib/auth-context";
import { cotizacionesApi } from "~/lib/api/cotizaciones";
import RadioDireccionCliente from "~/app/_components/form/radio-direccion-cliente";
import HiddenDireccionesFormItems from "~/app/_components/form/hidden-direcciones-form-items";
import { BsGeoAltFill } from "react-icons/bs";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";

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

  // Inicializar D1 al montar el componente
  useEffect(() => {
    if (!form.getFieldValue("direccion_seleccionada")) {
      form.setFieldValue("direccion_seleccionada", "D1");
    }
  }, [form]);

  return (
    <div className="flex flex-col">
      {/* Campos ocultos para que Form.useWatch funcione */}
      <Form.Item name="direccion_seleccionada" hidden>
        <input type="hidden" />
      </Form.Item>
      <HiddenDireccionesFormItems />

      {/* Fila 1: Fecha Proforma, Vendedor, N° Cotización, Moneda */}
      <div className="flex gap-6">
        {/* Fecha de la cotización (REQUERIDO) - Se usa como fecha y fecha_proforma */}
        <LabelBase label="Fecha Proforma:" classNames={{ labelParent: "mb-6" }}>
          <ConfigurableElement componentId="field-fecha-cotizacion" label="Campo Fecha Proforma">
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
                  disabledDate={(current) => {
                // Deshabilitar fechas anteriores a hoy
                // current && current < dayjs().startOf('day')
                return current && current.isBefore(new Date(), 'day')
              }}
              className="!w-[160px] !min-w-[160px] !max-w-[160px]"
              prefix={<FaCalendar size={15} className="text-rose-700 mx-1" />}
            />
          </ConfigurableElement>
        </LabelBase>

        <LabelBase label="Vendedor:" classNames={{ labelParent: "mb-6" }}>
          <ConfigurableElement componentId="field-vendedor-cotizacion" label="Campo Vendedor">
            <InputBase
              propsForm={{
                name: "vendedor",
                hasFeedback: false,
                className: "!min-w-[250px] !w-[250px] !max-w-[250px]",
              }}
              placeholder="Código o nombre del vendedor"
              prefix={<span className="text-rose-700 mx-1">👤</span>}
            />
          </ConfigurableElement>
        </LabelBase>

        {/* N° Cotización: Generado automáticamente (COT-2025-001) */}
        <LabelBase label="N° Cotización:" classNames={{ labelParent: "mb-6" }}>
          <ConfigurableElement componentId="field-numero-cotizacion" label="Campo N° Cotización">
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
          </ConfigurableElement>
        </LabelBase>
        <LabelBase label="T.Doc:" classNames={{ labelParent: "mb-6" }}>
          <ConfigurableElement componentId="field-tipo-documento-cotizacion" label="Campo Tipo Documento">
            <SelectTipoDocumento
              propsForm={{
                name: "tipo_documento",
                hasFeedback: false,
                className: "!min-w-[150px] !w-[150px] !max-w-[150px]",
              }}
              className="w-full"
              classNameIcon="text-rose-700 mx-1"
            />
          </ConfigurableElement>
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

      {/* Fila 2: f.pago, n dias, f vence */}
      <div className="flex gap-6">
        <FormFormaDePago
          form={form}
          fieldNames={{ numeroDias: "vigencia_dias" }}
          labelNumeroDias="N° DIAS:"
        />

        {/* Checkbox: Reservar Stock */}
        <LabelBase label="Opciones:" classNames={{ labelParent: "mb-6" }}>
          <ConfigurableElement componentId="field-reservar-stock-cotizacion" label="Checkbox Reservar Stock">
            <Form.Item
              name="reservar_stock"
              valuePropName="checked"
              initialValue={false}
              className="mb-0"
            >
              <div className="flex items-center gap-2 h-[40px]">
                <input
                  type="checkbox"
                  id="reservar_stock"
                  className="w-4 h-4 text-rose-600 bg-gray-100 border-gray-300 rounded focus:ring-rose-500 focus:ring-2 cursor-pointer"
                  checked={form.getFieldValue("reservar_stock")}
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
            </Form.Item>
          </ConfigurableElement>
        </LabelBase>
      </div>

      {/* Fila 3: DNI/RUC (con lupa), Cliente y direccion*/}
      <div className="flex gap-6 items-end">
        <LabelBase label="DNI/RUC:" classNames={{ labelParent: "mb-6" }}>
          <ConfigurableElement componentId="field-cliente-cotizacion" label="Campo Cliente (DNI/RUC)">
            <SelectClientes
              form={form}
              showOnlyDocument={true}
              propsForm={{
                name: "cliente_id",
                hasFeedback: false,
                className: "!min-w-[180px] !w-[180px] !max-w-[180px]",
              }}
              className="w-full"
              classNameIcon="text-rose-700 mx-1"
              placeholder="DNI/RUC"
              onChange={(_, cliente) => {
                // Actualizar los campos relacionados
                if (cliente) {
                  // Actualizar DNI/RUC (solo el número)
                  if (cliente.numero_documento) {
                    form.setFieldValue('ruc_dni', cliente.numero_documento);
                  }
                  
                  // Actualizar nombre del cliente
                  const nombreCompleto = cliente.razon_social 
                    ? cliente.razon_social
                    : `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
                  form.setFieldValue('cliente_nombre', nombreCompleto);
                  
                  // Actualizar dirección (usar dirección principal del nuevo sistema)
                  const direccionPrincipal = cliente.direcciones?.find(d => d.es_principal);
                  if (direccionPrincipal) {
                    form.setFieldValue('direccion', direccionPrincipal.direccion);
                  } else if (cliente.direcciones && cliente.direcciones.length > 0) {
                    form.setFieldValue('direccion', cliente.direcciones[0].direccion);
                  }
                  
                  // Actualizar teléfono
                  form.setFieldValue('telefono', cliente.telefono || '');
                  
                  // Actualizar email
                  form.setFieldValue('email', cliente.email || '');
                } else {
                  form.setFieldValue('ruc_dni', '');
                  form.setFieldValue('cliente_nombre', '');
                  form.setFieldValue('direccion', '');
                  form.setFieldValue('telefono', '');
                  form.setFieldValue('email', '');
                }
              }}
            />
          </ConfigurableElement>
        </LabelBase>

        <LabelBase label="Cliente:" classNames={{ labelParent: "mb-6" }}>
          <ConfigurableElement componentId="field-nombre-cliente-cotizacion" label="Campo Nombre Cliente">
            <InputBase
              propsForm={{
                name: "cliente_nombre",
                hasFeedback: false,
                className: "!min-w-[250px] !w-[250px] !max-w-[250px]",
              }}
              placeholder="Nombre del cliente"
              className="w-full"
              readOnly
              uppercase={false}
            />
          </ConfigurableElement>
        </LabelBase>

        <LabelBase label="Dirección:" classNames={{ labelParent: "mb-6" }}>
          <ConfigurableElement componentId="field-direccion-cotizacion" label="Campo Dirección">
            <InputBase
              propsForm={{
                name: "direccion",
                hasFeedback: false,
                className: "!min-w-[300px] !w-[300px] !max-w-[300px]",
              }}
              placeholder="Dirección del cliente"
              prefix={<BsGeoAltFill className="text-cyan-600 mx-1" />}
             
            />
          </ConfigurableElement>
        </LabelBase>
        
        <div className="mb-6">
          <RadioDireccionCliente form={form} />
        </div>
      </div>

      {/* Fila 4: Telefono, Email */}
      <div className="flex gap-6">
        <LabelBase label="Tele/Cel:" classNames={{ labelParent: "mb-6" }}>
          <ConfigurableElement componentId="field-telefono-cotizacion" label="Campo Teléfono">
            <InputBase
              propsForm={{
                name: "telefono",
                hasFeedback: false,
                className: "!min-w-[150px] !w-[150px] !max-w-[150px]",
              }}
              placeholder="Teléfono"
              readOnly
              uppercase={false}
            />
          </ConfigurableElement>
        </LabelBase>

        <LabelBase label="Email:" classNames={{ labelParent: "mb-6" }}>
          <ConfigurableElement componentId="field-email-cotizacion" label="Campo Email">
            <InputBase
              propsForm={{
                name: "email",
                hasFeedback: false,
                className: "!min-w-[250px] !w-[250px] !max-w-[250px]",
              }}
              placeholder="Email del cliente"
              readOnly
              uppercase={false}
            />
          </ConfigurableElement>
        </LabelBase>
      </div>
    </div>
  );
}
