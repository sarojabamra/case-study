import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/services/api";
import { toastFailure } from "@/utils/toast";

type LoadDataOptions = {
  enabled?: boolean;
  showErrorToast?: boolean;
};

export function useLoadData<T>(
  loadData: () => Promise<T>,
  options: LoadDataOptions = {},
) {
  const enabled = options.enabled ?? true;
  const showErrorToast = options.showErrorToast ?? true;

  const [data, setData] = useState<T | undefined>(undefined);
  const [isPending, setIsPending] = useState(enabled);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<unknown>(undefined);

  const reload = useCallback(async () => {
    if (!enabled) {
      setIsPending(false);
      return;
    }
    setIsPending(true);
    setIsError(false);
    setError(undefined);
    try {
      const loadedData = await loadData();
      setData(loadedData);
    } catch (loadError) {
      setError(loadError);
      setIsError(true);
      if (
        showErrorToast &&
        !(loadError instanceof ApiError && loadError.silent)
      ) {
        toastFailure(loadError);
      }
    } finally {
      setIsPending(false);
    }
  }, [enabled, loadData, showErrorToast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const isSuccess = enabled && !isPending && !isError;

  return {
    data,
    error,
    isPending,
    isError,
    isSuccess,
    reload,
    refetch: reload,
  };
}
