import { MutentError } from './error'

function isValidVersion(value) {
  return Number.isInteger(value) && value >= 0
}

function getEntityVersion({ intent, store, versionKey }, data) {
  if (typeof data !== 'object' || data === null) {
    throw new MutentError(
      'EMUT_UNVERSIONABLE_ENTITY',
      'Current entity cannot be versioned',
      {
        data,
        intent,
        store
      }
    )
  }
  const version = data[versionKey] || 0
  if (!isValidVersion(version)) {
    throw new MutentError(
      'EMUT_INVALID_ENTITY_VERSION',
      'Current entity has an invalid version',
      {
        data,
        intent,
        store,
        versionKey
      }
    )
  }
  return version
}

export async function migrate(context, data) {
  let version = getEntityVersion(context, data)

  if (version > context.version) {
    throw new MutentError(
      'EMUT_FUTURE_ENTITY',
      'Current entity has a future version',
      {
        data,
        intent: context.intent,
        store: context.store,
        version: context.version
      }
    )
  }

  while (version < context.version) {
    version++

    const strategy = context.migrationStrategies[version]

    if (strategy === undefined) {
      throw new MutentError(
        'EMUT_EXPECTED_STRATEGY',
        `Expected migration strategy #${version}`,
        {
          store: context.store,
          version
        }
      )
    }
    if (typeof strategy !== 'function') {
      throw new MutentError(
        'EMUT_INVALID_STRATEGY',
        `Migration strategy #${version} not a function`,
        {
          store: context.store,
          version
        }
      )
    }

    data = await strategy(data)

    if (getEntityVersion(context, data) !== version) {
      throw new MutentError(
        'EMUT_INVALID_UPGRADE',
        `Migration strategy #${version} upgrade version mismatch`,
        {
          data,
          store: context.store,
          version
        }
      )
    }
  }

  return data
}

export async function* mutatorMigrate(iterable) {
  for await (const status of iterable) {
    // Do not change other status flags, so this status will be "unmodified" (will not trigger auto-commit check)
    yield {
      ...status,
      target: await migrate(this, status.target)
    }
  }
}
