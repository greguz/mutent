import { assignOptions } from './options'
import { Status, commitStatus, updateStatus, createStatus } from './status'

export type MaybePromise<T> = Promise<T> | T

export type DriverOutput<T> = MaybePromise<T | undefined | void>

export interface Driver<T, O = any> {
  create? (data: T, options?: O): DriverOutput<T>
  update? (source: T, target: T, options?: O): DriverOutput<T>
  delete? (data: T, options?: O): DriverOutput<T>
  defaults?: O
}

export type Handler<T, O> = (status: Status<T>, options?: O) => Promise<Status<T>>

async function exec<T, A extends any[]> (
  fn?: (...args: A) => DriverOutput<T>,
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
  options = assignOptions(driver.defaults, options)

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
