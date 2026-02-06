import { useQuery } from "@tanstack/react-query";
import { facturacionElectronicaApi } from "~/lib/api/facturacion-electronica";

interface UseGetFacturasParams {
  where?: any;
}

export default function useGetFacturas({ where }: UseGetFacturasParams = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["facturas", where],
    queryFn: async () => {
      const response = await facturacionElectronicaApi.getFacturas(where);
      console.log('🔍 FACTURAS API RESPONSE:', response);
      if (response.error) {
        console.error('❌ FACTURAS ERROR:', response.error);
        throw new Error(response.error.message);
      }
      const result = response.data?.data || [];
      console.log('✅ FACTURAS RESULT:', result);
      return result;
    },
  });

  console.log('📊 HOOK STATE:', { data, isLoading, error });

  return {
    response: data || [],
    isLoading,
    error,
    refetch,
  };
}
