import { getUploads as getUploadsApi } from "../../services/upload/upload";
import { useQuery } from "@tanstack/react-query";

export function useGetUploads() {
  const { isLoading, data: files } = useQuery({
    queryKey: ["files"],
    queryFn: () => getUploadsApi(),
  });

  return { files, isLoading };
}
