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
  return null
}

const validModes = ['AUTO', 'SAFE', 'MANUAL']

export function createStore(storeSettings) {
  const {
    adapter,
    historySize,
    hooks = {},
    migrationStrategies,
    mode = 'AUTO',
    mutable,
    name,
    version = null,
    versionKey
  } = storeSettings

  if (!name) {
    throw new Error('Store name is required')
  }
  if (!adapter) {
    throw new Error('Adapter is required')
  }
  if (!validModes.includes(mode)) {
    throw new Error('Invalid mode')
  }
  if (version !== null && (!Number.isInteger(version) || version < 0)) {
    throw new Error('Invalid version')
  }

  const instanceSettings = {
    context: {
      adapter,
      hooks,
      mode,
      store: name,
      validate: compileSchema(storeSettings),
      version
    },
    historySize,
    migration:
      version !== null
        ? createMigration(version, migrationStrategies, versionKey)
        : null,
    mutable
  }

  return {
    name,
    version,
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
