import Herry from 'herry'

import { Status, updateStatus } from './status'
import { objectify } from './utils'

export type Strategy = (data: any) => any

export interface Strategies {
  [version: number]: Strategy | undefined
}

function getLastVersion(strategies: Strategies): number {
  return Object.keys(strategies)
    .map(key => parseInt(key, 10))
    .filter(key => Number.isInteger(key) && key >= 0)
    .reduce((a, b) => (a > b ? a : b), 0)
}

function getCurrentVersion(data: any, versionKey: string): number {
  const version = objectify(data)[versionKey]
  return Number.isInteger(version) && version > 0 ? version : 0
}

export async function migrateStatus<T>(
  status: Status<T>,
  strategies: Strategies,
  versionKey: string = 'version'
): Promise<Status<T>> {
  const vLast = getLastVersion(strategies)
  const vCurr = getCurrentVersion(status.target, versionKey)
  if (vCurr >= vLast) {
    return status
  }

  let data: any = status.target
  for (let v = vCurr + 1; v <= vLast; v++) {
    const strategy = strategies[v]
    if (typeof strategy !== 'function') {
      throw new Herry('EMUT_MISSING_STRATEGY', 'Missing migration strategy', {
        version: v
      })
    }
    data = await strategy(data)
    if (getCurrentVersion(data, versionKey) !== v) {
      throw new Herry('EMUT_EXPECTED_UPGRADE', 'Expected version upgrade', {
        version: v,
        data
      })
    }
  }
  return updateStatus(status, data)
}
