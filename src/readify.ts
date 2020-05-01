import core from 'stream'
import { Readable, Writable, pipeline, ReadableOptions } from 'readable-stream'

export default function readify (
  head: core.Readable,
  body: core.Transform,
  options?: ReadableOptions
) {
  let tail: Writable | undefined
  let next: any

  return new Readable({
    ...options,
    read () {
      if (next) {
        const callback = next
        next = undefined
        callback()
      }
      if (tail) {
        return
      }

      const self = this

      tail = new Writable({
        objectMode: true,
        write (chunk, encoding, callback) {
          if (self.push(chunk)) {
            callback()
          } else {
            next = callback
          }
        }
      })

      pipeline(head, body, tail, err => {
        if (err) {
          self.emit('error', err)
        } else {
          self.push(null)
        }
      })
    },
    destroy (err: any, callback: any) {
      if (tail) {
        tail.destroy(err, callback)
      } else {
        callback(err)
      }
    }
  })
}
