import { FaCalendar, FaTruck } from 'react-icons/fa6'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import LabelBase from '~/components/form/label-base'
import { FormInstance } from 'antd'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectClientes from '~/app/_components/form/selects/select-clientes'
import SelectBase from '~/app/_components/form/selects/select-base'
import { TbTruckDelivery } from 'react-icons/tb'
import TextAreaBase from '~/app/_components/form/inputs/textarea-base'

export default function FormCrearGuia({
  form,
  guia,
}: {
  form: FormInstance
  guia?: any
}) {
  return (
    <div className='flex flex-col gap-4'>
      {/* Primera fila: Fechas y Afecta Stock */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6'>
        <LabelBase label='Fecha Emisión:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:w-auto'>
          <DatePickerBase
            propsForm={{
              name: 'fecha_emision',
              rules: [
                {
                  required: true,
                  message: 'Por favor, ingresa la fecha de emisión',
                },
              ],
            }}
            placeholder='Fecha Emisión'
            className='w-full sm:!w-[160px] sm:!min-w-[160px] sm:!max-w-[160px]'
            prefix={<FaCalendar size={15} className='text-cyan-700 mx-1' />}
          />
        </LabelBase>
        <LabelBase label='Fecha Traslado:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:w-auto'>
          <DatePickerBase
            propsForm={{
              name: 'fecha_traslado',
              rules: [
                {
                  required: true,
                  message: 'Por favor, ingresa la fecha de traslado',
                },
              ],
            }}
            placeholder='Fecha Traslado'
            className='w-full sm:!w-[160px] sm:!min-w-[160px] sm:!max-w-[160px]'
            prefix={<FaCalendar size={15} className='text-cyan-700 mx-1' />}
          />
        </LabelBase>
        <LabelBase label='Afecta Stock:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:w-auto'>
          <SelectBase
            propsForm={{
              name: 'afecta_stock',
              rules: [
                {
                  required: true,
                  message: 'Selecciona si afecta stock',
                },
              ],
            }}
            className='w-full sm:!w-[100px] sm:!min-w-[100px] sm:!max-w-[100px]'
            options={[
              { label: 'Sí', value: 'true' },
              { label: 'No', value: 'false' },
            ]}
          />
        </LabelBase>
      </div>
      
      {/* Segunda fila: Serie, Número, Destino */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6'>
        <LabelBase label='Serie:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:w-auto'>
          <InputBase
            propsForm={{
              name: 'serie',
            }}
            placeholder='T001'
            className='w-full sm:!w-[100px] sm:!min-w-[100px] sm:!max-w-[100px]'
          />
        </LabelBase>
        <LabelBase label='Número:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:w-auto'>
          <InputNumberBase
            propsForm={{
              name: 'numero',
            }}
            placeholder='000012'
            className='w-full sm:!w-[120px] sm:!min-w-[120px] sm:!max-w-[120px]'
          />
        </LabelBase>
        <LabelBase label='Destino:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:w-auto'>
          <SelectBase
            propsForm={{
              name: 'destino_id',
            }}
            placeholder='Seleccione Destino...'
            className='w-full sm:!min-w-[200px] sm:!w-[200px] sm:!max-w-[200px]'
            options={[
              { label: 'Almacén Principal', value: 1 },
              { label: 'Almacén Secundario', value: 2 },
            ]}
          />
        </LabelBase>
      </div>
      
      {/* Tercera fila: Cliente y Referencia */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6'>
        <LabelBase label='Cliente:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:w-auto'>
          <SelectClientes
            form={form}
            propsForm={{
              name: 'cliente_id',
              hasFeedback: false,
              className: 'w-full sm:!min-w-[200px] sm:!w-[200px] sm:!max-w-[200px]',
            }}
            className='w-full'
            classNameIcon='text-cyan-600 mx-1'
          />
        </LabelBase>
        <LabelBase label='Referencia:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:flex-1'>
          <InputBase
            propsForm={{
              name: 'referencia',
            }}
            placeholder='Referencia'
            className='w-full'
          />
        </LabelBase>
      </div>
      
      {/* Cuarta fila: Motivo de Traslado y Modalidad */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6'>
        <LabelBase label='Motivo de Traslado:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:flex-1'>
          <SelectBase
            propsForm={{
              name: 'motivo_traslado',
              rules: [
                {
                  required: true,
                  message: 'Selecciona el motivo de traslado',
                },
              ],
            }}
            placeholder='Seleccione...'
            className='w-full'
            options={[
              { label: 'TRASLADO ENTRE ESTABLECIMIENTOS', value: 'TRASLADO_ENTRE_ESTABLECIMIENTOS' },
              { label: 'VENTA', value: 'VENTA' },
              { label: 'COMPRA', value: 'COMPRA' },
              { label: 'DEVOLUCIÓN', value: 'DEVOLUCION' },
              { label: 'OTROS', value: 'OTROS' },
            ]}
          />
        </LabelBase>
        <LabelBase label='Modalidad:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:w-auto'>
          <SelectBase
            propsForm={{
              name: 'modalidad_transporte',
              rules: [
                {
                  required: true,
                  message: 'Selecciona la modalidad',
                },
              ],
            }}
            placeholder='Seleccione...'
            className='w-full sm:!min-w-[200px] sm:!w-[200px] sm:!max-w-[200px]'
            options={[
              { label: 'Transporte privado', value: 'PRIVADO' },
              { label: 'Transporte público', value: 'PUBLICO' },
            ]}
          />
        </LabelBase>
      </div>
      
      {/* Quinta fila: Vehículo y Tipo de Transporte */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6'>
        <LabelBase label='Vehículo (Placa):' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:w-auto'>
          <InputBase
            propsForm={{
              name: 'vehiculo_placa',
            }}
            placeholder='ABC-123'
            prefix={<FaTruck className='text-cyan-700 mx-1' />}
            className='w-full sm:!w-[150px] sm:!min-w-[150px] sm:!max-w-[150px]'
          />
        </LabelBase>
        <LabelBase label='Tipo de Transporte:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:flex-1'>
          <InputBase
            propsForm={{
              name: 'tipo_transporte',
            }}
            placeholder='Tipo de transporte'
            className='w-full'
          />
        </LabelBase>
      </div>
      
      {/* Sexta fila: Punto de Partida */}
      <div className='flex flex-col gap-3'>
        <LabelBase label='Punto de Partida:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full'>
          <TextAreaBase
            propsForm={{
              name: 'punto_partida',
              rules: [
                {
                  required: true,
                  message: 'Ingresa el punto de partida',
                },
              ],
            }}
            placeholder='Dirección completa del punto de partida'
            rows={2}
            className='w-full'
          />
        </LabelBase>
      </div>
      
      {/* Séptima fila: Punto de Llegada */}
      <div className='flex flex-col gap-3'>
        <LabelBase label='Punto de Llegada:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full'>
          <TextAreaBase
            propsForm={{
              name: 'punto_llegada',
              rules: [
                {
                  required: true,
                  message: 'Ingresa el punto de llegada',
                },
              ],
            }}
            placeholder='Dirección completa del punto de llegada'
            rows={2}
            className='w-full'
          />
        </LabelBase>
      </div>
      
      {/* Octava fila: Tipo de Guía */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6'>
        <LabelBase label='Tipo de Guía:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:flex-1'>
          <SelectBase
            propsForm={{
              name: 'tipo_guia',
              rules: [
                {
                  required: true,
                  message: 'Selecciona el tipo de guía',
                },
              ],
            }}
            placeholder='Seleccione...'
            className='w-full'
            prefix={<TbTruckDelivery className='text-cyan-700 mx-1' />}
            options={[
              { label: 'GUIA REMISION ELECTRONICA - Remitente', value: 'ELECTRONICA_REMITENTE' },
              { label: 'GUIA REMISION ELECTRONICA - Transportista', value: 'ELECTRONICA_TRANSPORTISTA' },
              { label: 'GUIA REMISION FISICA', value: 'FISICA' },
            ]}
          />
        </LabelBase>
      </div>
    </div>
  )
}
