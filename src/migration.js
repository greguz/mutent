import { MutentError } from './error'

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

export async function migrateData(
  { lastVersion, strategies, versionKey },
  data
) {
  const vCurr = getVersion(data, versionKey)
  if (vCurr >= lastVersion) {
    return data
  }

  for (let v = vCurr + 1; v <= lastVersion; v++) {
    const strategy = strategies[v]
    if (typeof strategy !== 'function') {
      throw new MutentError(
        'EMUT_MISSING_STRATEGY',
        'Missing migration strategy',
        { version: v }
      )
    }
    data = await strategy(data)
    if (getVersion(data, versionKey) !== v) {
      throw new MutentError(
        'EMUT_EXPECTED_UPGRADE',
        'Expected version upgrade',
        { version: v, data }
      )
    }
  }

  return data
}
