import { Status, commitStatus, updateStatus } from './status'
import { isNull } from './utils'

export type MaybePromise<T> = Promise<T> | T

export interface Writer<T, O = any> {
  preCreate? (data: T, options: Partial<O>): MaybePromise<T>
  create? (data: T, options: Partial<O>): any
  preUpdate? (data: T, options: Partial<O>): MaybePromise<T>
  update? (source: T, target: T, options: Partial<O>): any
  preDelete? (data: T, options: Partial<O>): MaybePromise<T>
  delete? (data: T, options: Partial<O>): any
}

function exec<T, A extends any[]> (
  fn: (...args: A) => MaybePromise<T>,
  ...args: A
): Promise<T> {
  return Promise.resolve(fn(...args))
}

export async function handleWriter<T, O> (
  writer: Writer<T, O>,
  status: Status<any>,
  options: Partial<O> = {}
): Promise<Status<T>> {
  if (isNull(status.source) && !status.deleted) {
    if (writer.preCreate) {
      status = updateStatus(
        status,
        await exec(writer.preCreate, status.target, options)
      )
    }
    if (writer.create) {
      await exec(writer.create, status.target, options)
    }
  } else if (!isNull(status.source) && status.updated && !status.deleted) {
    if (writer.preUpdate) {
      status = updateStatus(
        status,
        await exec(writer.preUpdate, status.target, options)
      )
    }
    if (writer.update) {
      await exec(writer.update, status.source, status.target, options)
    }
  } else if (!isNull(status.source) && status.deleted) {
    if (writer.preDelete) {
      status = updateStatus(
        status,
        await exec(writer.preDelete, status.target, options)
      )
    }
    if (writer.delete) {
      await exec(writer.delete, status.target, options)
    }
  }

  return commitStatus(status)
}
