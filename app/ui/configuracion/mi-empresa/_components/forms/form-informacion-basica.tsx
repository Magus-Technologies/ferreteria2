"use client";

import { Form, App, Button } from "antd";
import { useEffect, useState, useMemo } from "react";
import { FaIdCard, FaBuilding, FaPhone, FaMapMarkerAlt, FaEnvelope } from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LabelBase from "~/components/form/label-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import SelectBase from "~/app/_components/form/selects/select-base";
import SelectUbigeo from "../select-ubigeo";
import { empresaApi, UpdateEmpresaRequest } from "~/lib/api/empresa";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { consultaReniec } from "~/app/_actions/consulta-reniec";
import { ConsultaRuc } from "~/app/_types/consulta-ruc";

interface FormInformacionBasicaProps {
  empresaId: number;
}

export default function FormInformacionBasica({ empresaId }: FormInformacionBasicaProps) {
  const [form] = Form.useForm<UpdateEmpresaRequest>();
  const queryClient = useQueryClient();
  const [consultando, setConsultando] = useState(false);
  const { message } = App.useApp();

  // Observar cambios en los campos de ubigeo para actualizar SelectUbigeo
  const departamentoValue = Form.useWatch('departamento', form);
  const provinciaValue = Form.useWatch('provincia', form);
  const distritoValue = Form.useWatch('distrito', form);

  // Memoizar el objeto value para SelectUbigeo
  const ubigeoValue = useMemo(() => ({
    departamento: departamentoValue,
    provincia: provinciaValue,
    distrito: distritoValue,
  }), [departamentoValue, provinciaValue, distritoValue]);

  // Query para obtener datos de la empresa
  const { data: empresaData, isLoading } = useQuery({
    queryKey: [QueryKeys.EMPRESAS, empresaId],
    queryFn: () => empresaApi.getById(empresaId),
    enabled: !!empresaId,
  });

  // Mutación para actualizar
  const updateMutation = useMutation({
    mutationFn: (data: UpdateEmpresaRequest) => empresaApi.update(empresaId, data),
    onSuccess: (response) => {
      if (response.data?.data) {
        const mensaje = response.data?.message || "Empresa actualizada exitosamente";
        message.success(mensaje);
        queryClient.invalidateQueries({ queryKey: [QueryKeys.EMPRESAS] });
      } else if (response.error) {
        message.error(response.error.message);
      }
    },
    onError: (error) => {
      console.error('❌ Error en mutation:', error);
      message.error("Error al actualizar empresa");
    },
  });

  // Cargar datos al montar
  useEffect(() => {
    if (empresaData?.data?.data) {
      const empresa = empresaData.data.data;
      form.setFieldsValue({
        tipo_identificacion: empresa.tipo_identificacion || "RUC",
        ruc: empresa.ruc,
        razon_social: empresa.razon_social,
        nombre_comercial: empresa.nombre_comercial || undefined,
        celular: empresa.celular || undefined,
        telefono: empresa.telefono,
        direccion: empresa.direccion,
        email: empresa.email,
        regimen: empresa.regimen || undefined,
        actividad_economica: empresa.actividad_economica || undefined,
        // Ubigeo
        departamento: empresa.departamento || undefined,
        provincia: empresa.provincia || undefined,
        distrito: empresa.distrito || undefined,
      });
    }
  }, [empresaData, form]);

  const handleRucChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const ruc = e.target.value.trim();

    // Si el RUC tiene 11 dígitos, consultar automáticamente
    if (ruc.length === 11 && /^\d{11}$/.test(ruc)) {
      try {
        setConsultando(true);
        const response = await consultaReniec({ search: ruc });

        if (response.data) {
          const data = response.data as ConsultaRuc;

          // Completar los campos automáticamente
          form.setFieldsValue({
            razon_social: data.razonSocial || '',
            nombre_comercial: data.nombreComercial || undefined,
            direccion: data.direccion || '',
            telefono: data.telefonos?.[0] || '',
            departamento: data.departamento || undefined,
            provincia: data.provincia || undefined,
            distrito: data.distrito || undefined,
          });

        }
      } catch (error) {
        console.error('Error consultando RUC:', error);
      } finally {
        setConsultando(false);
      }
    }
  };

  const handleSubmit = async (values: any) => {
    updateMutation.mutate(values);
  };

  const loading = updateMutation.isPending || isLoading || consultando;

  return (
    <Form
      form={form}
      onFinish={handleSubmit}
      layout="vertical"
      autoComplete="off"
      className="space-y-4"
    >
      {/* Fila 1: Tipo Identificación, Identificación, Nombre Legal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <LabelBase label="Tipo Identificación:" orientation="column">
            <SelectBase
              propsForm={{ name: "tipo_identificacion" }}
              disabled={true}
              options={[
                { value: "RUC", label: "RUC" },
              ]}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Identificación:" orientation="column">
            <InputBase
              propsForm={{
                name: "ruc",
                rules: [{ required: true, message: "Ingresa el RUC" }],
              }}
              placeholder="20611539160"
              prefix={<FaIdCard size={14} className="text-blue-600 mx-1" />}
              onChange={handleRucChange}
              maxLength={11}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Nombre Legal:" orientation="column">
            <InputBase
              propsForm={{
                name: "razon_social",
                rules: [{ required: true, message: "Ingresa la razón social" }],
              }}
              placeholder="Hemerson Velasquez Castro"
              prefix={<FaBuilding size={14} className="text-blue-600 mx-1" />}
            />
          </LabelBase>
        </div>
      </div>

      {/* Fila 2: Nombre Comercial, Celular, Teléfono */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <LabelBase label="Nombre Comercial:" orientation="column">
            <InputBase
              propsForm={{ name: "nombre_comercial" }}
              placeholder="Hemerson Velasquez Castro"
              prefix={<FaBuilding size={14} className="text-blue-600 mx-1" />}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Celular:" orientation="column">
            <InputBase
              propsForm={{ name: "celular" }}
              placeholder="963816202"
              prefix={<FaPhone size={14} className="text-blue-600 mx-1" />}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Teléfono:" orientation="column">
            <InputBase
              propsForm={{
                name: "telefono",
                rules: [{ required: true, message: "Ingresa el teléfono" }],
              }}
              placeholder="963816202"
              prefix={<FaPhone size={14} className="text-blue-600 mx-1" />}
            />
          </LabelBase>
        </div>
      </div>

      {/* Fila 3: Dirección 1 (2 cols) + Departamento/Provincia/Distrito (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LabelBase label="Dirección 1:" orientation="column">
            <InputBase
              propsForm={{
                name: "direccion",
                rules: [{ required: true, message: "Ingresa la dirección" }],
              }}
              placeholder="Alto Trujillo Barrio 5 - Pr Ascencio Vergara"
              prefix={<FaMapMarkerAlt size={14} className="text-blue-600 mx-1" />}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Departamento / Provincia / Distrito:" orientation="column">
            <SelectUbigeo
              value={ubigeoValue}
              onChange={(value) => {
                form.setFieldsValue({
                  departamento: value.departamento,
                  provincia: value.provincia,
                  distrito: value.distrito,
                  ubigeo_id: value.ubigeo_id,
                });
              }}
            />
          </LabelBase>
        </div>
      </div>

      {/* Campos ocultos para guardar los valores individuales */}
      <Form.Item name="departamento" hidden>
        <InputBase />
      </Form.Item>
      <Form.Item name="provincia" hidden>
        <InputBase />
      </Form.Item>
      <Form.Item name="distrito" hidden>
        <InputBase />
      </Form.Item>
      <Form.Item name="ubigeo_id" hidden>
        <InputBase />
      </Form.Item>

      {/* Fila 4: Correo, Régimen, Actividad Económica */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <LabelBase label="Correo Electrónico:" orientation="column">
            <InputBase
              propsForm={{
                name: "email",
                rules: [
                  { required: true, message: "Ingresa el email" },
                  { type: "email", message: "Email inválido" },
                ],
              }}
              placeholder="hemersonyvc@gmail.com"
              prefix={<FaEnvelope size={14} className="text-blue-600 mx-1" />}
              uppercase={false}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Régimen:" orientation="column">
            <SelectBase
              propsForm={{ name: "regimen" }}
              placeholder="Régimen MYPE Tributario"
              options={[
                { value: "MYPE", label: "Régimen MYPE Tributario" },
                { value: "GENERAL", label: "Régimen General" },
                { value: "ESPECIAL", label: "Régimen Especial" },
                { value: "RUS", label: "Régimen Único Simplificado" },
              ]}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Actividad Económica:" orientation="column">
            <SelectBase
              propsForm={{ name: "actividad_economica" }}
              placeholder="Servicios Profesionales"
              options={[
                { value: "SERVICIOS", label: "Servicios Profesionales" },
                { value: "COMERCIO", label: "Comercio" },
                { value: "INDUSTRIA", label: "Industria" },
                { value: "CONSTRUCCION", label: "Construcción" },
                { value: "AGRICULTURA", label: "Agricultura" },
                { value: "MINERIA", label: "Minería" },
                { value: "TRANSPORTE", label: "Transporte" },
                { value: "OTROS", label: "Otros" },
              ]}
            />
          </LabelBase>
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-start pt-4">
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-600 px-8"
        >
          Guardar
        </Button>
      </div>
    </Form>
  );
}
