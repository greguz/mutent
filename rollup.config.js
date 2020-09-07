import pluginTypeScript from '@rollup/plugin-typescript'
import tsc from 'typescript'

export default {
  input: '.out/index.js',
  output: {
    file: 'mutent.js',
    format: 'cjs'
  },
  external: [
    'ajv',
    'fluente',
    'fluido',
    'herry'
  ],
  plugins: [
    pluginTypeScript({
      typescript: tsc
    })
  ]
}
