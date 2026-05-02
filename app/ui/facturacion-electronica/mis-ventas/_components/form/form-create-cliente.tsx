import { FaAddressCard } from "react-icons/fa";
import InputConsultaRuc from "~/app/_components/form/inputs/input-consulta-ruc";
import { ConsultaDni, ConsultaRuc } from "~/app/_types/consulta-ruc";
import LabelBase from "~/components/form/label-base";
import { MdEmail, MdFactory } from "react-icons/md";
import { FormInstance, DatePicker } from "antd/lib";
import InputBase from "~/app/_components/form/inputs/input-base";
import { FaMobileButton } from "react-icons/fa6";
import type { Cliente } from "~/lib/api/cliente";
import SelectTipoCliente from "~/app/_components/form/selects/select-tipo-cliente";
import DireccionesTabsForm from "~/app/_components/form/direcciones-tabs-form";
import { Form } from "antd";
import { useEffect } from "react";
import { TipoCliente, TipoDireccion, clienteApi } from "~/lib/api/cliente";
import { useDireccionesClienteForm } from "~/hooks/use-direcciones-cliente-form";
import dynamic from 'next/dynamic';

// Importar el mapa dinámicamente para evitar problemas de SSR
const MapaDireccionMapbox = dynamic(
  () => import('~/app/ui/facturacion-electronica/mis-ventas/_components/maps/mapa-direccion-mapbox'),
  { ssr: false }
);

export default function FormCreateCliente({
  form,
  dataEdit,
  direccionesListas = true,
}: {
  form: FormInstance;
  dataEdit?: Cliente;
  direccionesListas?: boolean;
}) {
  const numero_documento = Form.useWatch("numero_documento", form);

  // Hook canónico — reemplaza los 8 useWatch + 4 useState + 4 switch que
  // antes manejaban las direcciones/coordenadas/labels-Mapbox por separado.
  const direccionesHook = useDireccionesClienteForm({ form, cliente: dataEdit });

  useEffect(() => {
    if (numero_documento?.length === 8) {
      form.setFieldValue("tipo_cliente", TipoCliente.PERSONA);
    } else if (numero_documento?.length === 11) {
      form.setFieldValue("tipo_cliente", TipoCliente.EMPRESA);
    }
  }, [numero_documento, form]);

  return (
    <>
      <SelectTipoCliente
        propsForm={{
          name: "tipo_cliente",
          className: "hidden",
        }}
      />
      
      {/* Layout: 2 columnas */}
      <div className="grid grid-cols-2 gap-6">
        {/* COLUMNA IZQUIERDA: Datos básicos */}
        <div className="space-y-1 [&_.ant-form-item]:!mb-1">
          <LabelBase label="Ruc / DNI:" orientation="column" classNames={{ labelParent: "!mb-0" }}>
            <InputConsultaRuc
              prefix={<FaAddressCard className="text-rose-700 mx-1" />}
              propsForm={{
                name: "numero_documento",
                validateTrigger: "onBlur",
                rules: [
                  {
                    required: true,
                    message: "Por favor, ingresa el RUC o DNI",
                  },
                  {
                    validator: (_, value) => {
                      if (!value || value.length === 8 || value.length === 11) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("El documento debe tener 8 o 11 caracteres"),
                      );
                    },
                  },
                  {
                    validator: async (_, value) => {
                      if (!value || (value.length !== 8 && value.length !== 11)) {
                        return Promise.resolve();
                      }

                      const response = await clienteApi.checkDocumento(
                        value,
                        dataEdit?.id,
                      );

                      if (response.data?.exists) {
                        return Promise.reject(
                          new Error("Este documento ya está registrado"),
                        );
                      }

                      return Promise.resolve();
                    },
                  },
                ],
              }}
              placeholder="Ruc / DNI"
              automatico={dataEdit ? false : true}
              onSuccess={(res) => {
                const dniData = (res as ConsultaDni)?.dni
                  ? (res as ConsultaDni)
                  : undefined;
                const rucData = (res as ConsultaRuc)?.ruc
                  ? (res as ConsultaRuc)
                  : undefined;
                form.resetFields([
                  "razon_social",
                  "nombres",
                  "apellidos",
                  "telefono",
                  "email",
                  "fecha_nacimiento",
                ]);
                // Limpiar todas las direcciones via hook (su `useEffect`
                // luego sincroniza los campos legacy del form).
                direccionesHook.tipos.forEach((tipo) =>
                  direccionesHook.actualizarDireccion(tipo, {
                    direccion: '',
                    referencia: null,
                    latitud: null,
                    longitud: null,
                  }),
                );

                if (dniData) {
                  form.setFieldValue("nombres", dniData.nombres);
                  form.setFieldValue(
                    "apellidos",
                    `${dniData.apellidoPaterno} ${dniData.apellidoMaterno}`,
                  );
                } else if (rucData) {
                  form.setFieldValue("razon_social", rucData.razonSocial);
                  form.setFieldValue("telefono", rucData.telefonos[0]);
                  // RUC trae solo dirección 1 — pasar via hook.
                  direccionesHook.actualizarDireccion(TipoDireccion.D1, {
                    direccion: rucData.direccion ?? '',
                  });
                }
              }}
              form={form}
              nameWatch="numero_documento"
            />
          </LabelBase>

          <LabelBase label="Razon Social:" orientation="column" classNames={{ labelParent: "!mb-0" }}>
            <InputBase
              prefix={<MdFactory className="text-rose-700 mx-1" />}
              propsForm={{
                name: "razon_social",
              }}
              placeholder="Razon Social"
            />
          </LabelBase>

          <LabelBase label="Nombres:" orientation="column" classNames={{ labelParent: "!mb-0" }}>
            <InputBase
              prefix={<MdFactory className="text-rose-700 mx-1" />}
              propsForm={{
                name: "nombres",
              }}
              placeholder="Nombres"
            />
          </LabelBase>

          <LabelBase label="Apellidos:" orientation="column" classNames={{ labelParent: "!mb-0" }}>
            <InputBase
              prefix={<MdFactory className="text-rose-700 mx-1" />}
              propsForm={{
                name: "apellidos",
              }}
              placeholder="Apellidos"
            />
          </LabelBase>

          <LabelBase label="Telefono:" orientation="column" classNames={{ labelParent: "!mb-0" }}>
            <InputBase
              prefix={<FaMobileButton className="text-cyan-600 mx-1" />}
              propsForm={{
                name: "telefono",
                hasFeedback: true,
                rules: [
                  {
                    pattern: /^\d{9}$/,
                    message: "El teléfono debe tener 9 dígitos",
                  },
                ],
              }}
              placeholder="Telefono"
              maxLength={9}
            />
          </LabelBase>

          <LabelBase label="Email:" orientation="column" classNames={{ labelParent: "!mb-0" }}>
            <InputBase
              prefix={<MdEmail className="text-cyan-600 mx-1" />}
              propsForm={{
                name: "email",
                hasFeedback: true,
                rules: [
                  {
                    type: "email",
                    message: "Ingresa un email válido",
                  },
                ],
              }}
              placeholder="Email"
              uppercase={false}
            />
          </LabelBase>

          <LabelBase label="Fecha de Nacimiento:" orientation="column" classNames={{ labelParent: "!mb-0" }}>
            <Form.Item
              name="fecha_nacimiento"
              noStyle
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="Selecciona fecha de nacimiento"
                format="DD/MM/YYYY"
                getPopupContainer={(trigger) => trigger.parentElement as HTMLElement}
              />
            </Form.Item>
          </LabelBase>
        </div>

        {/* COLUMNA DERECHA: Direcciones con tabs + Mapa — Tabs y campos
            generados dinámicamente por `<DireccionesTabsForm>` desde el
            array `hook.direcciones` (4 hoy, N en el futuro). */}
        <DireccionesTabsForm
          hook={direccionesHook}
          header="Direcciones (Haz clic en el mapa para marcar ubicación GPS)"
        >
          {(tipoActivo) => (
            <div className="h-[280px] border-2 border-gray-300 rounded-lg overflow-hidden">
              {direccionesListas ? (
                <MapaDireccionMapbox
                  key={tipoActivo}
                  direccion={direccionesHook.direccionActiva.direccion || ''}
                  onCoordenadaChange={(coords, dir) =>
                    direccionesHook.actualizarCoordenadas(tipoActivo, coords, dir)
                  }
                  coordenadasIniciales={direccionesHook.getCoordenadas(tipoActivo)}
                  editable={true}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-500 text-xs">Cargando ubicación guardada...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DireccionesTabsForm>
      </div>
    </>
  );
}
