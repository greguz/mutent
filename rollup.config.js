export default {
  input: '.out/index.js',
  output: {
    file: 'mutent.js',
    format: 'cjs'
  },
  external: ['ajv', 'fluente', 'fluido', 'herry']
}
