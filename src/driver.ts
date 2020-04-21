import { Status, commitStatus, updateStatus, createStatus } from './status'
import { isNull } from './utils'

export type MaybePromise<T> = Promise<T> | T

export interface Driver<T, O = any> {
  preCreate? (data: T, options: Partial<O>): MaybePromise<T>
  create? (data: T, options: Partial<O>): any
  preUpdate? (data: T, options: Partial<O>): MaybePromise<T>
  update? (source: T, target: T, options: Partial<O>): any
  preDelete? (data: T, options: Partial<O>): MaybePromise<T>
  delete? (data: T, options: Partial<O>): any
}

export type Handler<T, O> = (
  status: Status<T>,
  options: Partial<O>
) => Promise<Status<T>>

function exec<T, A extends any[]> (
  fn: (...args: A) => MaybePromise<T>,
  ...args: A
): Promise<T> {
  return Promise.resolve(fn(...args))
}

export async function handleDriver<T, O> (
  driver: Driver<T, O>,
  status: Status<any>,
  options: Partial<O> = {}
): Promise<Status<T>> {
  if (isNull(status.source)) {
    if (driver.preCreate) {
      status = updateStatus(
        status,
        await exec(driver.preCreate, status.target, options)
      )
    }
    if (driver.create) {
      await exec(driver.create, status.target, options)
    }
  } else if (status.updated === true) {
    if (driver.preUpdate) {
      status = updateStatus(
        status,
        await exec(driver.preUpdate, status.target, options)
      )
    }
    if (driver.update) {
      await exec(driver.update, status.source, status.target, options)
    }
  }
  status = commitStatus(status)

  if (status.deleted) {
    if (driver.preDelete) {
      status = updateStatus(
        status,
        await exec(driver.preDelete, status.target, options)
      )
    }
    if (driver.delete) {
      await exec(driver.delete, status.target, options)
    }
    status = createStatus(status.target)
  }

  return status
}

export function createHandler<T, O> (
  driver: Driver<T, O> = {}
): Handler<T, O> {
  return (status, options) => handleDriver(driver, status, options)
}
