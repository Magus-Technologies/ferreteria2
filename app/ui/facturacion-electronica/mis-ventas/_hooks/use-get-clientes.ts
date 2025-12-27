import { useDebounce } from 'use-debounce'
import { useEffect, useState } from 'react'
import { getClienteResponseProps, SearchCliente } from '~/app/_actions/cliente'

export default function useGetClientes({ value }: { value: string }) {
  const [response, setResponse] = useState<getClienteResponseProps[]>()
  const [loading, setLoading] = useState(false)

  const [valueDebounce] = useDebounce(value, 500)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const res = await SearchCliente({
        where: {
          OR: [
            {
              razon_social: {
                contains: valueDebounce,
              },
            },
            {
              numero_documento: {
                contains: valueDebounce,
              },
            },
            {
              nombres: {
                contains: valueDebounce,
              },
            },
            {
              apellidos: {
                contains: valueDebounce,
              },
            },
          ],
        },
        take: 20,
      })
      setResponse(res.data as getClienteResponseProps[])
      setLoading(false)
    }
    fetchData()
  }, [valueDebounce])

  return { response, loading }
}
