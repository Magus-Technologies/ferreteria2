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
import SelectBase from "~/app/_components/form/selects/select-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import { BsGeoAltFill } from "react-icons/bs";
import { useEffect, useState, useCallback } from "react";
import RadioDireccionCliente from "~/app/_components/form/radio-direccion-cliente";
import HiddenDireccionesFormItems from "~/app/_components/form/hidden-direcciones-form-items";
import { TipoDireccion } from "~/lib/api/cliente";
import {
  setDireccionesClienteToForm,
  clearDireccionesClienteFromForm,
} from "~/lib/utils/cliente-direcciones-form";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";
import AlertDeudaCliente from "../others/alert-deuda-cliente";
import InputCodigoVale from "../others/input-codigo-vale";
import BotonCanjearVale from "../others/boton-canjear-vale";
import { useUltimaCalificacionCliente } from "../../_hooks/use-ultima-calificacion-cliente";
import FloatingCalificacionCliente from "../alerts/floating-calificacion-cliente";

export default function FormCrearVenta({
  form,
  venta,
}: {
  form: FormInstance;
  venta?: VentaConUnidadDerivadaNormal;
}) {
  const recomendadoPor = (venta as any)?.recomendado_por || venta?.recomendadoPor;
  const clienteId = Form.useWatch("cliente_id", form);
  const [clienteTieneDeuda, setClienteTieneDeuda] = useState(false);
  const handleDeudaChange = useCallback((tieneDeuda: boolean) => setClienteTieneDeuda(tieneDeuda), []);

  // SelectClientes limpia cliente_id automáticamente al modificar el texto
  // (líneas 84-109 y 286-295 de select-clientes.tsx), así que basta con observar cliente_id.
  const clienteIdParaCalificacion = clienteId as number | undefined;

  const { data: calificacionResponse, isLoading: loadingCalificacion } =
    useUltimaCalificacionCliente(clienteIdParaCalificacion);

  // Reset deuda state when client changes
  useEffect(() => {
    if (!clienteId) setClienteTieneDeuda(false);
  }, [clienteId]);

  // Inicializar D1 al montar el componente
  useEffect(() => {
    if (!form.getFieldValue("direccion_seleccionada")) {
      form.setFieldValue("direccion_seleccionada", "D1");
    }
  }, [form]);

  return (
    <div className="flex flex-col gap-4">
      <FloatingCalificacionCliente
        calificacion={calificacionResponse?.data?.data}
        loading={loadingCalificacion}
        clienteId={clienteIdParaCalificacion}
      />
      {/* Campos ocultos para que Form.useWatch funcione */}
      <Form.Item name="stock_ya_aplicado" hidden>
        <input type="hidden" />
      </Form.Item>
      <Form.Item name="direccion_seleccionada" hidden>
        <input type="hidden" />
      </Form.Item>
      <HiddenDireccionesFormItems />
      <Form.Item name="fecha_nacimiento" hidden>
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

      </div>

      {/* 2da fila */}
      <div className="flex gap-3 sm:gap-4 lg:gap-6 items-end flex-wrap">
        <FormFormaDePago form={form} />

        <ConfigurableElement
          componentId="crear-venta.tipo-despacho"
          label="Campo Tipo Despacho"
        >
          <LabelBase
            label="Tipo Despacho:"
            classNames={{ labelParent: "mb-6" }}
            className="w-full sm:w-auto"
          >
            <SelectTipoDespacho
              propsForm={{
                name: "tipo_despacho",
                initialValue: "EnTienda",
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

        {/* InputCodigoVale: detecta automáticamente vales aplicables y vales pendientes del cliente.
            BotonCanjearVale: permite canjear manualmente un código (sorteo o próxima compra). */}
        <InputCodigoVale form={form} />
        <div className="mb-6 flex items-end">
          <BotonCanjearVale form={form} />
        </div>
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
              className={`w-full ${clienteTieneDeuda ? '[&_.ant-select-selection-item]:!text-red-600 [&_.ant-select-selection-search-input]:!text-red-600 [&_.ant-select-selection-placeholder]:!text-red-600' : ''}`}
              classNameIcon="text-rose-700 mx-1"
              placeholder="DNI/RUC"
              clienteOptionsDefault={venta?.cliente ? [{
                id: venta.cliente.id,
                numero_documento: venta.cliente.numero_documento || '',
                razon_social: venta.cliente.razon_social || '',
                nombres: venta.cliente.nombres || '',
                apellidos: venta.cliente.apellidos || '',
              }] : []}
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

                  // Actualizar fecha de nacimiento (campo oculto para edición)
                  form.setFieldValue("fecha_nacimiento", cliente.fecha_nacimiento || null);

                  // Distribuir las direcciones del cliente a los campos
                  // legacy (`_cliente_direccion_*`) iterando sobre el array
                  // — antes hacía 4 `find(d.tipo === 'Dx')` hardcoded.
                  setDireccionesClienteToForm(form, cliente);

                  // Actualizar direccion_entrega con la dirección principal
                  const direcciones = cliente.direcciones || [];
                  const direccionPrincipal = direcciones.find(d => d.es_principal);
                  const d1 = direcciones.find(d => d.tipo === TipoDireccion.D1)?.direccion || '';
                  form.setFieldValue("direccion_entrega", direccionPrincipal?.direccion || d1);
                } else {
                  form.setFieldValue("ruc_dni", "");
                  form.setFieldValue("cliente_nombre", "");
                  form.setFieldValue("telefono", "");
                  form.setFieldValue("email", "");
                  clearDireccionesClienteFromForm(form);
                  form.setFieldValue("direccion_entrega", "");
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
            label={
              <div className="flex items-center gap-2">
                <span>Cliente:</span>
                {loadingCalificacion && (
                  <span className="text-xs text-blue-500">Cargando...</span>
                )}
                {!loadingCalificacion && calificacionResponse?.data?.data && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Calificado
                  </span>
                )}
              </div>
            }
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
              className={`w-full ${clienteTieneDeuda ? '!text-red-600' : ''}`}
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

      {/* Alerta de deudas del cliente */}
      <AlertDeudaCliente clienteId={clienteId} onDeudaChange={handleDeudaChange} />

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
              form={form}
              propsForm={{
                name: "recomendado_por_id",
                hasFeedback: false,
                className:
                  "w-full sm:!min-w-[200px] sm:!w-[200px] sm:!max-w-[200px]",
              }}
              className="w-full"
              classNameIcon="text-cyan-600 mx-1"
              clienteOptionsDefault={recomendadoPor ? [{
                id: recomendadoPor.id,
                numero_documento: recomendadoPor.numero_documento || '',
                razon_social: recomendadoPor.razon_social || '',
                nombres: recomendadoPor.nombres || '',
                apellidos: recomendadoPor.apellidos || '',
              }] : []}
            />
          </LabelBase>
        </ConfigurableElement>

        <ConfigurableElement
          componentId="crear-venta.descontar-stock"
          label="Campo Descontar Stock"
        >
          <LabelBase
            label="Descontar stock:"
            classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
            className="w-full sm:w-auto"
          >
            <SelectBase
              propsForm={{
                name: "descontar_stock",
                hasFeedback: false,
                initialValue: "si",
                className:
                  "w-full sm:!min-w-[120px] sm:!w-[120px] sm:!max-w-[120px]",
              }}
              options={[
                { value: "si", label: "Sí" },
                { value: "no", label: "No" },
              ]}
              className="w-full"
            />
          </LabelBase>
        </ConfigurableElement>
      </div>
    </div>
  );
}
