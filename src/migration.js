import Herry from 'herry'

import { updateStatus } from './status'
import { objectify } from './utils'

function getLastVersion(strategies) {
  return Object.keys(strategies)
    .map(key => parseInt(key, 10))
    .filter(key => Number.isInteger(key) && key >= 0)
    .reduce((a, b) => (a > b ? a : b), 0)
}

function getCurrentVersion(data, versionKey) {
  const version = objectify(data)[versionKey]
  return Number.isInteger(version) && version > 0 ? version : 0
}

export async function migrateStatus(
  status,
  strategies,
  versionKey = 'version'
) {
  const vLast = getLastVersion(strategies)
  const vCurr = getCurrentVersion(status.target, versionKey)
  if (vCurr >= vLast) {
    return status
  }

  let data = status.target
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
