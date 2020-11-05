import {
  driverCount,
  driverExists,
  intentCreate,
  intentFilter,
  intentFind,
  intentFrom,
  intentRead
} from './driver/reader'
import { createInstance } from './instance'
import { createEngine } from './engine'

function compileSchema(settings) {
  let { engine, schema } = settings
  if (schema) {
    engine = engine || createEngine(settings)
    return engine.compile(schema)
  }
}

export function createStore(settings) {
  const { driver } = settings
  if (!driver) {
    throw new Error('Expected driver')
  }

  const schema = compileSchema(settings)

  return {
    count(query, options = {}) {
      return driverCount(driver, query, options)
    },
    create(data) {
      return createInstance(intentCreate(data), settings, schema)
    },
    exists(query, options = {}) {
      return driverExists(driver, query, options)
    },
    find(query) {
      return createInstance(intentFind(query), settings, schema)
    },
    read(query) {
      return createInstance(intentRead(query), settings, schema)
    },
    filter(query) {
      return createInstance(intentFilter(query), settings, schema)
    },
    from(data) {
      return createInstance(intentFrom(data), settings, schema)
    }
  }
}
