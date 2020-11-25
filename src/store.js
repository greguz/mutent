import { createDriver } from './driver'
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

function createInstanceHook(hooks = {}) {
  const fn = hooks.onData
  if (typeof fn === 'function') {
    return fn.bind(hooks)
  }
}

export function createStore(settings) {
  const {
    adapter,
    historySize,
    hooks,
    manualCommit,
    migrationStrategies,
    mutable,
    name,
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
    driver,
    historySize,
    hook: createInstanceHook(hooks),
    manualCommit,
    migration: migrationStrategies
      ? createMigration(migrationStrategies, versionKey)
      : undefined,
    mutable,
    store: name,
    unsafe,
    validate: compileSchema(settings)
  }

  return {
    create(data) {
      return createInstance(intentCreate(data), instanceSettings)
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
