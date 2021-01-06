import { MutentError } from './error'

function isValid(version) {
  return Number.isInteger(version) && version >= 0
}

export function createMigration(version, strategies = {}, key = 'version') {
  if (!isValid(version)) {
    throw new MutentError('EMUT_VERSION_INVALID', 'Invalid version', {
      version
    })
  }
  return {
    key,
    strategies,
    version
  }
}

function getVersion(data, key) {
  const version = data[key] === undefined ? 0 : data[key]
  if (!isValid(version)) {
    throw new MutentError(
      'EMUT_MIGRATION_UNKNOWN',
      'Unable to read entity version',
      { version, data }
    )
  }
  return version
}

export async function migrateData({ key, strategies, version }, data) {
  let v = getVersion(data, key)

  if (v > version) {
    throw new MutentError(
      'EMUT_MIGRATION_FUTURE',
      'Found an entity with a future version',
      { version, data }
    )
  }

  while (v < version) {
    const target = v + 1

    const strategy = strategies[target]

    if (typeof strategy !== 'function') {
      throw new MutentError(
        'EMUT_MIGRATION_ABSENT',
        'Target migration strategy absent',
        { version: v }
      )
    }

    data = await strategy.call(strategies, data)

    if (getVersion(data, key) !== target) {
      throw new MutentError(
        'EMUT_MIGRATION_UPGRADE',
        'Migrated version mismatch',
        { version: v, data }
      )
    }

    v = target
  }

  return data
}
