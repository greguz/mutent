import fs from 'fs'

import * as mutent from '..'

export interface Options {
  encoding?: string;
  flag?: string | number;
  mode?: string | number;
  replacer?: (key: string, value: any) => any;
  space?: number;
}

async function commit (
  file: string,
  source: any,
  target: any,
  options: Options = {}
) {
  const { encoding, flag, mode, replacer, space } = options

  if (target) {
    await fs.promises.writeFile(file, JSON.stringify(target, replacer, space), {
      encoding,
      flag,
      mode
    })
  } else {
    await fs.promises.unlink(file)
  }
}

function bind (file: string): mutent.Commit<Options> {
  return (source, target, options) => commit(file, source, target, options)
}

export function create<T> (file: string, data: T) {
  return mutent.create<T, Options>(data, bind(file))
}

export async function read<T = any> (file: string, options?: Options) {
  const content = await fs.promises.readFile(file, options)
  const data = JSON.parse(content.toString('utf8'))
  return mutent.read<T, Options>(data, bind(file))
}
