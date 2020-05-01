import test from 'ava'
import { Readable, Transform, Writable, pipeline } from 'readable-stream'

import readify from './readify'

test.cb('lock', t => {
  const highWaterMark = 5
  const objectMode = true
  const size = 100

  const items: any[] = []
  for (let i = 0; i < size; i++) {
    items.push({ value: i })
  }

  let index = 0

  pipeline(
    readify(
      Readable.from(items),
      new Transform({
        highWaterMark,
        objectMode,
        transform (chunk, encoding, callback) {
          callback(null, { value: chunk.value * -1 })
        }
      }),
      {
        highWaterMark,
        objectMode
      }
    ),
    new Writable({
      highWaterMark,
      objectMode,
      write (chunk, encoding, callback) {
        t.is(items[index++].value, chunk.value * -1)
        setTimeout(callback, 10)
      }
    }),
    err => {
      if (!err) {
        t.is(index, size)
      }
      t.end(err)
    }
  )
})
