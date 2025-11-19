import ServerMaintenance from '@/components/ui/server-maintainance';
import { setItem } from '@/lib/utils/async-storage';
import { get } from '@/lib/utils/fetch';
import { createContext, useContext, useState } from 'react';
import useSWR from 'swr';

type TFeatures = Record<string, any>;

const Context = createContext({} as TFeatures);

export default function FeaturesProvider({ children }: { children: React.ReactNode }) {
  const [dataFetchFailed, setdataFetchFailed] = useState(false);
  const { data, mutate } = useSWR('/features', get, {
    refreshInterval: 0,
    onSuccess(data, key, config) {
      setdataFetchFailed(!data?.success);
    },
  });
  setItem('features', data?.data || null);
  console.log(data?.data, 'from provider');
  return (
    <Context.Provider value={{ data, mutate }}>
      {!dataFetchFailed && children}
      {dataFetchFailed && <ServerMaintenance onRetry={mutate} />}
    </Context.Provider>
  );
}

export const useFeatures = () => {
  return useContext(Context);
};
