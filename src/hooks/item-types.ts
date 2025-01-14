import { useQuery } from "react-query";

import { httpClient } from "@/lib/base-http-client";

export interface ItemType {
  name: string;
}

export const useItemTypes = () => {
  const queryFn = async () => {
    const url = `/item-type`;
    const response = await httpClient.get(url);

    return response.data;
  };

  return useQuery({
    queryKey: ["item-types"],
    queryFn: queryFn
  });
};
