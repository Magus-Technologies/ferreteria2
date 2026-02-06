'use client';

import { Form, message } from 'antd';
import { useState } from 'react';
import ModalForm from '~/components/modals/modal-form';
import TitleForm from '~/components/form/title-form';
import FormCrearNotaDebito from './form-crear-nota-debito';
import CardsInfoNotaDebito from './cards-info-nota-debito';
import { notaDebitoApi, type CrearNotaDebitoData } from '~/lib/api/nota-debito';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function ModalCrearNotaDebito({ open, setOpen, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // Preparar datos
      const data: CrearNotaDebitoData = {
        serie: values.serie,
        numero: values.numero,
        fecha: values.fecha.format('YYYY-MM-DD'),
        tipo_doc_afectado: values.tipo_doc_afectado,
        num_doc_afectado: values.num_doc_afectado,
        cod_motivo: values.cod_motivo,
        des_motivo: values.des_motivo,
        tipo_moneda: values.tipo_moneda || 'PEN',
        cliente: {
          tipo_doc: values.cliente_tipo_doc,
          num_doc: values.cliente_num_doc,
          razon_social: values.cliente_razon_social,
          direccion: values.cliente_direccion,
        },
        items: values.items || [],
      };

      const response = await notaDebitoApi.crear(data);

      if (response.success) {
        message.success(response.message || 'Nota de Débito generada correctamente');
        
        // Mostrar URL del XML
        if (response.data?.xml_filename) {
          const xmlUrl = notaDebitoApi.verXml(values.serie, values.numero);
          message.info({
            content: (
              <div>
                <p>XML disponible en:</p>
                <a href={xmlUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  Ver XML
                </a>
              </div>
            ),
            duration: 10,
          });
        }

        form.resetFields();
        setOpen(false);
        onSuccess?.();
      } else {
        message.error(response.message || 'Error al generar nota de débito');
      }
    } catch (error: any) {
      console.error('Error:', error);
      message.error(error?.message || 'Error al generar nota de débito');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalForm
      modalProps={{
        width: 1200,
        title: <TitleForm>Crear Nota de Débito</TitleForm>,
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: 'Generar Nota de Débito',
      }}
      onCancel={() => {
        form.resetFields();
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: handleSubmit,
        layout: 'vertical',
      }}
    >
      <div className="flex gap-6">
        {/* Formulario principal */}
        <div className="flex-1 max-h-[70vh] overflow-y-auto pr-2">
          <FormCrearNotaDebito form={form} />
        </div>

        {/* Cards de información */}
        <div className="w-64 flex-shrink-0">
          <div className="sticky top-0">
            <CardsInfoNotaDebito form={form} loading={loading} />
          </div>
        </div>
      </div>
    </ModalForm>
  );
}
