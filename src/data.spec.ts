import test from 'ava'
import { Readable, Writable, pipeline } from 'readable-stream'

import { Many, getMany, getOne } from './data'

test('one value', async t => {
  t.plan(4)
  const result = await getOne(
    { ping: 'pong' },
    function (options) {
      t.is(options.hello, 'world')
      t.is(this.ping, 'pong')
      return 42
    },
    { hello: 'world' }
  )
  t.is(result, 42)
  t.is(await getOne({}, 42), 42)
})

test('one promised value', async t => {
  t.plan(4)
  const result = await getOne(
    { ping: 'pong' },
    async function (options) {
      t.is(options.hello, 'world')
      t.is(this.ping, 'pong')
      return 42
    },
    { hello: 'world' }
  )
  t.is(result, 42)
  t.is(await getOne({}, Promise.resolve(42)), 42)
})

test('one rejections', async t => {
  const message = 'STOP'
  await t.throwsAsync(
    () => getOne({}, Promise.reject(new Error(message))),
    { message }
  )
  await t.throwsAsync(
    () => getOne({}, () => Promise.reject(new Error(message))),
    { message }
  )
})

function collectValues<T, O, C> (
  context: C,
  many: Many<T, O, C>,
  options?: O,
  wait: number = 10
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    pipeline(
      getMany(context, many, options),
      new Writable({
        objectMode: true,
        highWaterMark: 1,
        write (chunk, encoding, callback) {
          results.push(chunk)
          if (wait) {
            setTimeout(callback, wait, null)
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
  t.plan(7)

  const context = { ping: 'pong' }
  const values = [{ value: 42 }, true, 'Pizza']

  const a = await collectValues(context, values)
  t.deepEqual(a, values)

  const b = await collectValues(
    context,
    function (options) {
      t.is(options.type, 'sync')
      t.is(this.ping, 'pong')
      return values
    },
    { type: 'sync' }
  )
  t.deepEqual(b, values)

  const c = await collectValues(
    context,
    async function (options) {
      t.is(options.type, 'async')
      t.is(this.ping, 'pong')
      return values
    },
    { type: 'async' }
  )
  t.deepEqual(c, values)
})

function createReadableStream (values: any[]) {
  return new Readable({
    objectMode: true,
    read () {
      for (const value of values) {
        this.push(value)
      }
      this.push(null)
    }
  })
}

test('many readable', async t => {
  t.plan(7)

  const context = { ping: 'pong' }
  const values: any[] = []
  for (let i = 0; i < 32; i++) {
    values.push({ index: i })
  }

  const a = await collectValues(context, createReadableStream(values))
  t.deepEqual(a, values)

  const b = await collectValues(
    context,
    function (options) {
      t.is(options.type, 'sync')
      t.is(this.ping, 'pong')
      return createReadableStream(values)
    },
    { type: 'sync' }
  )
  t.deepEqual(b, values)

  const c = await collectValues(
    context,
    async function (options) {
      t.is(options.type, 'async')
      t.is(this.ping, 'pong')
      return createReadableStream(values)
    },
    { type: 'async' }
  )
  t.deepEqual(c, values)
})

test('many rejections', async t => {
  const message = 'NOPE'

  await t.throwsAsync(
    () => collectValues({}, Promise.reject<any>(new Error(message))),
    { message }
  )

  await t.throwsAsync(
    () => collectValues({}, () => Promise.reject<any>(new Error(message))),
    { message }
  )
})
