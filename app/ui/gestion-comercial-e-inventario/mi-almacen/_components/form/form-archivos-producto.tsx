import { FaFilePdf, FaImage, FaExternalLinkAlt } from 'react-icons/fa'
import { IoClose } from 'react-icons/io5'
import DraggerBase from '~/app/_components/form/inputs/dragger-base'
import LabelBase from '~/components/form/label-base'
import { toUploadFile, useBeforeUpload } from '~/utils/upload'
import { useStoreArchivosProducto } from '../../_store/store-archivos-producto'

export default function FormArchivosProducto() {
  const beforeUpload = useBeforeUpload()

  // Archivos nuevos
  const setImgFile = useStoreArchivosProducto(state => state.setImgFile)
  const img_file = useStoreArchivosProducto(state => state.img_file)
  const setFichaTecnicaFile = useStoreArchivosProducto(state => state.setFichaTecnicaFile)
  const ficha_tecnica_file = useStoreArchivosProducto(state => state.ficha_tecnica_file)

  // URLs existentes
  const img_url_existente = useStoreArchivosProducto(state => state.img_url_existente)
  const ficha_tecnica_url_existente = useStoreArchivosProducto(state => state.ficha_tecnica_url_existente)
  const setImgUrlExistente = useStoreArchivosProducto(state => state.setImgUrlExistente)
  const setFichaTecnicaUrlExistente = useStoreArchivosProducto(state => state.setFichaTecnicaUrlExistente)

  return (
    <div className='grid grid-cols-2 gap-8'>
      <LabelBase
        className='h-fit'
        label='Adjuntar Imagen:'
        orientation='column'
      >
        {/* Mostrar preview de imagen existente si no hay archivo nuevo */}
        {!img_file && img_url_existente ? (
          <div className='relative border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center gap-2'>
            <img
              src={img_url_existente}
              alt='Imagen actual'
              className='max-w-48 max-h-48 object-contain rounded'
            />
            <span className='text-xs text-gray-500'>Imagen actual</span>
            <div className='flex gap-2'>
              <a
                href={img_url_existente}
                target='_blank'
                rel='noreferrer'
                className='text-cyan-600 hover:text-cyan-700 text-xs flex items-center gap-1'
              >
                <FaExternalLinkAlt size={10} /> Ver
              </a>
              <button
                type='button'
                onClick={() => setImgUrlExistente(undefined)}
                className='text-red-500 hover:text-red-700 text-xs flex items-center gap-1'
              >
                <IoClose size={12} /> Quitar
              </button>
            </div>
          </div>
        ) : (
          <DraggerBase
            fileList={img_file ? [toUploadFile(img_file)] : []}
            className='w-full'
            listType='picture'
            maxCount={1}
            accept='image/*'
            beforeUpload={file => {
              setImgFile(file)
              setImgUrlExistente(undefined) // Limpiar URL existente cuando se sube nueva
              return beforeUpload(file)
            }}
            onRemove={() => setImgFile(undefined)}
            icon={<FaImage size={80} className='text-gray-500' />}
            title='Subir Imagen'
            description='Puede arrastrar la imagen aquí'
          />
        )}
      </LabelBase>
      <LabelBase
        orientation='column'
        className='h-fit'
        label='Adjuntar Ficha Técnica:'
      >
        {/* Mostrar preview de ficha técnica existente si no hay archivo nuevo */}
        {!ficha_tecnica_file && ficha_tecnica_url_existente ? (
          <div className='relative border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center gap-2'>
            <FaFilePdf size={60} className='text-red-500' />
            <span className='text-xs text-gray-500'>Ficha técnica actual</span>
            <div className='flex gap-2'>
              <a
                href={ficha_tecnica_url_existente}
                target='_blank'
                rel='noreferrer'
                className='text-cyan-600 hover:text-cyan-700 text-xs flex items-center gap-1'
              >
                <FaExternalLinkAlt size={10} /> Ver PDF
              </a>
              <button
                type='button'
                onClick={() => setFichaTecnicaUrlExistente(undefined)}
                className='text-red-500 hover:text-red-700 text-xs flex items-center gap-1'
              >
                <IoClose size={12} /> Quitar
              </button>
            </div>
          </div>
        ) : (
          <DraggerBase
            fileList={ficha_tecnica_file ? [toUploadFile(ficha_tecnica_file)] : []}
            className='w-full'
            listType='picture'
            maxCount={1}
            accept='application/pdf'
            beforeUpload={file => {
              setFichaTecnicaFile(file)
              setFichaTecnicaUrlExistente(undefined) // Limpiar URL existente cuando se sube nueva
              return beforeUpload(file)
            }}
            onRemove={() => setFichaTecnicaFile(undefined)}
            icon={<FaFilePdf size={80} className='text-gray-500' />}
            title='Subir Ficha Técnica'
            description='Puede arrastrar la ficha técnica aquí'
          />
        )}
      </LabelBase>
    </div>
  )
}
