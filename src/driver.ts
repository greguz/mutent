import { assignOptions } from './options'
import { Status, commitStatus, updateStatus, createStatus } from './status'

export interface Driver<T, O = any> {
  create? (target: T, options?: O): Promise<T | void>
  update? (source: T, target: T, options?: O): Promise<T | void>
  delete? (source: T, options?: O): Promise<T | void>
  options?: O
}

export type Handler<T, O> = (status: Status<T>, options?: O) => Promise<Status<T>>

function exec<T, A extends any[]> (
  fn?: (...args: A) => Promise<T | void>,
  ...args: A
): Promise<T | void> {
  return fn
    ? fn(...args)
    : Promise.resolve()
}

export async function handleDriver<T, O> (
  driver: Driver<T, O>,
  status: Status<any>,
  options?: O
): Promise<Status<T>> {
  options = assignOptions(driver.options, options)

  let data: T | void
  if (status.source === null) {
    data = await exec(driver.create, status.target, options)
  } else if (status.updated === true) {
    data = await exec(driver.update, status.source, status.target, options)
  }
  if (data !== undefined) {
    status = updateStatus(status, data)
  }
  status = commitStatus(status)

  if (status.deleted) {
    data = await exec(driver.delete, status.target, options)
    status = createStatus(data !== undefined ? data : status.target)
  }

  return status
}

export function createHandler<T, O> (
  driver: Driver<T, O> = {}
): Handler<T, O> {
  return (status, options) => handleDriver(driver, status, options)
}
