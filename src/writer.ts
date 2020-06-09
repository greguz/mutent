import { UnknownRoutineError } from './errors'
import { Status, commitStatus, updateStatus } from './status'
import { MaybePromise, isNil, isNull } from './utils'

export type WriterOutput<T> = MaybePromise<T | null | undefined | void>

export type Routine<T, O = any> = (
  data: T,
  options: Partial<O>,
  ...args: any[]
) => WriterOutput<T>

export interface Writer<T, O = any> {
  create? (data: T, options: Partial<O>): WriterOutput<T>
  update? (data: T, options: Partial<O>, current: T): WriterOutput<T>
  delete? (data: T, options: Partial<O>): WriterOutput<T>
  [key: string]: Routine<T, O> | undefined
}

async function exec<T, O> (
  status: Status<T>,
  options: Partial<O>,
  routine: Routine<T>,
  ...args: any[]
): Promise<Status<T>> {
  const out = await routine(status.target, options, ...args)
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
      return exec(status, options, writer.create)
    }
  } else if (!isNull(status.source) && status.updated && !status.deleted) {
    if (writer.update) {
      return exec(status, options, writer.update, status.source)
    }
  } else if (!isNull(status.source) && status.deleted) {
    if (writer.delete) {
      return exec(status, options, writer.delete)
    }
  }
  return Promise.resolve(commitStatus(status))
}

export async function runRoutine<T, O> (
  writer: Writer<T, O>,
  status: Status<T>,
  options: Partial<O> = {},
  key: string,
  ...args: any[]
): Promise<Status<T>> {
  const routine = writer[key]
  if (!routine) {
    throw new UnknownRoutineError({ key })
  }
  if (key === 'update') {
    args = [status.source]
  }
  return exec(status, options, routine, ...args)
}
