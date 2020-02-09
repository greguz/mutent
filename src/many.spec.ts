import test from 'ava'
import { Readable, Writable, pipeline } from 'readable-stream'

import { getMany, Many } from './many'

async function extract<T, O> (many: Many<T, O>, options?: O): Promise<T[]> {
  const source = await getMany(many, options)
  return new Promise((resolve, reject) => {
    const results: T[] = []
    pipeline(
      source,
      new Writable({
        objectMode: true,
        write (chunk, encoding, callback) {
          results.push(chunk)
          callback()
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

test('many array', async t => {
  const values = await extract([42])
  t.is(values.length, 1)
  t.is(values[0], 42)
})

test('many sync array', async t => {
  const values = await extract(() => [42])
  t.is(values.length, 1)
  t.is(values[0], 42)
})

test('many async array', async t => {
  const values = await extract(async () => [42])
  t.is(values.length, 1)
  t.is(values[0], 42)
})

test('many stream', async t => {
  const values = await extract(Readable.from([42]) as any)
  t.is(values.length, 1)
  t.is(values[0], 42)
})

test('many sync stream', async t => {
  const values = await extract(() => Readable.from([42]) as any)
  t.is(values.length, 1)
  t.is(values[0], 42)
})

test('many async stream', async t => {
  const values = await extract(async () => Readable.from([42]) as any)
  t.is(values.length, 1)
  t.is(values[0], 42)
})
