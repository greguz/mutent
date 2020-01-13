import { Readable } from 'stream'

export type Many<T> = T[] | Readable

function wrapArray (arr: any[]) {
  let index = 0
  return new Readable({
    objectMode: true,
    read () {
      let flowing = true
      while (flowing && index < arr.length) {
        flowing = this.push(arr[index++])
      }
      if (index >= arr.length) {
        this.push(null)
      }
    }
  })
}

export function toStream<T> (many: Many<T>) {
  if (Array.isArray(many)) {
    return wrapArray(many)
  } else {
    return many
  }
}
