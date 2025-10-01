import { setItem } from '@/lib/utils/async-storage';
import { get } from '@/lib/utils/fetch';
import { createContext, useContext } from 'react';
import useSWR from 'swr';

type TFeatures = Record<string, any>;

const Context = createContext({} as TFeatures);

export default function FeaturesProvider({ children }: { children: React.ReactNode }) {
  const { data, mutate } = useSWR('/features', get);
  setItem('features', data?.data || null);
  return <Context.Provider value={{ data, mutate }}>{children}</Context.Provider>;
}

export const useFeatures = () => {
  return useContext(Context);
};
