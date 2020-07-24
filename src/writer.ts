import { Status, commitStatus, updateStatus } from './status'
import { Result, isNil, isNull } from './utils'

export type WriteResult<T> = Result<T | null | undefined | void>

export interface Writer<T, O = any> {
  create? (data: T, options: Partial<O>): WriteResult<T>
  update? (oldData: T, newData: T, options: Partial<O>): WriteResult<T>
  delete? (data: T, options: Partial<O>): WriteResult<T>
}

function close<T> (
  status: Status<T>,
  data?: T | null | undefined | void
) {
  return commitStatus(
    isNil(data)
      ? status
      : updateStatus(status, data)
  )
}

export async function writeStatus<T, O> (
  status: Status<T>,
  writer: Writer<T, O>,
  options: Partial<O> = {}
): Promise<Status<T>> {
  if (isNull(status.source) && status.created && !status.deleted) {
    if (writer.create) {
      return close(
        status,
        await writer.create(status.target, options)
      )
    }
  } else if (!isNull(status.source) && status.updated && !status.deleted) {
    if (writer.update) {
      return close(
        status,
        await writer.update(status.source, status.target, options)
      )
    }
  } else if (!isNull(status.source) && status.deleted) {
    if (writer.delete) {
      return close(
        status,
        await writer.delete(status.source, options)
      )
    }
  }
  return close(status)
}
