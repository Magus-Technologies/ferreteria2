import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import LabelBase from '~/components/form/label-base'
import FormArchivosProducto from './form-archivos-producto'

export default function FormInformacionAdicional() {
  return (
    <>
      <FormArchivosProducto />
      <LabelBase className='flex-col !items-start mt-4' label='Acción Técnica:'>
        <TextareaBase
          rows={5}
          formWithMessage={false}
          propsForm={{
            name: 'accion_tecnica',
          }}
        />
      </LabelBase>
    </>
  )
}
