import { MutentError } from './error'

export function createMigration(strategies = {}, version = 0, key = 'version') {
  if (!Number.isInteger(version) || version < 0) {
    throw new MutentError(
      'EMUT_INVALID_VERSION',
      'Invalid version configured',
      { version }
    )
  }
  return {
    key,
    strategies,
    version
  }
}

function getVersion(data, key) {
  return data[key] || 0
}

export async function migrateData({ key, strategies, version }, data) {
  let v = getVersion(data, key)

  if (v > version) {
    throw new MutentError(
      'EMUT_FUTURE_VERSION',
      'Found an entity with a future version',
      { version, data }
    )
  }

  while (v < version) {
    const target = v + 1

    const strategy = strategies[target]

    if (typeof strategy !== 'function') {
      throw new MutentError(
        'EMUT_MISSING_STRATEGY',
        'Missing migration strategy',
        { version: v }
      )
    }

    data = await strategy(data)

    if (getVersion(data, key) !== target) {
      throw new MutentError(
        'EMUT_EXPECTED_UPGRADE',
        'Expected version upgrade',
        { version: v, data }
      )
    }

    v = target
  }

  return data
}
