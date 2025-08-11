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
  if (typeof ref?.changeValue !== 'function') {
    const interval = setInterval(() => {
      ref = refObject.current
      if (typeof ref?.changeValue === 'function') {
        clearInterval(interval)
        ref.changeValue(value)
      }
    }, 100)
  } else {
    ref.changeValue(value)
  }
}
