import stream from 'stream'
import { Readable } from 'fluido'

import { One, StreamOptions, UnwrapOptions, getOne } from './data'
import { Mutation, applyMutation } from './mutation'
import { isNull } from './utils'

export async function unwrapOne<T, O> (
  one: One<T, O>,
  persisted: boolean,
  mutation: Mutation<T, O>,
  options: UnwrapOptions<O> = {}
): Promise<T> {
  return applyMutation(
    await getOne(one, options),
    persisted,
    mutation,
    options
  )
}

export function streamOne<T, O> (
  one: One<T, O>,
  persisted: boolean,
  mutation: Mutation<T, O>,
  options: StreamOptions<O> = {}
): stream.Readable {
  return new Readable({
    objectMode: true,
    async asyncRead () {
      const data = await applyMutation(
        await getOne(one, options),
        persisted,
        mutation,
        options
      )
      if (!isNull(data)) {
        this.push(data)
      }
      this.push(null)
    }
  })
}
