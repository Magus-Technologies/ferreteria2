import { useEffect, useRef, useState } from 'react'

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const initialRef = useRef(initialValue)
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        setStoredValue(JSON.parse(item))
      } else {
        window.localStorage.setItem(key, JSON.stringify(initialRef.current))
      }
    } catch (error) {
      console.error('Error al leer localStorage:', error)
    }
  }, [key])

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        if (valueToStore === null) window.localStorage.removeItem(key)
        else window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error('Error al guardar en localStorage:', error)
    }
  }

  return [storedValue, setValue] as const
}
