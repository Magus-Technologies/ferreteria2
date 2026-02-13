"use client";

import { Form, App, Button, Switch, Checkbox } from "antd";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LabelBase from "~/components/form/label-base";
import TextareaBase from "~/app/_components/form/inputs/textarea-base";
import { empresaApi, UpdateEmpresaRequest } from "~/lib/api/empresa";
import { QueryKeys } from "~/app/_lib/queryKeys";

interface FormConfiguracionProps {
  empresaId: number;
}

export default function FormConfiguracion({ empresaId }: FormConfiguracionProps) {
  const [form] = Form.useForm<UpdateEmpresaRequest>();
  const queryClient = useQueryClient();
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
        message.success(response.data?.message || "Configuración actualizada exitosamente");
        queryClient.invalidateQueries({ queryKey: [QueryKeys.EMPRESAS] });
      } else if (response.error) {
        message.error(response.error.message);
      }
    },
    onError: () => {
      message.error("Error al actualizar configuración");
    },
  });

  // Cargar datos al montar
  useEffect(() => {
    if (empresaData?.data?.data) {
      const empresa = empresaData.data.data;
      form.setFieldsValue({
        terminos_comprobantes_ventas: empresa.terminos_comprobantes_ventas || undefined,
        terminos_letras_cambio: empresa.terminos_letras_cambio || undefined,
        terminos_guias_remision: empresa.terminos_guias_remision || undefined,
        terminos_cotizaciones: empresa.terminos_cotizaciones || undefined,
        terminos_ordenes_compras: empresa.terminos_ordenes_compras || undefined,
        imprimir_impuestos_boleta: empresa.imprimir_impuestos_boleta || false,
      });
    }
  }, [empresaData, form]);

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
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-6 text-gray-700">
          Configuración de Términos de Impresión
        </h3>

        <div className="space-y-6">
          {/* Comprobantes de Ventas */}
          <div>
            <LabelBase label="Comprobantes de Ventas:" orientation="column">
              <TextareaBase
                propsForm={{ name: "terminos_comprobantes_ventas" }}
                rows={3}
                placeholder="Términos de impresión de comprobantes de ventas."
              />
            </LabelBase>
          </div>

          {/* Letras de Cambio */}
          <div>
            <LabelBase label="Letras de Cambio:" orientation="column">
              <TextareaBase
                propsForm={{ name: "terminos_letras_cambio" }}
                rows={3}
                placeholder="Términos y condiciones de impresión"
              />
            </LabelBase>
          </div>

          {/* Guías de Remisión */}
          <div>
            <LabelBase label="Guías de Remisión:" orientation="column">
              <TextareaBase
                propsForm={{ name: "terminos_guias_remision" }}
                rows={3}
                placeholder="Términos y condiciones de impresión"
              />
            </LabelBase>
          </div>

          {/* Cotizaciones */}
          <div>
            <LabelBase label="Cotizaciones:" orientation="column">
              <TextareaBase
                propsForm={{ name: "terminos_cotizaciones" }}
                rows={3}
                placeholder="CORPORATIVOS FERRER E.I.R.L. por escrito, con envío de confirmación de pedido."
              />
            </LabelBase>
          </div>

          {/* Ordenes de Compras */}
          <div>
            <LabelBase label="Ordenes de Compras:" orientation="column">
              <TextareaBase
                propsForm={{ name: "terminos_ordenes_compras" }}
                rows={3}
                placeholder="Términos y condiciones de impresión"
              />
            </LabelBase>
          </div>

          {/* Checkbox - Imprimir impuestos en boleta */}
          <div className="pt-4 border-t border-gray-200">
            <Form.Item
              name="imprimir_impuestos_boleta"
              valuePropName="checked"
              className="mb-0"
            >
              <Checkbox>
                Imprimir valores relacionados a los impuestos en el tipo de comprobante Boleta
              </Checkbox>
            </Form.Item>
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
