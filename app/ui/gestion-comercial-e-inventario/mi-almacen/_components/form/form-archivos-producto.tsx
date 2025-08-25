import { FaFilePdf, FaImage } from 'react-icons/fa'
import DraggerBase from '~/app/_components/form/inputs/dragger-base'
import LabelBase from '~/components/form/label-base'
import { toUploadFile, useBeforeUpload } from '~/utils/upload'
import { useStoreArchivosProducto } from '../../store/store-archivos-producto'

export default function FormArchivosProducto() {
  const beforeUpload = useBeforeUpload()
  const setImgFile = useStoreArchivosProducto(state => state.setImgFile)
  const img_file = useStoreArchivosProducto(state => state.img_file)
  const setFichaTecnicaFile = useStoreArchivosProducto(
    state => state.setFichaTecnicaFile
  )
  const ficha_tecnica_file = useStoreArchivosProducto(
    state => state.ficha_tecnica_file
  )

  return (
    <div className='grid grid-cols-2 gap-8'>
      <LabelBase
        className='h-fit'
        label='Adjuntar Imagen:'
        orientation='column'
      >
        <DraggerBase
          fileList={img_file ? [toUploadFile(img_file)] : []}
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
        orientation='column'
        className='h-fit'
        label='Adjuntar Ficha Técnica:'
      >
        <DraggerBase
          fileList={
            ficha_tecnica_file ? [toUploadFile(ficha_tecnica_file)] : []
          }
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
