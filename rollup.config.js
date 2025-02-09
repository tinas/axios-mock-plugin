import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'

const isDev = process.env.NODE_ENV !== 'production'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: isDev
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: isDev
    }
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({
      exclude: ['**/__tests__/**']
    }),
  ]
}
