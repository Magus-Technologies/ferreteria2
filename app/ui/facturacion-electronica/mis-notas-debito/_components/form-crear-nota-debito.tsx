'use client';

import { Form, FormInstance } from 'antd';
import { DatePicker } from 'antd';
import InputBase from '~/app/_components/form/inputs/input-base';
import SelectBase from '~/app/_components/form/selects/select-base';
import TextareaBase from '~/app/_components/form/inputs/textarea-base';
import LabelBase from '~/components/form/label-base';
import TableItemsNotaDebito from './table-items-nota-debito';

interface Props {
  form: FormInstance;
}

export default function FormCrearNotaDebito({ form }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Datos del Documento */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Datos del Documento</h3>
        <div className="grid grid-cols-3 gap-4">
          <LabelBase label="Serie:" orientation="column">
            <InputBase
              propsForm={{
                name: 'serie',
                rules: [{ required: true, message: 'Serie requerida' }],
              }}
              placeholder="FD01"
            />
          </LabelBase>
          
          <LabelBase label="Número:" orientation="column">
            <InputBase
              propsForm={{
                name: 'numero',
                rules: [{ required: true, message: 'Número requerido' }],
              }}
              type="number"
              placeholder="1"
            />
          </LabelBase>
          
          <LabelBase label="Fecha:" orientation="column">
            <Form.Item
              name="fecha"
              rules={[{ required: true, message: 'Fecha requerida' }]}
              className="mb-0"
            >
              <DatePicker className="w-full rounded-lg" format="YYYY-MM-DD" />
            </Form.Item>
          </LabelBase>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <LabelBase label="Moneda:" orientation="column">
            <SelectBase
              propsForm={{
                name: 'tipo_moneda',
                rules: [{ required: true, message: 'Moneda requerida' }],
                initialValue: 'PEN',
              }}
              options={[
                { label: 'Soles (PEN)', value: 'PEN' },
                { label: 'Dólares (USD)', value: 'USD' },
              ]}
            />
          </LabelBase>
        </div>
      </div>

      {/* Documento Afectado */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Documento Afectado</h3>
        <div className="grid grid-cols-2 gap-4">
          <LabelBase label="Tipo de Documento:" orientation="column">
            <SelectBase
              propsForm={{
                name: 'tipo_doc_afectado',
                rules: [{ required: true, message: 'Tipo requerido' }],
              }}
              options={[
                { label: 'Factura', value: '01' },
                { label: 'Boleta', value: '03' },
              ]}
              placeholder="Seleccione"
            />
          </LabelBase>
          
          <LabelBase label="Número de Documento:" orientation="column">
            <InputBase
              propsForm={{
                name: 'num_doc_afectado',
                rules: [{ required: true, message: 'Número requerido' }],
              }}
              placeholder="F001-123"
            />
          </LabelBase>
        </div>
      </div>

      {/* Motivo */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Motivo</h3>
        <div className="grid grid-cols-1 gap-4">
          <LabelBase label="Código de Motivo:" orientation="column">
            <SelectBase
              propsForm={{
                name: 'cod_motivo',
                rules: [{ required: true, message: 'Código requerido' }],
              }}
              options={[
                { label: '01 - Intereses por mora', value: '01' },
                { label: '02 - Aumento en el valor', value: '02' },
                { label: '03 - Penalidades / otros conceptos', value: '03' },
                { label: '10 - Ajustes de operaciones de exportación', value: '10' },
                { label: '11 - Ajustes afectos al IVAP', value: '11' },
              ]}
              placeholder="Seleccione"
            />
          </LabelBase>
          
          <LabelBase label="Descripción del Motivo:" orientation="column">
            <TextareaBase
              propsForm={{
                name: 'des_motivo',
                rules: [
                  { required: true, message: 'Descripción requerida' },
                  { min: 10, message: 'Mínimo 10 caracteres' },
                ],
              }}
              placeholder="Describa el motivo de forma clara y detallada..."
              rows={3}
            />
          </LabelBase>
        </div>
      </div>

      {/* Datos del Cliente */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Datos del Cliente</h3>
        <div className="grid grid-cols-3 gap-4">
          <LabelBase label="Tipo de Documento:" orientation="column">
            <SelectBase
              propsForm={{
                name: 'cliente_tipo_doc',
                rules: [{ required: true, message: 'Tipo requerido' }],
              }}
              options={[
                { label: 'DNI', value: '1' },
                { label: 'RUC', value: '6' },
              ]}
              placeholder="Seleccione"
            />
          </LabelBase>
          
          <LabelBase label="Número de Documento:" orientation="column">
            <InputBase
              propsForm={{
                name: 'cliente_num_doc',
                rules: [{ required: true, message: 'Número requerido' }],
              }}
              placeholder="20000000001"
            />
          </LabelBase>
          
          <LabelBase label="Razón Social / Nombre:" orientation="column">
            <InputBase
              propsForm={{
                name: 'cliente_razon_social',
                rules: [{ required: true, message: 'Nombre requerido' }],
              }}
              placeholder="EMPRESA SAC"
            />
          </LabelBase>
        </div>
        <div className="mt-4">
          <LabelBase label="Dirección (opcional):" orientation="column">
            <InputBase
              propsForm={{
                name: 'cliente_direccion',
              }}
              placeholder="AV. EJEMPLO 123"
            />
          </LabelBase>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Items</h3>
        <TableItemsNotaDebito form={form} />
      </div>
    </div>
  );
}
