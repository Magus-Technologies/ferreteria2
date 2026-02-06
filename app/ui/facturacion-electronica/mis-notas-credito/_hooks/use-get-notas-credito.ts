import { useServerQuery } from "~/hooks/use-server-query";
import { facturacionElectronicaApi } from "~/lib/api/facturacion-electronica";

export default function useGetNotasCredito({ where }: { where?: any } = {}) {
  const { data, isLoading, error, refetch } = useServerQuery({
    queryKey: ["notas-credito", where],
    queryFn: async () => {
      const response = await facturacionElectronicaApi.getNotasCredito(where);
      if (response.error) throw new Error(response.error.message);
      return response.data?.data || [];
    },
  });
  return { response: data || [], isLoading, error, refetch };
}
