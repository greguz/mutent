import { filterData, findData, readData } from './driver/reader'
import {
  createEntities,
  createEntity,
  readEntities,
  readEntity
} from './instance'
import { createEngine } from './schema/engine'

function compileSchema(settings) {
  let { engine, schema } = settings
  if (schema) {
    engine = engine || createEngine(settings)
    return engine.compile(schema)
  }
}

export function createStore(settings) {
  const reader = settings.driver || {}
  const schema = compileSchema(settings)

  return {
    create(data) {
      return Array.isArray(data)
        ? createEntities(data, settings, schema)
        : createEntity(data, settings, schema)
    },
    find(query) {
      return readEntity(
        options => findData(reader, query, options),
        settings,
        schema
      )
    },
    read(query) {
      return readEntity(
        options => readData(reader, query, options),
        settings,
        schema
      )
    },
    filter(query) {
      return readEntities(
        options => filterData(reader, query, options),
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
