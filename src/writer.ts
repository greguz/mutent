import Herry from 'herry'

import { Status, commitStatus, shouldCommit, updateStatus } from './status'
import { Result, isNil, isNull, isUndefined } from './utils'

export type WriteResult<T> = Result<T | null | undefined | void>

export interface Writer<T, O = any> {
  create? (data: T, options: Partial<O>): WriteResult<T>
  update? (oldData: T, newData: T, options: Partial<O>): WriteResult<T>
  delete? (data: T, options: Partial<O>): WriteResult<T>
}

export interface WritableSettings<T, O> {
  autoCommit?: boolean
  safe?: boolean
  writer?: Writer<T, O>
}

export type WritableOptions<O = {}> = Partial<O> & {
  autoCommit?: boolean
  safe?: boolean
}

async function exec<T, A extends any[]> (
  status: Status<T>,
  fn: (...args: A) => WriteResult<T>,
  ...args: A
): Promise<Status<T>> {
  const out = await fn(...args)
  if (!isNil(out)) {
    status = updateStatus(status, out)
  }
  return commitStatus(status)
}

export async function writeStatus<T, O> (
  status: Status<T>,
  writer: Writer<T, O>,
  options: Partial<O> = {}
): Promise<Status<T>> {
  if (isNull(status.source) && status.created && !status.deleted) {
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
  return commitStatus(status)
}

export async function unwrapStatus<T, O> (
  status: Status<T>,
  settings: WritableSettings<T, O>,
  options: WritableOptions<O>
): Promise<T> {
  const { writer } = settings

  if (writer && shouldCommit(status)) {
    const autoCommit = isUndefined(options.autoCommit)
      ? settings.autoCommit !== false
      : options.autoCommit !== false

    const safe = isUndefined(options.safe)
      ? settings.safe !== false
      : options.safe !== false

    if (autoCommit) {
      status = await writeStatus(status, writer, options)
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
