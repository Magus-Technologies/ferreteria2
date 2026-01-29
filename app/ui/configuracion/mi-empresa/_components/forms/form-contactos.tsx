"use client";

import { Form, App, Button, Checkbox } from "antd";
import { useEffect, useState } from "react";
import { FaUser, FaEnvelope, FaPhone } from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LabelBase from "~/components/form/label-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import { empresaApi, UpdateEmpresaRequest } from "~/lib/api/empresa";
import { QueryKeys } from "~/app/_lib/queryKeys";

interface FormContactosProps {
  empresaId: number;
}

export default function FormContactos({ empresaId }: FormContactosProps) {
  const [form] = Form.useForm<UpdateEmpresaRequest>();
  const queryClient = useQueryClient();
  const [copiarDatos, setCopiarDatos] = useState(false);
  const { message } = App.useApp();

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
        message.success(response.data?.message || "Contactos actualizados exitosamente");
        queryClient.invalidateQueries({ queryKey: [QueryKeys.EMPRESAS] });
      } else if (response.error) {
        message.error(response.error.message);
      }
    },
    onError: () => {
      message.error("Error al actualizar contactos");
    },
  });

  // Cargar datos al montar
  useEffect(() => {
    if (empresaData?.data?.data) {
      const empresa = empresaData.data.data;
      form.setFieldsValue({
        gerente_nombre: empresa.gerente_nombre || undefined,
        gerente_email: empresa.gerente_email || undefined,
        gerente_celular: empresa.gerente_celular || undefined,
        facturacion_nombre: empresa.facturacion_nombre || undefined,
        facturacion_email: empresa.facturacion_email || undefined,
        facturacion_celular: empresa.facturacion_celular || undefined,
        contabilidad_nombre: empresa.contabilidad_nombre || undefined,
        contabilidad_email: empresa.contabilidad_email || undefined,
        contabilidad_celular: empresa.contabilidad_celular || undefined,
      });
    }
  }, [empresaData, form]);

  // Manejar el checkbox de copiar datos
  const handleCopiarDatos = (checked: boolean) => {
    setCopiarDatos(checked);
    if (checked) {
      const gerenteNombre = form.getFieldValue('gerente_nombre');
      const gerenteEmail = form.getFieldValue('gerente_email');
      const gerenteCelular = form.getFieldValue('gerente_celular');

      form.setFieldsValue({
        facturacion_nombre: gerenteNombre,
        facturacion_email: gerenteEmail,
        facturacion_celular: gerenteCelular,
      });
    }
  };

  const handleSubmit = async (values: any) => {
    updateMutation.mutate(values);
  };

  const loading = updateMutation.isPending || isLoading;

  return (
    <Form
      form={form}
      onFinish={handleSubmit}
      layout="vertical"
      autoComplete="off"
      className="space-y-6"
    >
      {/* Gerente o Administrador */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Gerente o Administrador</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <LabelBase label="Nombre Completo:" orientation="column">
              <InputBase
                propsForm={{ name: "gerente_nombre" }}
                placeholder="TEDDY SIPRA"
                prefix={<FaUser size={14} className="text-blue-600 mx-1" />}
              />
            </LabelBase>
          </div>

          <div>
            <LabelBase label="Email:" orientation="column">
              <InputBase
                propsForm={{ name: "gerente_email" }}
                placeholder="yorvin.velasquez@sauri.app"
                prefix={<FaEnvelope size={14} className="text-blue-600 mx-1" />}
                uppercase={false}
              />
            </LabelBase>
          </div>

          <div>
            <LabelBase label="Celular:" orientation="column">
              <InputBase
                propsForm={{ name: "gerente_celular" }}
                placeholder="999666555"
                prefix={<FaPhone size={14} className="text-blue-600 mx-1" />}
              />
            </LabelBase>
          </div>
        </div>

        <div className="mt-4">
          <Checkbox
            checked={copiarDatos}
            onChange={(e) => handleCopiarDatos(e.target.checked)}
          >
            Copiar datos al contacto facturación
          </Checkbox>
        </div>
      </div>

      {/* Facturación */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Facturación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <LabelBase label="Nombre Completo:" orientation="column">
              <InputBase
                propsForm={{ name: "facturacion_nombre" }}
                placeholder="TEDDY SIPRA"
                prefix={<FaUser size={14} className="text-blue-600 mx-1" />}
              />
            </LabelBase>
          </div>

          <div>
            <LabelBase label="Email:" orientation="column">
              <InputBase
                propsForm={{ name: "facturacion_email" }}
                placeholder="yorvin.velasquez@sauri.app"
                prefix={<FaEnvelope size={14} className="text-blue-600 mx-1" />}
                uppercase={false}
              />
            </LabelBase>
          </div>

          <div>
            <LabelBase label="Celular:" orientation="column">
              <InputBase
                propsForm={{ name: "facturacion_celular" }}
                placeholder="963816201"
                prefix={<FaPhone size={14} className="text-blue-600 mx-1" />}
              />
            </LabelBase>
          </div>
        </div>
      </div>

      {/* Contabilidad */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Contabilidad</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <LabelBase label="Nombre Completo:" orientation="column">
              <InputBase
                propsForm={{ name: "contabilidad_nombre" }}
                placeholder="KEVIN RODRIGUEZ"
                prefix={<FaUser size={14} className="text-blue-600 mx-1" />}
              />
            </LabelBase>
          </div>

          <div>
            <LabelBase label="Email:" orientation="column">
              <InputBase
                propsForm={{ name: "contabilidad_email" }}
                placeholder="kevin.rodriguez@sauri.app"
                prefix={<FaEnvelope size={14} className="text-blue-600 mx-1" />}
                uppercase={false}
              />
            </LabelBase>
          </div>

          <div>
            <LabelBase label="Celular:" orientation="column">
              <InputBase
                propsForm={{ name: "contabilidad_celular" }}
                placeholder="949553110"
                prefix={<FaPhone size={14} className="text-blue-600 mx-1" />}
              />
            </LabelBase>
          </div>
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
