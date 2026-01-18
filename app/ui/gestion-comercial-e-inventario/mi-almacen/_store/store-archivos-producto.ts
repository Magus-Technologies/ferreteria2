import { create } from 'zustand'

type UseStoreArchivosProductoProps = {
  // Archivos nuevos seleccionados por el usuario
  img_file?: File
  ficha_tecnica_file?: File
  // URLs de archivos existentes (para preview)
  img_url_existente?: string
  ficha_tecnica_url_existente?: string
  // Setters
  setImgFile: (value: File | undefined) => void
  setFichaTecnicaFile: (value: File | undefined) => void
  setImgUrlExistente: (value: string | undefined) => void
  setFichaTecnicaUrlExistente: (value: string | undefined) => void
  // Reset all
  resetArchivos: () => void
}

export const useStoreArchivosProducto = create<UseStoreArchivosProductoProps>(
  set => {
    return {
      img_file: undefined,
      ficha_tecnica_file: undefined,
      img_url_existente: undefined,
      ficha_tecnica_url_existente: undefined,
      setImgFile: value => set({ img_file: value }),
      setFichaTecnicaFile: value => set({ ficha_tecnica_file: value }),
      setImgUrlExistente: value => set({ img_url_existente: value }),
      setFichaTecnicaUrlExistente: value => set({ ficha_tecnica_url_existente: value }),
      resetArchivos: () => set({
        img_file: undefined,
        ficha_tecnica_file: undefined,
        img_url_existente: undefined,
        ficha_tecnica_url_existente: undefined,
      }),
    }
  }
)
