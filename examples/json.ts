import fs from 'fs-extra'

import * as mutent from '..'

export type Options = fs.WriteOptions & fs.ReadOptions

function createPlugin (file: string): mutent.Driver<any, Options> {
  return {
    async create (target, options) {
      // Ensure target dir and write JSON file at the same time
      await fs.outputJson(file, target, options)
    },
    async update (source, target, options) {
      // Just update file content
      await fs.writeJson(file, target, options)
    },
    async delete (source, options) {
      // Delete JSON file
      await fs.remove(file)
    }
  }
}

export function createJson<T> (file: string, data: T) {
  return mutent.create<T, Options>(data, createPlugin(file))
}

export function readJson<T = any> (file: string) {
  return mutent.read<T, Options>(
    options => fs.readJson(file, options),
    createPlugin(file)
  )
}
