import { promises as fs } from 'fs'

import * as mutent from '..'

export interface Options {
  encoding?: string
  flag?: string | number
  mode?: string | number
  replacer?: (key: string, value: any) => any
  space?: number
}

async function commit (
  file: string,
  source: any,
  target: any,
  options: Options = {}
) {
  const { encoding, flag, mode, replacer, space } = options

  if (target) {
    await fs.writeFile(file, JSON.stringify(target, replacer, space), {
      encoding,
      flag,
      mode
    })
  } else {
    await fs.unlink(file)
  }
}

function bind (file: string): mutent.Commit<Options> {
  return (source, target, options) => commit(file, source, target, options)
}

export function createFile<T> (file: string, data: T) {
  return mutent.create<T, Options>(data, bind(file))
}

async function readJSON (file: string, options: Options = {}) {
  const content = await fs.readFile(file, options)
  return JSON.parse(content.toString(options.encoding))
}

export function readFile<T = any> (file: string) {
  return mutent.read<T, Options>(
    options => readJSON(file, options),
    bind(file)
  )
}
