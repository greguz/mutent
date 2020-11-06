import {
  driverCount,
  driverExists,
  intentCreate,
  intentFilter,
  intentFind,
  intentFrom,
  intentRead
} from './driver/reader'
import { createEngine } from './engine'
import { createInstance } from './instance'
import { Migration } from './migration'

function compileSchema(settings) {
  let { engine, schema } = settings
  if (schema) {
    engine = engine || createEngine(settings)
    return engine.compile(schema)
  }
}

function createMigration({ migrationStrategies, versionKey }) {
  if (migrationStrategies) {
    return new Migration(migrationStrategies, versionKey)
  }
}

export function createStore(settings) {
  const { driver } = settings
  if (!driver) {
    throw new Error('Expected driver')
  }

  const instanceSettings = {
    classy: settings.classy,
    driver,
    historySize: settings.historySize,
    manualCommit: settings.manualCommit,
    migration: createMigration(settings),
    prepare: settings.prepare,
    schema: compileSchema(settings),
    unsafe: settings.unsafe
  }

  return {
    count(query, options = {}) {
      return driverCount(driver, query, options)
    },
    create(data) {
      return createInstance(intentCreate(data), instanceSettings)
    },
    exists(query, options = {}) {
      return driverExists(driver, query, options)
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
