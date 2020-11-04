import {
  countData,
  existsData,
  filterData,
  findData,
  readData
} from './driver/reader'
import {
  createEntities,
  createEntity,
  readEntities,
  readEntity
} from './instance'
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
      return countData(driver, query, options)
    },
    create(data) {
      return Array.isArray(data)
        ? createEntities(data, settings, schema)
        : createEntity(data, settings, schema)
    },
    exists(query, options = {}) {
      return existsData(driver, query, options)
    },
    find(query) {
      return readEntity(
        options => findData(driver, query, options),
        settings,
        schema
      )
    },
    read(query) {
      return readEntity(
        options => readData(driver, query, options),
        settings,
        schema
      )
    },
    filter(query) {
      return readEntities(
        options => filterData(driver, query, options),
        settings,
        schema
      )
    },
    from(data) {
      return Array.isArray(data)
        ? readEntities(data, settings, schema)
        : readEntity(data, settings, schema)
    }
  }
}
