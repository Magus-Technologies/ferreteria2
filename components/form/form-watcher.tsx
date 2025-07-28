import { useEffect } from 'react'
import { FormBaseProps } from './form-base'
import { Form } from 'antd'

export default function FormWatcher<T>({
  form,
  onChangeValues,
  setSubmittable,
}: {
  form?: FormBaseProps<T>['form']
  onChangeValues?: () => void
  setSubmittable?: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const values = Form.useWatch([], form)

  useEffect(() => {
    onChangeValues?.()
    form
      ?.validateFields({ validateOnly: true })
      .then(() => setSubmittable?.(true))
      .catch(() => setSubmittable?.(false))
  }, [form, onChangeValues, setSubmittable, values])

  return null
}
