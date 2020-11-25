export default {
  input: 'src/index.js',
  output: {
    file: 'mutent.js',
    format: 'cjs'
  },
  external: ['ajv', 'fluente', 'herry', 'lodash.get']
}
