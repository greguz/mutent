import stream from 'stream'
import {
  Readable,
  Transform,
  Writable,
  isReadable,
  pipeline,
  readify
} from 'fluido'
import Herry from 'herry'

import { Strategies, migrateStatus } from './migration'
import { Status, shouldCommit } from './status'
import { MutationTree, mutateStatus } from './tree'
import { Lazy, isNull, isUndefined, unlazy } from './utils'
import { Writer, writeStatus } from './writer'

export type Value<T> = Promise<T> | T

export type Values<T> = Iterable<T> | AsyncIterable<T> | stream.Readable

export interface DataSettings<T, O> {
  autoCommit?: boolean
  driver?: Writer<T, O>
  migration?: Strategies
  safe?: boolean
}

export type UnwrapOptions<O = {}> = Partial<O> & {
  autoCommit?: boolean
  safe?: boolean
}

export type StreamOptions<O = {}> = UnwrapOptions<O> & {
  concurrency?: number
  highWaterMark?: number
}

export type One<T, O = any> = Lazy<Value<T>, StreamOptions<O>>

export type Many<T, O = any> = Lazy<Values<T>, StreamOptions<O>>

async function getValue<T> (value: Value<T>): Promise<T> {
  return value
}

function getValues<T> (values: Values<T>): stream.Readable {
  return isReadable(values) ? values : Readable.from(values)
}

async function unwrapStatus<T, O> (
  status: Status<T>,
  tree: MutationTree<T>,
  settings: DataSettings<T, O>,
  options: UnwrapOptions<O>
): Promise<T> {
  // Skip everything when "null entity"
  if (isNull(status.target)) {
    return status.target
  }

  // Apply migration strategies
  const { driver, migration } = settings
  if (migration) {
    status = await migrateStatus(status, migration)
  }

  // Apply mutation tree to status
  status = await mutateStatus(status, tree, driver, options)

  // Handle autoCommit/safe features
  if (driver && shouldCommit(status)) {
    const autoCommit = isUndefined(options.autoCommit)
      ? settings.autoCommit !== false
      : options.autoCommit !== false

    const safe = isUndefined(options.safe)
      ? settings.safe !== false
      : options.safe !== false

    if (autoCommit) {
      status = await writeStatus(status, driver, options)
    } else if (safe) {
      throw new Herry('EMUT_UNSAFE', 'Unsafe mutation', {
        source: status.source,
        target: status.target,
        options
      })
    }
  }

  return status.target
}

export async function unwrapOne<T, O> (
  one: One<T, O>,
  build: (data: T) => Status<T>,
  tree: MutationTree<T>,
  settings: DataSettings<T, O>,
  options: UnwrapOptions<O>
): Promise<T> {
  const data = await getValue(unlazy(one, options))
  return unwrapStatus(build(data), tree, settings, options)
}

export function streamOne<T, O> (
  one: One<T, O>,
  build: (data: T) => Status<T>,
  mutation: MutationTree<T>,
  settings: DataSettings<T, O>,
  options: StreamOptions<O>
): stream.Readable {
  return new Readable({
    objectMode: true,
    async asyncRead () {
      const data = await getValue(unlazy(one, options))
      const out = await unwrapStatus(build(data), mutation, settings, options)
      if (!isNull(out)) {
        this.push(out)
      }
      this.push(null)
    }
  })
}

export function unwrapMany<T, O> (
  many: Many<T, O>,
  build: (data: T) => Status<T>,
  tree: MutationTree<T>,
  settings: DataSettings<T, O>,
  options: UnwrapOptions<O>
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    pipeline(
      getValues(unlazy(many, options)),
      new Writable<T>({
        objectMode: true,
        async write (chunk) {
          results.push(
            await unwrapStatus(build(chunk), tree, settings, options)
          )
        }
      }),
      err => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      }
    )
  })
}

export function streamMany<T, O> (
  many: Many<T, O>,
  build: (data: T) => Status<T>,
  tree: MutationTree<T>,
  settings: DataSettings<T, O>,
  options: StreamOptions<O>
): stream.Readable {
  return readify(
    {
      highWaterMark: options.highWaterMark,
      objectMode: true
    },
    getValues(unlazy(many, options)),
    new Transform<T, T>({
      concurrency: options.concurrency,
      highWaterMark: options.highWaterMark,
      objectMode: true,
      async transform (chunk) {
        this.push(
          await unwrapStatus(build(chunk), tree, settings, options)
        )
      }
    })
  )
}
