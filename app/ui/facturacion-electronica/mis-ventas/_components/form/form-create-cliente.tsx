import { FaAddressCard } from "react-icons/fa";
import InputConsultaRuc from "~/app/_components/form/inputs/input-consulta-ruc";
import { ConsultaDni, ConsultaRuc } from "~/app/_types/consulta-ruc";
import LabelBase from "~/components/form/label-base";
import { MdEmail, MdFactory } from "react-icons/md";
import { FormInstance, Tabs, DatePicker } from "antd/lib";
import InputBase from "~/app/_components/form/inputs/input-base";
import { BsGeoAltFill } from "react-icons/bs";
import { FaMobileButton } from "react-icons/fa6";
import { MdCake } from "react-icons/md";
import type { Cliente } from "~/lib/api/cliente";
import SelectTipoCliente from "~/app/_components/form/selects/select-tipo-cliente";
import { Form } from "antd";
import { useEffect, useState } from "react";
import { TipoCliente, clienteApi } from "~/lib/api/cliente";
import dynamic from 'next/dynamic';

// Importar el mapa dinámicamente para evitar problemas de SSR
const MapaDireccionMapbox = dynamic(
  () => import('~/app/ui/facturacion-electronica/mis-ventas/_components/maps/mapa-direccion-mapbox'),
  { ssr: false }
);

interface Coordenadas {
  lat: number;
  lng: number;
}

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
  const [tabActiva, setTabActiva] = useState<string>('1');

  // Coordenadas derivadas de los valores del formulario — así el mapa recibe
  // las coordenadas guardadas al primer render sin flicker Lima → dirección → GPS.
  const lat1 = Form.useWatch('latitud_d1', form);
  const lng1 = Form.useWatch('longitud_d1', form);
  const lat2 = Form.useWatch('latitud_d2', form);
  const lng2 = Form.useWatch('longitud_d2', form);
  const lat3 = Form.useWatch('latitud_d3', form);
  const lng3 = Form.useWatch('longitud_d3', form);
  const lat4 = Form.useWatch('latitud_d4', form);
  const lng4 = Form.useWatch('longitud_d4', form);

  const coordenadasD1: Coordenadas | null =
    lat1 != null && lng1 != null ? { lat: Number(lat1), lng: Number(lng1) } : null;
  const coordenadasD2: Coordenadas | null =
    lat2 != null && lng2 != null ? { lat: Number(lat2), lng: Number(lng2) } : null;
  const coordenadasD3: Coordenadas | null =
    lat3 != null && lng3 != null ? { lat: Number(lat3), lng: Number(lng3) } : null;
  const coordenadasD4: Coordenadas | null =
    lat4 != null && lng4 != null ? { lat: Number(lat4), lng: Number(lng4) } : null;

  const [direccionMapaD1, setDireccionMapaD1] = useState<string>('');
  const [direccionMapaD2, setDireccionMapaD2] = useState<string>('');
  const [direccionMapaD3, setDireccionMapaD3] = useState<string>('');
  const [direccionMapaD4, setDireccionMapaD4] = useState<string>('');

  const getDireccionMapa = () => {
    switch (tabActiva) {
      case '1': return direccionMapaD1;
      case '2': return direccionMapaD2;
      case '3': return direccionMapaD3;
      case '4': return direccionMapaD4;
      default: return '';
    }
  };

  useEffect(() => {
    if (numero_documento?.length === 8) {
      form.setFieldValue("tipo_cliente", TipoCliente.PERSONA);
    } else if (numero_documento?.length === 11) {
      form.setFieldValue("tipo_cliente", TipoCliente.EMPRESA);
    }
  }, [numero_documento, form]);

  const handleCoordenadaChange = (coords: Coordenadas, direccionObtenida: string | undefined) => {
    // Actualizar coordenadas según la tab activa — las coordenadas se derivan del form
    // vía Form.useWatch, por lo que solo escribimos al form (no hay setState local).
    switch (tabActiva) {
      case '1':
        form.setFieldValue('latitud_d1', coords.lat);
        form.setFieldValue('longitud_d1', coords.lng);
        if (direccionObtenida) setDireccionMapaD1(direccionObtenida);
        break;
      case '2':
        form.setFieldValue('latitud_d2', coords.lat);
        form.setFieldValue('longitud_d2', coords.lng);
        if (direccionObtenida) setDireccionMapaD2(direccionObtenida);
        break;
      case '3':
        form.setFieldValue('latitud_d3', coords.lat);
        form.setFieldValue('longitud_d3', coords.lng);
        if (direccionObtenida) setDireccionMapaD3(direccionObtenida);
        break;
      case '4':
        form.setFieldValue('latitud_d4', coords.lat);
        form.setFieldValue('longitud_d4', coords.lng);
        if (direccionObtenida) setDireccionMapaD4(direccionObtenida);
        break;
    }
  };

  const getDireccionActual = () => {
    switch (tabActiva) {
      case '1': return form.getFieldValue('direccion') || '';
      case '2': return form.getFieldValue('direccion_2') || '';
      case '3': return form.getFieldValue('direccion_3') || '';
      case '4': return form.getFieldValue('direccion_4') || '';
      default: return '';
    }
  };

  const getCoordenadasActuales = () => {
    switch (tabActiva) {
      case '1': return coordenadasD1;
      case '2': return coordenadasD2;
      case '3': return coordenadasD3;
      case '4': return coordenadasD4;
      default: return null;
    }
  };

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
                  "direccion",
                  "direccion_2",
                  "direccion_3",
                  "direccion_4",
                  "telefono",
                  "email",
                  "fecha_nacimiento",
                ]);

                if (dniData) {
                  form.setFieldValue("nombres", dniData.nombres);
                  form.setFieldValue(
                    "apellidos",
                    `${dniData.apellidoPaterno} ${dniData.apellidoMaterno}`,
                  );
                } else if (rucData) {
                  form.setFieldValue("razon_social", rucData.razonSocial);
                  form.setFieldValue("direccion", rucData.direccion);
                  form.setFieldValue("telefono", rucData.telefonos[0]);
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

        {/* COLUMNA DERECHA: Direcciones con tabs + Mapa */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">
            Direcciones (Haz clic en el mapa para marcar ubicación GPS)
          </p>

          {/* Tabs de direcciones */}
          <Tabs
            activeKey={tabActiva}
            onChange={setTabActiva}
            size="small"
            items={[
              {
                key: '1',
                label: (
                  <span className="text-xs">
                    Dirección 1 (Principal) {coordenadasD1 && '📍'}
                  </span>
                ),
                children: (
                  <div className="space-y-1 [&_.ant-form-item]:!mb-1">
                    <LabelBase label="Dirección 1:" orientation="column" classNames={{ labelParent: "!mb-0" }}>
                      <InputBase
                        prefix={<BsGeoAltFill className="text-cyan-600 mx-1" />}
                        propsForm={{ name: "direccion" }}
                        placeholder="Dirección 1"
                        autoComplete="new-password"
                      />
                    </LabelBase>
                    {direccionMapaD1 && (
                      <p className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded truncate" title={direccionMapaD1}>
                        Ubicación GPS: {direccionMapaD1}
                      </p>
                    )}
                    <LabelBase label="Referencia:" orientation="column" classNames={{ labelParent: "!mb-0" }}>
                      <InputBase
                        propsForm={{ name: "referencia_d1" }}
                        placeholder="Escribe una referencia"
                        autoComplete="new-password"
                      />
                    </LabelBase>
                  </div>
                ),
              },
              {
                key: '2',
                label: (
                  <span className="text-xs">
                    Dirección 2 {coordenadasD2 && '📍'}
                  </span>
                ),
                children: (
                  <div className="space-y-1 [&_.ant-form-item]:!mb-1">
                    <LabelBase label="Dirección 2:" orientation="column" classNames={{ labelParent: "!mb-0" }}>
                      <InputBase
                        prefix={<BsGeoAltFill className="text-cyan-600 mx-1" />}
                        propsForm={{ name: "direccion_2" }}
                        placeholder="Dirección 2 (opcional)"
                        autoComplete="new-password"
                      />
                    </LabelBase>
                    {direccionMapaD2 && (
                      <p className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded truncate" title={direccionMapaD2}>
                        Ubicación GPS: {direccionMapaD2}
                      </p>
                    )}
                    <LabelBase label="Referencia:" orientation="column" classNames={{ labelParent: "!mb-0" }}>
                      <InputBase
                        propsForm={{ name: "referencia_d2" }}
                        placeholder="Escribe una referencia"
                        autoComplete="new-password"
                      />
                    </LabelBase>
                  </div>
                ),
              },
              {
                key: '3',
                label: (
                  <span className="text-xs">
                    Dirección 3 {coordenadasD3 && '📍'}
                  </span>
                ),
                children: (
                  <div className="space-y-1 [&_.ant-form-item]:!mb-1">
                    <LabelBase label="Dirección 3:" orientation="column" classNames={{ labelParent: "!mb-0" }}>
                      <InputBase
                        prefix={<BsGeoAltFill className="text-cyan-600 mx-1" />}
                        propsForm={{ name: "direccion_3" }}
                        placeholder="Dirección 3 (opcional)"
                        autoComplete="new-password"
                      />
                    </LabelBase>
                    {direccionMapaD3 && (
                      <p className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded truncate" title={direccionMapaD3}>
                        Ubicación GPS: {direccionMapaD3}
                      </p>
                    )}
                    <LabelBase label="Referencia:" orientation="column" classNames={{ labelParent: "!mb-0" }}>
                      <InputBase
                        propsForm={{ name: "referencia_d3" }}
                        placeholder="Escribe una referencia"
                        autoComplete="new-password"
                      />
                    </LabelBase>
                  </div>
                ),
              },
              {
                key: '4',
                label: (
                  <span className="text-xs">
                    Dirección 4 {coordenadasD4 && '📍'}
                  </span>
                ),
                children: (
                  <div className="space-y-1 [&_.ant-form-item]:!mb-1">
                    <LabelBase label="Dirección 4:" orientation="column" classNames={{ labelParent: "!mb-0" }}>
                      <InputBase
                        prefix={<BsGeoAltFill className="text-cyan-600 mx-1" />}
                        propsForm={{ name: "direccion_4" }}
                        placeholder="Dirección 4 (opcional)"
                        autoComplete="new-password"
                      />
                    </LabelBase>
                    {direccionMapaD4 && (
                      <p className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded truncate" title={direccionMapaD4}>
                        Ubicación GPS: {direccionMapaD4}
                      </p>
                    )}
                    <LabelBase label="Referencia:" orientation="column" classNames={{ labelParent: "!mb-0" }}>
                      <InputBase
                        propsForm={{ name: "referencia_d4" }}
                        placeholder="Escribe una referencia"
                        autoComplete="new-password"
                      />
                    </LabelBase>
                  </div>
                ),
              },
            ]}
          />

          {/* Mapa debajo de los tabs — se monta solo cuando las direcciones están listas
              para que el mapa reciba las coordenadas guardadas al primer render (sin flicker). */}
          <div className="h-[280px] border-2 border-gray-300 rounded-lg overflow-hidden">
            {direccionesListas ? (
              <MapaDireccionMapbox
                key={tabActiva} // Forzar re-render cuando cambia la tab
                direccion={getDireccionActual()}
                onCoordenadaChange={(coords, dir) => handleCoordenadaChange(coords, dir)}
                coordenadasIniciales={getCoordenadasActuales()}
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
        </div>
      </div>

      {/* Campos ocultos para las coordenadas */}
      <Form.Item name="latitud_d1" hidden><InputBase /></Form.Item>
      <Form.Item name="longitud_d1" hidden><InputBase /></Form.Item>
      <Form.Item name="latitud_d2" hidden><InputBase /></Form.Item>
      <Form.Item name="longitud_d2" hidden><InputBase /></Form.Item>
      <Form.Item name="latitud_d3" hidden><InputBase /></Form.Item>
      <Form.Item name="longitud_d3" hidden><InputBase /></Form.Item>
      <Form.Item name="latitud_d4" hidden><InputBase /></Form.Item>
      <Form.Item name="longitud_d4" hidden><InputBase /></Form.Item>
    </>
  );
}
