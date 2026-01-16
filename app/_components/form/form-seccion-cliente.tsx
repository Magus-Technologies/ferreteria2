"use client";

import { Form, FormInstance } from "antd";
import { useEffect } from "react";
import { BsGeoAltFill } from "react-icons/bs";
import SelectClientes from "~/app/_components/form/selects/select-clientes";
import SelectProveedores from "~/app/_components/form/selects/select-proveedores";
import InputBase from "~/app/_components/form/inputs/input-base";
import LabelBase from "~/components/form/label-base";
import RadioDireccionCliente from "~/app/_components/form/radio-direccion-cliente";

export type TipoEntidadForm = "cliente" | "proveedor";

export interface FormSeccionClienteProps {
  form: FormInstance;
  /** Tipo de entidad: cliente o proveedor */
  tipoEntidad?: TipoEntidadForm;
  /** Mostrar campos de teléfono y email */
  showContacto?: boolean;
  /** Mostrar solo teléfono (sin email) */
  showSoloTelefono?: boolean;
  /** Mostrar campo "Recomendado por" */
  showRecomendadoPor?: boolean;
  /** Campos de teléfono y email son editables (por defecto son readonly) */
  contactoEditable?: boolean;
  /** Color del ícono del select (por defecto rose-700) */
  iconColor?: string;
  /** Clase CSS para el contenedor principal */
  className?: string;
  /** El campo cliente/proveedor es requerido */
  required?: boolean;
  /** Nombres de campos personalizados */
  fieldNames?: {
    entidadId?: string;
    entidadNombre?: string;
    rucDni?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    recomendadoPorId?: string;
  };
}

export default function FormSeccionCliente({
  form,
  tipoEntidad = "cliente",
  showContacto = true,
  showSoloTelefono = false,
  showRecomendadoPor = false,
  contactoEditable = false,
  iconColor = "text-rose-700",
  className = "",
  required = false,
  fieldNames = {},
}: FormSeccionClienteProps) {
  const esCliente = tipoEntidad === "cliente";

  // Nombres de campos con valores por defecto
  const entidadIdField = fieldNames.entidadId || (esCliente ? "cliente_id" : "proveedor_id");
  const entidadNombreField = fieldNames.entidadNombre || (esCliente ? "cliente_nombre" : "proveedor_nombre");
  const rucDniField = fieldNames.rucDni || "ruc_dni";
  const direccionField = fieldNames.direccion || "direccion";
  const telefonoField = fieldNames.telefono || "telefono";
  const emailField = fieldNames.email || "email";
  const recomendadoPorIdField = fieldNames.recomendadoPorId || "recomendado_por_id";

  // Inicializar D1 al montar el componente (solo para clientes)
  useEffect(() => {
    if (esCliente && !form.getFieldValue("direccion_seleccionada")) {
      form.setFieldValue("direccion_seleccionada", "D1");
    }
  }, [form, esCliente]);

  // Handler cuando se selecciona un cliente
  const handleClienteChange = (_: unknown, cliente: any) => {
    if (cliente) {
      // Actualizar DNI/RUC
      if (cliente.numero_documento) {
        form.setFieldValue(rucDniField, cliente.numero_documento);
      }

      // Actualizar nombre del cliente
      const nombreCompleto = cliente.razon_social
        ? cliente.razon_social
        : `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim();
      form.setFieldValue(entidadNombreField, nombreCompleto);

      // Actualizar direcciones ocultas
      form.setFieldValue("_cliente_direccion_1", cliente.direccion || "");
      form.setFieldValue("_cliente_direccion_2", cliente.direccion_2 || "");
      form.setFieldValue("_cliente_direccion_3", cliente.direccion_3 || "");
      form.setFieldValue("_cliente_direccion_4", cliente.direccion_4 || "");

      // Actualizar dirección visible según selección
      const direccionSeleccionada = form.getFieldValue("direccion_seleccionada") || "D1";
      let direccionActual = cliente.direccion || "";
      if (direccionSeleccionada === "D2") direccionActual = cliente.direccion_2 || "";
      if (direccionSeleccionada === "D3") direccionActual = cliente.direccion_3 || "";
      if (direccionSeleccionada === "D4") direccionActual = cliente.direccion_4 || "";
      form.setFieldValue(direccionField, direccionActual);

      // Actualizar teléfono y email
      form.setFieldValue(telefonoField, cliente.telefono || "");
      form.setFieldValue(emailField, cliente.email || "");
    } else {
      // Limpiar campos
      form.setFieldValue(rucDniField, "");
      form.setFieldValue(entidadNombreField, "");
      form.setFieldValue(direccionField, "");
      form.setFieldValue(telefonoField, "");
      form.setFieldValue(emailField, "");
      form.setFieldValue("_cliente_direccion_1", "");
      form.setFieldValue("_cliente_direccion_2", "");
      form.setFieldValue("_cliente_direccion_3", "");
      form.setFieldValue("_cliente_direccion_4", "");
    }
  };

  // Handler cuando se selecciona un proveedor
  const handleProveedorChange = (_: unknown, proveedor: any) => {
    if (proveedor) {
      form.setFieldValue(rucDniField, proveedor.ruc || "");
      form.setFieldValue(entidadNombreField, proveedor.razon_social || "");
      form.setFieldValue(telefonoField, proveedor.telefono || "");
      form.setFieldValue(direccionField, proveedor.direccion || "");
      form.setFieldValue(emailField, proveedor.email || "");
    } else {
      form.setFieldValue(rucDniField, "");
      form.setFieldValue(entidadNombreField, "");
      form.setFieldValue(telefonoField, "");
      form.setFieldValue(direccionField, "");
      form.setFieldValue(emailField, "");
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Campos ocultos para direcciones (solo para clientes) */}
      {esCliente && (
        <>
          <Form.Item name="direccion_seleccionada" hidden initialValue="D1">
            <input type="hidden" />
          </Form.Item>
          <Form.Item name="_cliente_direccion_1" hidden initialValue="">
            <input type="hidden" />
          </Form.Item>
          <Form.Item name="_cliente_direccion_2" hidden initialValue="">
            <input type="hidden" />
          </Form.Item>
          <Form.Item name="_cliente_direccion_3" hidden initialValue="">
            <input type="hidden" />
          </Form.Item>
          <Form.Item name="_cliente_direccion_4" hidden initialValue="">
            <input type="hidden" />
          </Form.Item>
        </>
      )}

      {/* Fila: DNI/RUC, Cliente/Proveedor, Dirección, Radio */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6 items-start">
        <LabelBase
          label={esCliente ? "DNI/RUC:" : "RUC:"}
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto"
        >
          {esCliente ? (
            <SelectClientes
              form={form}
              showOnlyDocument={true}
              propsForm={{
                name: entidadIdField,
                hasFeedback: false,
                className: "w-full sm:!min-w-[150px] sm:!w-[150px] sm:!max-w-[150px]",
                rules: required ? [{ required: true, message: "Selecciona un cliente" }] : undefined,
              }}
              className="w-full"
              classNameIcon={`${iconColor} mx-1`}
              placeholder="DNI/RUC"
              onChange={handleClienteChange}
            />
          ) : (
            <SelectProveedores
              form={form}
              showOnlyDocument={true}
              propsForm={{
                name: entidadIdField,
                hasFeedback: false,
                className: "w-full sm:!min-w-[150px] sm:!w-[150px] sm:!max-w-[150px]",
                rules: required ? [{ required: true, message: "Selecciona un proveedor" }] : undefined,
              }}
              classNameIcon={`${iconColor} mx-1`}
              placeholder="RUC"
              onChange={handleProveedorChange}
            />
          )}
        </LabelBase>

        <LabelBase
          label={esCliente ? "Cliente:" : "Proveedor:"}
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:flex-1"
        >
          <InputBase
            propsForm={{
              name: entidadNombreField,
              hasFeedback: false,
              className: "w-full",
            }}
            placeholder={esCliente ? "Nombre del cliente" : "Razón social del proveedor"}
            className="w-full"
            readOnly
            uppercase={false}
          />
        </LabelBase>

        <LabelBase
          label="Dirección:"
          classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
          className="w-full sm:w-auto sm:flex-1"
        >
          <InputBase
            prefix={<BsGeoAltFill className="text-cyan-600 mx-1" />}
            propsForm={{
              name: direccionField,
            }}
            placeholder="Dirección"
            className="w-full"
          />
        </LabelBase>

        {/* Radio de direcciones solo para clientes */}
        {esCliente && (
          <div className="mb-3 sm:mb-4 lg:mb-6 flex items-end h-[40px]">
            <RadioDireccionCliente form={form} />
          </div>
        )}
      </div>

      {/* Fila: Teléfono, Email, Recomendado por (opcional) */}
      {showContacto && (
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6">
          <LabelBase
            label="Teléfono:"
            classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
            className="w-full sm:w-auto"
          >
            <InputBase
              propsForm={{
                name: telefonoField,
                hasFeedback: false,
                className: "w-full sm:!min-w-[150px] sm:!w-[150px] sm:!max-w-[150px]",
              }}
              placeholder="Teléfono"
              className="w-full"
              readOnly={!contactoEditable}
              uppercase={false}
            />
          </LabelBase>

          {!showSoloTelefono && (
            <LabelBase
              label="Email:"
              classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
              className="w-full sm:w-auto"
            >
              <InputBase
                propsForm={{
                  name: emailField,
                  hasFeedback: false,
                  className: "w-full sm:!min-w-[250px] sm:!w-[250px] sm:!max-w-[250px]",
                }}
                placeholder="Email"
                className="w-full"
                readOnly={!contactoEditable}
                uppercase={false}
              />
            </LabelBase>
          )}

          {showRecomendadoPor && esCliente && (
            <LabelBase
              label="Recomendado por:"
              classNames={{ labelParent: "mb-3 sm:mb-4 lg:mb-6" }}
              className="w-full sm:w-auto"
            >
              <SelectClientes
                propsForm={{
                  name: recomendadoPorIdField,
                  hasFeedback: false,
                  className: "w-full sm:!min-w-[200px] sm:!w-[200px] sm:!max-w-[200px]",
                }}
                className="w-full"
                classNameIcon="text-cyan-600 mx-1"
              />
            </LabelBase>
          )}
        </div>
      )}
    </div>
  );
}
