"use client";

import { Form, App, Button } from "antd";
import { useEffect, useState } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LabelBase from "~/components/form/label-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import SelectUbigeo from "../select-ubigeo";
import { empresaApi, type UpdateEmpresaRequest, type DireccionEmpresa } from "~/lib/api/empresa";
import { QueryKeys } from "~/app/_lib/queryKeys";

interface FormDireccionesProps {
  empresaId: number;
}

export default function FormDirecciones({ empresaId }: FormDireccionesProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const [ubigeoValues, setUbigeoValues] = useState<Record<number, { departamento?: string; provincia?: string; distrito?: string; ubigeo_id?: number }>>({});

  const { data: empresaData, isLoading } = useQuery({
    queryKey: [QueryKeys.EMPRESAS, empresaId],
    queryFn: () => empresaApi.getById(empresaId),
    enabled: !!empresaId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateEmpresaRequest) => empresaApi.update(empresaId, data),
    onSuccess: (response) => {
      if (response.data?.data) {
        message.success(response.data?.message || "Direcciones actualizadas");
        queryClient.invalidateQueries({ queryKey: [QueryKeys.EMPRESAS] });
      } else if (response.error) {
        message.error(response.error.message);
      }
    },
    onError: () => {
      message.error("Error al actualizar direcciones");
    },
  });

  useEffect(() => {
    if (empresaData?.data?.data) {
      const dirs = (empresaData.data.data.direcciones || []).filter(d => !d.es_principal);
      const ubigeo: Record<number, any> = {};
      for (let i = 0; i < 3; i++) {
        const d = dirs[i];
        form.setFieldsValue({
          [`alias_${i}`]: d?.alias || undefined,
          [`direccion_${i}`]: d?.direccion || undefined,
        });
        if (d?.departamento || d?.provincia || d?.distrito || d?.ubigeo_id) {
          ubigeo[i] = {
            departamento: d.departamento || undefined,
            provincia: d.provincia || undefined,
            distrito: d.distrito || undefined,
            ubigeo_id: d.ubigeo_id || undefined,
          };
        }
      }
      setUbigeoValues(ubigeo);
    }
  }, [empresaData, form]);

  const handleUbigeoChange = (index: number, value: { departamento: string; provincia: string; distrito: string; ubigeo_id?: number }) => {
    setUbigeoValues((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmit = (values: Record<string, any>) => {
    const direcciones: DireccionEmpresa[] = [];
    for (let i = 0; i < 3; i++) {
      const dir = values[`direccion_${i}`];
      if (dir) {
        const ub = ubigeoValues[i];
        direcciones.push({
          alias: values[`alias_${i}`] || undefined,
          direccion: dir,
          ubigeo_id: ub?.ubigeo_id || undefined,
          departamento: ub?.departamento || undefined,
          provincia: ub?.provincia || undefined,
          distrito: ub?.distrito || undefined,
        });
      }
    }
    updateMutation.mutate({ direcciones });
  };

  const loading = updateMutation.isPending || isLoading;

  const direccionFields = [
    { index: 0, title: "Dirección 2", aliasPlaceholder: "Sucursal 1" },
    { index: 1, title: "Dirección 3", aliasPlaceholder: "Sucursal 2" },
    { index: 2, title: "Dirección 4", aliasPlaceholder: "Sucursal 3" },
  ];

  return (
    <Form
      form={form}
      onFinish={handleSubmit}
      layout="vertical"
      autoComplete="off"
      className="space-y-6"
    >
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <p className="text-sm text-blue-700">
          La dirección principal se gestiona en Información Básica. Aquí puedes agregar hasta 3 direcciones adicionales (sucursales, locales, etc.).
        </p>
      </div>

      {direccionFields.map(({ index, title, aliasPlaceholder }) => (
        <div key={index} className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">{title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <LabelBase label="Alias / Nombre:" orientation="column">
                <InputBase
                  propsForm={{ name: `alias_${index}` }}
                  placeholder={aliasPlaceholder}
                  prefix={<FaMapMarkerAlt size={14} className="text-blue-600 mx-1" />}
                />
              </LabelBase>
            </div>
            <div>
              <LabelBase label="Dirección:" orientation="column">
                <InputBase
                  propsForm={{ name: `direccion_${index}` }}
                  placeholder="Ingrese la dirección"
                  prefix={<FaMapMarkerAlt size={14} className="text-blue-600 mx-1" />}
                />
              </LabelBase>
            </div>
            <div className="md:col-span-2">
              <LabelBase label="Ubicación:" orientation="column">
                <SelectUbigeo
                  value={ubigeoValues[index]}
                  onChange={(value) => handleUbigeoChange(index, value)}
                />
              </LabelBase>
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-start pt-4">
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-600 px-8"
        >
          Guardar Direcciones
        </Button>
      </div>
    </Form>
  );
}
