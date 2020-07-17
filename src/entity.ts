import stream from 'stream'
import { Readable } from 'fluido'

import { One, StreamOptions, UnwrapOptions, getOne } from './data'
import { Mutator, applyMutator } from './mutator'
import { Status } from './status'
import { isNull } from './utils'

export async function unwrapOne<T, O> (
  one: One<T, O>,
  build: (data: T) => Status<T>,
  mutator: Mutator<T, O>,
  options: UnwrapOptions<O>
): Promise<T> {
  const data = await getOne(one, options)
  return applyMutator(build(data), mutator, options)
}

export function streamOne<T, O> (
  one: One<T, O>,
  build: (data: T) => Status<T>,
  mutator: Mutator<T, O>,
  options: StreamOptions<O>
): stream.Readable {
  return new Readable({
    objectMode: true,
    async asyncRead () {
      const data = await getOne(one, options)
      const out = await applyMutator(build(data), mutator, options)
      if (!isNull(out)) {
        this.push(out)
      }
      this.push(null)
    }
  })
}
