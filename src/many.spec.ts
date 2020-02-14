import test from 'ava'
import { Readable, Writable, pipeline } from 'readable-stream'

import { getMany, Many } from './many'

async function extract<T, O> (
  many: Many<T, O>,
  options?: O,
  ms?: number
): Promise<T[]> {
  const source = await getMany(many, options)
  return new Promise((resolve, reject) => {
    const results: T[] = []
    pipeline(
      source,
      new Writable({
        objectMode: true,
        write (chunk, encoding, callback) {
          results.push(chunk)
          if (ms) {
            setTimeout(callback, ms, null)
          } else {
            callback()
          }
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

test('array backpressure', async t => {
  const towels: any[] = []
  for (let i = 0; i < 128; i++) {
    towels.push({ value: 42 * i })
  }
  const values = await extract(towels, {}, 10)
  t.is(values.length, towels.length)
  t.is(values[0].value, 0)
  t.is(values[1].value, 42)
  t.is(values[127].value, 42 * 127)
})
