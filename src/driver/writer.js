import { commitStatus, updateStatus } from '../status'
import { isFunction, isNil, isNull } from '../utils'

import { DriverError } from './error'

export async function writeStatus(status, driver, options = {}) {
  let data
  if (isNull(status.source) && status.created && !status.deleted) {
    if (!isFunction(driver.create)) {
      throw DriverError('create', {
        op: 'CREATE',
        data: status.target,
        options
      })
    }
    data = await driver.create(status.target, options)
  } else if (!isNull(status.source) && status.updated && !status.deleted) {
    if (!isFunction(driver.update)) {
      throw DriverError('update', {
        op: 'UPDATE',
        oldData: status.source,
        newDate: status.target,
        options
      })
    }
    data = await driver.update(status.source, status.target, options)
  } else if (!isNull(status.source) && status.deleted) {
    if (!isFunction(driver.delete)) {
      throw DriverError('delete', {
        op: 'DELETE',
        data: status.source,
        options
      })
    }
    data = await driver.delete(status.source, options)
  }
  return commitStatus(isNil(data) ? status : updateStatus(status, data))
}
