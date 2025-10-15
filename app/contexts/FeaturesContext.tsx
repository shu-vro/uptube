import { setItem } from '@/lib/utils/async-storage';
import { get } from '@/lib/utils/fetch';
import { createContext, useContext } from 'react';
import useSWR from 'swr';

type TFeatures = Record<string, any>;

const Context = createContext({} as TFeatures);

export default function FeaturesProvider({ children }: { children: React.ReactNode }) {
  const { data, mutate } = useSWR('/features', get, { refreshInterval: 0 });
  setItem('features', data?.data || null);
  console.log(data?.data, 'from provider');
  return <Context.Provider value={{ data, mutate }}>{children}</Context.Provider>;
}

export const useFeatures = () => {
  return useContext(Context);
};
