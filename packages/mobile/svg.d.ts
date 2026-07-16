// react-native-svg-transformer compiles imported .svg files into
// react-native-svg components. This tells TypeScript what that import is.
declare module '*.svg' {
  import type React from 'react'
  import type { SvgProps } from 'react-native-svg'

  const content: React.FC<SvgProps>
  export default content
}
