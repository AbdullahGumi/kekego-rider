import apiService from "@/api/client/apiService";
import { useState } from "react";

const useApi = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = async (
    method: "get" | "post" | "put" | "delete",
    endpoint: string,
    payload?: any,
    headers: Record<string, string> = {}  
  ) => {
    setLoading(true);
    try {
      const response = await apiService[method](endpoint, payload, headers);
      return response;
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, fetchData };
};

export default useApi;
