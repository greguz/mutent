export default {
  input: '.out/index.js',
  output: {
    file: 'mutent.js',
    format: 'cjs'
  },
  external: ['stream']
}
