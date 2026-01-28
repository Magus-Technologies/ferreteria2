import { FaCalendar } from "react-icons/fa6";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import LabelBase from "~/components/form/label-base";
import SelectTipoMoneda from "~/app/_components/form/selects/select-tipo-moneda";
import { Form, FormInstance } from "antd";
import InputNumberBase from "~/app/_components/form/inputs/input-number-base";
import SelectTipoDocumento from "~/app/_components/form/selects/select-tipo-documento";
import SelectTipoDespacho from "~/app/_components/form/selects/select-tipo-despacho";
import { VentaConUnidadDerivadaNormal } from "../others/header-crear-venta";
import FormFormaDePago from "~/app/_components/form/form-forma-de-pago";
import SelectClientes from "~/app/_components/form/selects/select-clientes";
import InputBase from "~/app/_components/form/inputs/input-base";
import { BsGeoAltFill } from "react-icons/bs";
import { useEffect } from "react";
import RadioDireccionCliente from "~/app/_components/form/radio-direccion-cliente";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";

export default function FormCrearVenta({
  form,
  venta,
}: {
  form: FormInstance;
  venta?: VentaConUnidadDerivadaNormal;
}) {
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
      <Form.Item name="_cliente_direccion_4" hidden>
        <input type="hidden" />
      </Form.Item>

      {/* Primera fila: Fecha, Tipo Moneda, Tipo de Cambio */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6">
        <ConfigurableElement
          componentId="crear-venta.fecha"
          label="Campo Fecha"
        >
          <LabelBase
            label="Fecha:"
            classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
            className="w-full sm:w-auto"
          >
            <DatePickerBase
              propsForm={{
                name: "fecha",
                rules: [
                  {
                    required: true,
                    message: "Por favor, ingresa la fecha",
                  },
                ],
              }}
              placeholder="Fecha"
              className="w-full sm:!w-[160px] sm:!min-w-[160px] sm:!max-w-[160px]"
              prefix={<FaCalendar size={15} className="text-rose-700 mx-1" />}
              disabledDate={(current) => {
                // Deshabilitar fechas anteriores a hoy
                // current && current < dayjs().startOf('day')
                return current && current.isBefore(new Date(), "day");
              }}
            />
          </LabelBase>
        </ConfigurableElement>

        <ConfigurableElement
          componentId="crear-venta.tipo-moneda"
          label="Campo Tipo Moneda"
        >
          <LabelBase
            label="Tipo Moneda:"
            classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
            className="w-full sm:w-auto"
          >
            <SelectTipoMoneda
              classNameIcon="text-rose-700 mx-1"
              className="w-full sm:!w-[120px] sm:!min-w-[120px] sm:!max-w-[120px]"
              propsForm={{
                name: "tipo_moneda",
                rules: [
                  {
                    required: true,
                    message: "Por favor, selecciona el tipo de moneda",
                  },
                ],
              }}
              onChangeTipoDeCambio={(value) =>
                form.setFieldValue("tipo_de_cambio", value)
              }
            />
          </LabelBase>
        </ConfigurableElement>

        <ConfigurableElement
          componentId="crear-venta.tipo-cambio"
          label="Campo Tipo de Cambio"
        >
          <LabelBase
            label="Tipo de Cambio:"
            classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
            className="w-full sm:w-auto"
          >
            <InputNumberBase
              propsForm={{
                name: "tipo_de_cambio",
                rules: [
                  {
                    required: true,
                    message: "Por favor, ingresa el tipo de cambio",
                  },
                ],
              }}
              prefix={<span className="text-rose-700 font-bold">S/. </span>}
              precision={4}
              min={1}
              className="w-full sm:!w-[100px] sm:!min-w-[100px] sm:!max-w-[100px]"
            />
          </LabelBase>
        </ConfigurableElement>

        <ConfigurableElement
          componentId="crear-venta.tipo-documento"
          label="Campo Tipo Documento"
        >
          <LabelBase
            label="Tipo Documento:"
            classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
            className="w-full sm:w-auto"
          >
            <SelectTipoDocumento
              propsForm={{
                name: "tipo_documento",
                initialValue: "03", // Valor por defecto: Boleta
                hasFeedback: false,
                className:
                  "w-full sm:!min-w-[150px] sm:!w-[150px] sm:!max-w-[150px]",
                rules: [
                  {
                    required: true,
                    message: "Selecciona el tipo de documento",
                  },
                ],
              }}
              className="w-full"
              classNameIcon="text-rose-700 mx-1"
            />
          </LabelBase>
        </ConfigurableElement>

        <ConfigurableElement
          componentId="crear-venta.tipo-despacho"
          label="Campo Tipo Despacho"
        >
          <LabelBase
            label="Tipo Despacho:"
            classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
            className="w-full sm:w-auto"
          >
            <SelectTipoDespacho
              propsForm={{
                name: "tipo_despacho",
                initialValue: "EnTienda", // Valor por defecto: Despacho en Tienda
                hasFeedback: false,
                className:
                  "w-full sm:!min-w-[220px] sm:!w-[220px] sm:!max-w-[220px]",
                rules: [
                  {
                    required: true,
                    message: "Selecciona el tipo de despacho",
                  },
                ],
              }}
              className="w-full"
              classNameIcon="text-rose-700 mx-1"
            />
          </LabelBase>
        </ConfigurableElement>
      </div>

      {/* 2da fila */}
      <div className="flex gap-3 sm:gap-4 lg:gap-6">
        <ConfigurableElement
          componentId="crear-venta.forma-pago"
          label="Forma de Pago"
        >
          <FormFormaDePago form={form} />
        </ConfigurableElement>
      </div>

      {/* 3ra fila: DNI/RUC (con lupa), Cliente (nombre más grande) y direccion*/}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6 items-star">
        <ConfigurableElement
          componentId="crear-venta.dni-ruc"
          label="Campo DNI/RUC"
        >
          <LabelBase
            label="DNI/RUC:"
            classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
            className="w-full sm:w-auto"
          >
            <SelectClientes
              form={form}
              showOnlyDocument={true}
              propsForm={{
                name: "cliente_id",
                hasFeedback: false,
                className:
                  "w-full sm:!min-w-[150px] sm:!w-[150px] sm:!max-w-[150px]",
              }}
              className="w-full"
              classNameIcon="text-rose-700 mx-1"
              placeholder="DNI/RUC"
              onChange={(_, cliente) => {
                // Actualizar los campos relacionados
                if (cliente) {
                  // Actualizar DNI/RUC (solo el número)
                  if (cliente.numero_documento) {
                    form.setFieldValue("ruc_dni", cliente.numero_documento);
                  }

                  // Actualizar nombre del cliente
                  const nombreCompleto = cliente.razon_social
                    ? cliente.razon_social
                    : `${cliente.nombres || ""} ${
                        cliente.apellidos || ""
                      }`.trim();
                  form.setFieldValue("cliente_nombre", nombreCompleto);

                  // Actualizar teléfono
                  form.setFieldValue("telefono", cliente.telefono || "");

                  // Actualizar email
                  form.setFieldValue("email", cliente.email || "");
                } else {
                  form.setFieldValue("ruc_dni", "");
                  form.setFieldValue("cliente_nombre", "");
                  form.setFieldValue("telefono", "");
                  form.setFieldValue("email", "");
                }
              }}
            />
          </LabelBase>
        </ConfigurableElement>

        <ConfigurableElement
          componentId="crear-venta.cliente-nombre"
          label="Campo Nombre Cliente"
        >
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
        </ConfigurableElement>

        <ConfigurableElement
          componentId="crear-venta.direccion"
          label="Campo Dirección"
        >
          <LabelBase
            label="Dirección:"
            classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
            className="w-full sm:w-auto sm:flex-1"
          >
            <InputBase
              prefix={<BsGeoAltFill className="text-cyan-600 mx-1" />}
              propsForm={{
                name: "direccion",
              }}
              placeholder="Dirección del cliente"
              className="w-full"
            />
          </LabelBase>
        </ConfigurableElement>

        <ConfigurableElement
          componentId="crear-venta.radio-direccion"
          label="Selector de Dirección"
        >
          <div className="mb-3 sm:mb-4 lg:mb-6">
            <RadioDireccionCliente form={form} />
          </div>
        </ConfigurableElement>
      </div>

      {/* ultima fila: Teléfono, Email, Recomendado por */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6">
        <ConfigurableElement
          componentId="crear-venta.telefono"
          label="Campo Teléfono"
        >
          <LabelBase
            label="Teléfono:"
            classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
            className="w-full sm:w-auto"
          >
            <InputBase
              propsForm={{
                name: "telefono",
                hasFeedback: false,
                className:
                  "w-full sm:!min-w-[150px] sm:!w-[150px] sm:!max-w-[150px]",
              }}
              placeholder="Teléfono"
              className="w-full"
              readOnly
              uppercase={false}
            />
          </LabelBase>
        </ConfigurableElement>

        <ConfigurableElement
          componentId="crear-venta.email"
          label="Campo Email"
        >
          <LabelBase
            label="Email:"
            classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
            className="w-full sm:w-auto"
          >
            <InputBase
              propsForm={{
                name: "email",
                hasFeedback: false,
                className:
                  "w-full sm:!min-w-[250px] sm:!w-[250px] sm:!max-w-[250px]",
              }}
              placeholder="Email del cliente"
              className="w-full"
              readOnly
              uppercase={false}
            />
          </LabelBase>
        </ConfigurableElement>

        <ConfigurableElement
          componentId="crear-venta.recomendado-por"
          label="Campo Recomendado Por"
        >
          <LabelBase
            label="Recomendado por:"
            classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
            className="w-full sm:w-auto"
          >
            <SelectClientes
              propsForm={{
                name: "recomendado_por_id",
                hasFeedback: false,
                className:
                  "w-full sm:!min-w-[200px] sm:!w-[200px] sm:!max-w-[200px]",
              }}
              className="w-full"
              classNameIcon="text-cyan-600 mx-1"
            />
          </LabelBase>
        </ConfigurableElement>
      </div>
    </div>
  );
}
