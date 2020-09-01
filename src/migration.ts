import Herry from 'herry'

import { Status, updateStatus } from './status'
import { objectify } from './utils'

export type Strategy = (data: any) => any

export interface Strategies {
  [version: number]: Strategy | undefined
}

function getLastVersion (strategies: Strategies): number {
  return Object.keys(strategies)
    .map(key => parseInt(key, 10))
    .filter(key => Number.isInteger(key) && key >= 0)
    .reduce((a, b) => a > b ? a : b, 0)
}

function getCurrentVersion (data: any): number {
  const version = objectify(data).version
  return Number.isInteger(version) && version > 0
    ? version
    : 0
}

export async function migrateStatus<T> (
  status: Status<T>,
  strategies: Strategies
): Promise<Status<T>> {
  const vLast = getLastVersion(strategies)
  const vCurr = getCurrentVersion(status.target)
  if (vCurr >= vLast) {
    return status
  }

  let data: any = status.target
  for (let v = vCurr + 1; v <= vLast; v++) {
    const strategy = strategies[v]
    if (!strategy) {
      throw new Herry(
        'EMUT_MISSING_STRATEGY',
        'Expected migration strategy',
        { version: v }
      )
    }
    data = await strategy(data)
  }
  return updateStatus(status, data)
}
