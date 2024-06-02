import { getTransaction as getTransactionApi } from "../../services/transaction/transaction";
import { useQuery } from "@tanstack/react-query";

export function useGetTransaction(contractAddress: string) {
  const { isLoading, data: transactions } = useQuery({
    queryKey: ["transactions", contractAddress],
    queryFn: () => getTransactionApi(contractAddress),
  });

  return { transactions, isLoading };
}
