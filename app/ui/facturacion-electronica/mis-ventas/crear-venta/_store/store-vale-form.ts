import { create } from 'zustand'
import type { FormInstance } from 'antd'

type UseStoreValeFormProps = {
  form: FormInstance | null
  setForm: (form: FormInstance) => void
}

export const useStoreValeForm = create<UseStoreValeFormProps>((set) => ({
  form: null,
  setForm: (form) => set({ form }),
}))
