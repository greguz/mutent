import { Status, commitStatus, updateStatus } from './status'
import { MaybePromise, isNil, isNull } from './utils'

export type WriterOutput<T> = MaybePromise<T | null | undefined | void>

export interface Writer<T, O = any> {
  create? (data: T, options: Partial<O>): WriterOutput<T>
  update? (oldData: T, newData: T, options: Partial<O>): WriterOutput<T>
  delete? (data: T, options: Partial<O>): WriterOutput<T>
}

async function exec<T, A extends any[]> (
  status: Status<T>,
  fn: (...args: A) => WriterOutput<T>,
  ...args: A
): Promise<Status<T>> {
  const out = await fn(...args)
  if (!isNil(out)) {
    status = updateStatus(status, out)
  }
  return commitStatus(status)
}

export function handleWriter<T, O> (
  writer: Writer<T, O>,
  status: Status<T>,
  options: Partial<O> = {}
): Promise<Status<T>> {
  if (isNull(status.source) && !status.deleted) {
    if (writer.create) {
      return exec(status, writer.create, status.target, options)
    }
  } else if (!isNull(status.source) && status.updated && !status.deleted) {
    if (writer.update) {
      return exec(status, writer.update, status.source, status.target, options)
    }
  } else if (!isNull(status.source) && status.deleted) {
    if (writer.delete) {
      return exec(status, writer.delete, status.source, options)
    }
  }
  return Promise.resolve(commitStatus(status))
}
