import { adapterCount, adapterExists } from './adapter'
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
    manualCommit,
    migrationStrategies,
    prepare,
    unsafe,
    versionKey
  } = settings

  if (!adapter) {
    throw new Error('Expected adapter')
  }

  const instanceSettings = {
    adapter,
    classy,
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
      return adapterCount(adapter, query, options)
    },
    create(data) {
      return createInstance(intentCreate(data), instanceSettings)
    },
    exists(query, options = {}) {
      return adapterExists(adapter, query, options)
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
