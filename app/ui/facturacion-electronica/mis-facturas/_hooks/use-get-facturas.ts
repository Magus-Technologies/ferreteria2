import { useServerQuery } from "~/hooks/use-server-query";
import { facturacionElectronicaApi } from "~/lib/api/facturacion-electronica";

interface UseGetFacturasParams {
  where?: any;
}

export default function useGetFacturas({ where }: UseGetFacturasParams = {}) {
  const { data, isLoading, error, refetch } = useServerQuery({
    queryKey: ["facturas", where],
    queryFn: async () => {
      const response = await facturacionElectronicaApi.getFacturas(where);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data?.data || [];
    },
  });

  return {
    response: data || [],
    isLoading,
    error,
    refetch,
  };
}
