'use client';

import { Form, FormInstance, Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import InputBase from '~/app/_components/form/inputs/input-base';
import SelectBase from '~/app/_components/form/selects/select-base';
import LabelBase from '~/components/form/label-base';

interface Props {
  form: FormInstance;
}

export default function TableItemsNotaDebito({ form }: Props) {
  return (
    <Form.List name="items">
      {(fields, { add, remove }) => (
        <div className="flex flex-col gap-4">
          {fields.map((field, index) => (
            <div key={field.key} className="border p-4 rounded-lg relative">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => remove(field.name)}
                className="absolute top-2 right-2"
              />
              
              <div className="grid grid-cols-6 gap-4">
                <LabelBase label="Código:" orientation="column">
                  <InputBase
                    propsForm={{
                      name: [field.name, 'codigo'],
                      rules: [{ required: true, message: 'Requerido' }],
                    }}
                    placeholder="INT001"
                  />
                </LabelBase>
                
                <LabelBase label="Unidad:" orientation="column">
                  <SelectBase
                    propsForm={{
                      name: [field.name, 'unidad'],
                      rules: [{ required: true, message: 'Requerido' }],
                      initialValue: 'NIU',
                    }}
                    options={[
                      { label: 'NIU - Unidad', value: 'NIU' },
                      { label: 'KGM - Kilogramo', value: 'KGM' },
                      { label: 'ZZ - Servicio', value: 'ZZ' },
                    ]}
                  />
                </LabelBase>
                
                <LabelBase label="Cantidad:" orientation="column">
                  <InputBase
                    propsForm={{
                      name: [field.name, 'cantidad'],
                      rules: [{ required: true, message: 'Requerido' }],
                      initialValue: 1,
                    }}
                    type="number"
                  />
                </LabelBase>
                
                <LabelBase label="Valor Unit.:" orientation="column">
                  <InputBase
                    propsForm={{
                      name: [field.name, 'valor_unitario'],
                      rules: [{ required: true, message: 'Requerido' }],
                    }}
                    type="number"
                    step="0.01"
                  />
                </LabelBase>
                
                <LabelBase label="Precio Unit.:" orientation="column">
                  <InputBase
                    propsForm={{
                      name: [field.name, 'precio_unitario'],
                      rules: [{ required: true, message: 'Requerido' }],
                    }}
                    type="number"
                    step="0.01"
                  />
                </LabelBase>
                
                <div className="col-span-6">
                  <LabelBase label="Descripción:" orientation="column">
                    <InputBase
                      propsForm={{
                        name: [field.name, 'descripcion'],
                        rules: [
                          { required: true, message: 'Requerido' },
                          { min: 5, message: 'Mínimo 5 caracteres' },
                        ],
                      }}
                      placeholder="Descripción del item"
                    />
                  </LabelBase>
                </div>
              </div>
            </div>
          ))}
          
          <Button
            type="dashed"
            onClick={() => add()}
            icon={<PlusOutlined />}
            className="w-full"
          >
            Agregar Item
          </Button>
        </div>
      )}
    </Form.List>
  );
}
