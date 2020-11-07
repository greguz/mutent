import {
  Driver,
  intentCreate,
  intentFilter,
  intentFind,
  intentFrom,
  intentRead
} from './driver'
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
    manualCommit,
    migrationStrategies,
    prepare,
    unsafe,
    versionKey
  } = settings

  const driver = new Driver(adapter)

  const instanceSettings = {
    classy,
    driver,
    historySize,
    manualCommit,
    migration: migrationStrategies
      ? createMigration(migrationStrategies, versionKey)
      : undefined,
    prepare,
    schema: compileSchema(settings),
    unsafe
  }

  return {
    count(query, options = {}) {
      return driver.count(query, options)
    },
    create(data) {
      return createInstance(intentCreate(data), instanceSettings)
    },
    exists(query, options = {}) {
      return driver.exists(query, options)
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
