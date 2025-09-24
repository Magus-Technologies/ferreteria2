import { create } from 'zustand'

type UseStoreArchivosProductoProps = {
  img_file?: File
  ficha_tecnica_file?: File
  setImgFile: (value: File | undefined) => void
  setFichaTecnicaFile: (value: File | undefined) => void
}

export const useStoreArchivosProducto = create<UseStoreArchivosProductoProps>(
  set => {
    return {
      img_file: undefined,
      ficha_tecnica_file: undefined,
      setImgFile: value => set({ img_file: value }),
      setFichaTecnicaFile: value => set({ ficha_tecnica_file: value }),
    }
  }
)
