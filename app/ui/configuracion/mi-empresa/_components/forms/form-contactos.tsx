"use client";

import { Form, App, Button, Checkbox } from "antd";
import { useEffect, useState } from "react";
import { FaUser, FaEnvelope, FaPhone } from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LabelBase from "~/components/form/label-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import { empresaApi, type UpdateEmpresaRequest, type ContactoEmpresa } from "~/lib/api/empresa";
import { QueryKeys } from "~/app/_lib/queryKeys";

interface FormContactosProps {
  empresaId: number;
}

function getContacto(contactos: ContactoEmpresa[] | undefined, cargo: string): ContactoEmpresa {
  return contactos?.find((c) => c.cargo === cargo) || { cargo: cargo as ContactoEmpresa['cargo'] };
}

export default function FormContactos({ empresaId }: FormContactosProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [copiarDatos, setCopiarDatos] = useState(false);
  const { message } = App.useApp();

  const { data: empresaData, isLoading } = useQuery({
    queryKey: [QueryKeys.EMPRESAS, empresaId],
    queryFn: () => empresaApi.getById(empresaId),
    enabled: !!empresaId,
  });

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

  useEffect(() => {
    if (empresaData?.data?.data) {
      const contactos = empresaData.data.data.contactos || [];
      const gerente = getContacto(contactos, 'gerente');
      const facturacion = getContacto(contactos, 'facturacion');
      const contabilidad = getContacto(contactos, 'contabilidad');

      form.setFieldsValue({
        gerente_nombre: gerente.nombre || undefined,
        gerente_email: gerente.email || undefined,
        gerente_celular: gerente.celular || undefined,
        facturacion_nombre: facturacion.nombre || undefined,
        facturacion_email: facturacion.email || undefined,
        facturacion_celular: facturacion.celular || undefined,
        contabilidad_nombre: contabilidad.nombre || undefined,
        contabilidad_email: contabilidad.email || undefined,
        contabilidad_celular: contabilidad.celular || undefined,
      });
    }
  }, [empresaData, form]);

  const handleCopiarDatos = (checked: boolean) => {
    setCopiarDatos(checked);
    if (checked) {
      form.setFieldsValue({
        facturacion_nombre: form.getFieldValue('gerente_nombre'),
        facturacion_email: form.getFieldValue('gerente_email'),
        facturacion_celular: form.getFieldValue('gerente_celular'),
      });
    }
  };

  const handleSubmit = async (values: Record<string, any>) => {
    const contactos: ContactoEmpresa[] = [
      { cargo: 'gerente', nombre: values.gerente_nombre, email: values.gerente_email, celular: values.gerente_celular },
      { cargo: 'facturacion', nombre: values.facturacion_nombre, email: values.facturacion_email, celular: values.facturacion_celular },
      { cargo: 'contabilidad', nombre: values.contabilidad_nombre, email: values.contabilidad_email, celular: values.contabilidad_celular },
    ];
    updateMutation.mutate({ contactos });
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
          <Checkbox checked={copiarDatos} onChange={(e) => handleCopiarDatos(e.target.checked)}>
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
