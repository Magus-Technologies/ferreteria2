import { RefObject } from 'react'
import { RefSelectBaseProps } from '../_components/form/selects/select-base'

export default function iterarChangeValue({
  refObject,
  value,
}: {
  refObject: RefObject<RefSelectBaseProps | null>
  value: unknown
}) {
  let ref = refObject.current
  let iteracion = 0
  if (typeof ref?.changeValue !== 'function') {
    const interval = setInterval(() => {
      ref = refObject.current
      if (typeof ref?.changeValue === 'function') {
        clearInterval(interval)
        ref.changeValue(value)
      }
      iteracion++
      console.log(
        '🚀 ~ file: select-ubicaciones.tsx:71 ~ iteracion:',
        iteracion
      )
    }, 100)
  } else {
    ref.changeValue(value)
  }
}
