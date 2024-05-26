import { useRouter } from "next/navigation";
import { uploadFile as uploadFileApi } from "../../services/upload/upload";
import { UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

type CustomMutationResult<TData, TError> = UseMutationResult<TData, TError, { hash: string; logs: any }, unknown> & {
  isLoading: boolean;
};

export function useUploadFile() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    mutate: uploadFile,
    isLoading,
    isPending,
  } = useMutation<any, Error, { hash: string; logs: any }, unknown>({
    mutationFn: ({ hash, logs }) => uploadFileApi(hash, logs),
    onSuccess: data => {
      queryClient.setQueryData(["files"], data);
      toast(`✅ File uploaded: ${data.message}`);
      router.push("/upload/zk-proofs");
    },
    onError: err => {
      toast.error(err.message);
    },
  }) as CustomMutationResult<any, Error>;

  return { uploadFile, isLoading, isPending };
}
