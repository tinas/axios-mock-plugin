import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import dts from 'rollup-plugin-dts'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const isDev = process.env.NODE_ENV !== 'production'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function mergeGlobalDts() {
  return {
    name: 'merge-global-dts',
    writeBundle() {
      const outputFile = resolve(__dirname, 'dist/index.d.ts')
      const globalFile = resolve(__dirname, 'global.d.ts')
      if (existsSync(outputFile) && existsSync(globalFile)) {
        const indexContent = readFileSync(outputFile, 'utf8')
        const globalContent = readFileSync(globalFile, 'utf8')
        const merged = `${indexContent}\n${globalContent}`
        writeFileSync(outputFile, merged, 'utf8')
      }
    }
  }
}

export default [
  {
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
      })
    ]
  },
  {
    input: 'dist/types/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [
      dts(),
      mergeGlobalDts()
    ]
  }
]
