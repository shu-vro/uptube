declare module '*.svg' {
  import type { SvgProps } from 'react-native-svg';
  import * as React from 'react';
  const SvgComponent: React.FC<SvgProps>;
  export default SvgComponent;
}
