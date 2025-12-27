import { useDebounce } from 'use-debounce'
import { useEffect, useState } from 'react'
import { clienteApi, Cliente } from '~/lib/api/cliente'

export default function useSearchClientes({ value }: { value: string }) {
  const [response, setResponse] = useState<Cliente[]>()
  const [loading, setLoading] = useState(false)

  const [valueDebounce] = useDebounce(value, 500)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await clienteApi.getAll({
          search: valueDebounce || undefined,
          per_page: 20,
        })

        if (res.error) {
          console.error('Error buscando clientes:', res.error)
          setResponse([])
        } else {
          setResponse(res.data?.data || [])
        }
      } catch (error) {
        console.error('Error en búsqueda de clientes:', error)
        setResponse([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [valueDebounce])

  return { response, loading }
}
