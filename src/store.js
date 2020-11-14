import { createDriver, count, exists } from './driver'
import {
  intentCreate,
  intentFilter,
  intentFind,
  intentFrom,
  intentRead
} from './intent'
import { createEngine } from './engine'
import { createInstance } from './instance'
import { createMigration } from './migration'

function compileSchema(settings) {
  let { engine, schema } = settings
  if (schema) {
    engine = engine || createEngine(settings)
    return engine.compile(schema)
  }
}

export function createStore(settings) {
  const {
    adapter,
    classy,
    historySize,
    hooks,
    manualCommit,
    migrationStrategies,
    name,
    prepare,
    unsafe,
    versionKey
  } = settings

  if (typeof name !== 'string' || name === '') {
    throw new Error('Expected valid store name')
  }
  if (!adapter) {
    throw new Error('Expected adapter')
  }

  const driver = createDriver(adapter, hooks)

  const instanceSettings = {
    classy,
    driver,
    historySize,
    manualCommit,
    migration: migrationStrategies
      ? createMigration(migrationStrategies, versionKey)
      : undefined,
    prepare,
    store: name,
    unsafe,
    validate: compileSchema(settings)
  }

  return {
    count(query, options = {}) {
      return count(driver, query, options)
    },
    create(data) {
      return createInstance(intentCreate(data), instanceSettings)
    },
    exists(query, options = {}) {
      return exists(driver, query, options)
    },
    find(query) {
      return createInstance(intentFind(query), instanceSettings)
    },
    read(query) {
      return createInstance(intentRead(query), instanceSettings)
    },
    filter(query) {
      return createInstance(intentFilter(query), instanceSettings)
    },
    from(data) {
      return createInstance(intentFrom(data), instanceSettings)
    }
  }
}
