import Herry from 'herry'

import { updateStatus } from './status'

function getLastVersion(strategies) {
  return Object.keys(strategies)
    .map(key => parseInt(key, 10))
    .filter(key => Number.isInteger(key) && key >= 0)
    .reduce((a, b) => (a > b ? a : b), 0)
}

export function createMigration(strategies, versionKey = 'version') {
  return {
    lastVersion: getLastVersion(strategies),
    strategies,
    versionKey
  }
}

function getVersion(data, versionKey) {
  return data[versionKey] || 0
}

export async function migrateStatus(
  { lastVersion, strategies, versionKey },
  status
) {
  const vCurr = getVersion(status.target, versionKey)
  if (vCurr >= lastVersion) {
    return status
  }

  let data = status.target
  for (let v = vCurr + 1; v <= lastVersion; v++) {
    const strategy = strategies[v]
    if (typeof strategy !== 'function') {
      throw new Herry('EMUT_MISSING_STRATEGY', 'Missing migration strategy', {
        version: v
      })
    }
    data = await strategy(data)
    if (getVersion(data, versionKey) !== v) {
      throw new Herry('EMUT_EXPECTED_UPGRADE', 'Expected version upgrade', {
        version: v,
        data
      })
    }
  }

  return updateStatus(status, data)
}
