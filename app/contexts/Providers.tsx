import React from 'react';
import FeaturesProvider from './FeaturesContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <FeaturesProvider>{children}</FeaturesProvider>;
}
