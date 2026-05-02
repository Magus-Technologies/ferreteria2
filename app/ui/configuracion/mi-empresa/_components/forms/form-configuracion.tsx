"use client";

import { Form, App, Button, Checkbox } from "antd";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LabelBase from "~/components/form/label-base";
import TextareaBase from "~/app/_components/form/inputs/textarea-base";
import { empresaApi, type UpdateEmpresaRequest, type TerminoEmpresa } from "~/lib/api/empresa";
import { QueryKeys } from "~/app/_lib/queryKeys";

interface FormConfiguracionProps {
  empresaId: number;
}

function getTermino(terminos: TerminoEmpresa[] | undefined, tipo: string): TerminoEmpresa {
  return terminos?.find((t) => t.tipo === tipo) || { tipo: tipo as TerminoEmpresa['tipo'] };
}

export default function FormConfiguracion({ empresaId }: FormConfiguracionProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
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

  useEffect(() => {
    if (empresaData?.data?.data) {
      const empresa = empresaData.data.data;
      const terminos = empresa.terminos || [];

      form.setFieldsValue({
        terminos_comprobantes_ventas: getTermino(terminos, 'comprobantes_ventas').contenido || undefined,
        terminos_letras_cambio: getTermino(terminos, 'letras_cambio').contenido || undefined,
        terminos_guias_remision: getTermino(terminos, 'guias_remision').contenido || undefined,
        terminos_cotizaciones: getTermino(terminos, 'cotizaciones').contenido || undefined,
        terminos_ordenes_compras: getTermino(terminos, 'ordenes_compras').contenido || undefined,
        imprimir_impuestos_boleta: empresa.imprimir_impuestos_boleta || false,
      });
    }
  }, [empresaData, form]);

  const handleSubmit = async (values: any) => {
    const terminos: TerminoEmpresa[] = [
      { tipo: 'comprobantes_ventas', contenido: values.terminos_comprobantes_ventas || null },
      { tipo: 'letras_cambio', contenido: values.terminos_letras_cambio || null },
      { tipo: 'guias_remision', contenido: values.terminos_guias_remision || null },
      { tipo: 'cotizaciones', contenido: values.terminos_cotizaciones || null },
      { tipo: 'ordenes_compras', contenido: values.terminos_ordenes_compras || null },
    ];
    updateMutation.mutate({
      terminos,
      imprimir_impuestos_boleta: values.imprimir_impuestos_boleta,
    });
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
          <div>
            <LabelBase label="Comprobantes de Ventas:" orientation="column">
              <TextareaBase
                propsForm={{ name: "terminos_comprobantes_ventas" }}
                rows={3}
                placeholder="Términos de impresión de comprobantes de ventas."
              />
            </LabelBase>
          </div>

          <div>
            <LabelBase label="Letras de Cambio:" orientation="column">
              <TextareaBase
                propsForm={{ name: "terminos_letras_cambio" }}
                rows={3}
                placeholder="Términos y condiciones de impresión"
              />
            </LabelBase>
          </div>

          <div>
            <LabelBase label="Guías de Remisión:" orientation="column">
              <TextareaBase
                propsForm={{ name: "terminos_guias_remision" }}
                rows={3}
                placeholder="Términos y condiciones de impresión"
              />
            </LabelBase>
          </div>

          <div>
            <LabelBase label="Cotizaciones:" orientation="column">
              <TextareaBase
                propsForm={{ name: "terminos_cotizaciones" }}
                rows={3}
                placeholder="CORPORATIVOS FERRER E.I.R.L. por escrito, con envío de confirmación de pedido."
              />
            </LabelBase>
          </div>

          <div>
            <LabelBase label="Ordenes de Compras:" orientation="column">
              <TextareaBase
                propsForm={{ name: "terminos_ordenes_compras" }}
                rows={3}
                placeholder="Términos y condiciones de impresión"
              />
            </LabelBase>
          </div>

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
