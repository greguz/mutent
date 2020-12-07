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

export function createStore(storeSettings) {
  const {
    adapter,
    historySize,
    hooks,
    manualCommit,
    migrationStrategies,
    mutable,
    name,
    unsafe,
    version,
    versionKey
  } = storeSettings

  if (typeof name !== 'string' || name === '') {
    throw new Error('Invalid store name')
  }
  if (!adapter) {
    throw new Error('Specify adapter')
  }
  if (version === undefined && migrationStrategies !== undefined) {
    throw new Error('Specify target version')
  }

  const validate = compileSchema(storeSettings)

  const driver = createDriver(adapter, hooks, validate)

  const instanceSettings = {
    driver,
    historySize,
    hook: createInstanceHook(hooks),
    manualCommit,
    migration:
      version !== undefined
        ? createMigration(version, migrationStrategies, versionKey)
        : undefined,
    mutable,
    store: name,
    unsafe,
    validate
  }

  return {
    name,
    version: version || 0,
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
