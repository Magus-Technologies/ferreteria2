import { FaFilePdf, FaImage } from 'react-icons/fa'
import DraggerBase from '~/app/_components/form/inputs/dragger-base'
import LabelBase from '~/components/form/label-base'
import { useBeforeUpload } from '~/utils/upload'
import { useStoreArchivosProducto } from '../../store/store-archivos-producto'

export default function FormArchivosProducto() {
  const beforeUpload = useBeforeUpload()
  const setImgFile = useStoreArchivosProducto(state => state.setImgFile)
  const setFichaTecnicaFile = useStoreArchivosProducto(
    state => state.setFichaTecnicaFile
  )

  return (
    <div className='grid grid-cols-2 gap-8'>
      <LabelBase
        className='flex-col !items-start h-fit'
        label='Adjuntar Imagen:'
      >
        <DraggerBase
          className='w-full'
          listType='picture'
          maxCount={1}
          accept='image/*'
          beforeUpload={file => {
            setImgFile(file)
            return beforeUpload(file)
          }}
          onRemove={() => setImgFile(undefined)}
          icon={<FaImage size={80} className='text-gray-500' />}
          title='Subir Imagen'
          description='Puede arrastrar la imagen aquí'
        />
      </LabelBase>
      <LabelBase
        className='flex-col !items-start h-fit'
        label='Adjuntar Ficha Técnica:'
      >
        <DraggerBase
          className='w-full'
          listType='picture'
          maxCount={1}
          accept='application/pdf'
          beforeUpload={file => {
            setFichaTecnicaFile(file)
            return beforeUpload(file)
          }}
          onRemove={() => setFichaTecnicaFile(undefined)}
          icon={<FaFilePdf size={80} className='text-gray-500' />}
          title='Subir Ficha Técnica'
          description='Puede arrastrar la ficha técnica aquí'
        />
      </LabelBase>
    </div>
  )
}
