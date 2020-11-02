import fluente from 'fluente'

import { filterData, findData, readData } from './driver/reader'
import {
  createEntities,
  createEntity,
  readEntities,
  readEntity
} from './instance'
import { SchemaHandler } from './schema/handler'

function findMethod({ reader, schema, settings }, query) {
  return readEntity(
    options => findData(reader, query, options),
    settings,
    schema
  )
}

function readMethod({ reader, schema, settings }, query) {
  return readEntity(
    options => readData(reader, query, options),
    settings,
    schema
  )
}

function filterMethod({ reader, schema, settings }, query) {
  return readEntities(
    options => filterData(reader, query, options),
    settings,
    schema
  )
}

function createMethod({ schema, settings }, data) {
  return Array.isArray(data)
    ? createEntities(data, settings, schema)
    : createEntity(data, settings, schema)
}

function fromMethod({ schema, settings }, data) {
  return Array.isArray(data)
    ? readEntities(data, settings, schema)
    : readEntity(data, settings, schema)
}

function updateSchemaHandler(state, update) {
  const { schema } = state
  return !schema ? state : { ...state, schema: update(schema) }
}

function defineConstructorMethod(state, key, Constructor) {
  return updateSchemaHandler(state, schemaHandler =>
    schemaHandler.defineConstructor(key, Constructor)
  )
}

function defineParserMethod(state, key, parser) {
  return updateSchemaHandler(state, schemaHandler =>
    schemaHandler.defineParser(key, parser)
  )
}

export function createStore(settings) {
  const { driver, schema } = settings

  const state = {
    reader: driver || {},
    schema: schema ? new SchemaHandler(schema, settings) : undefined,
    settings
  }

  return fluente({
    historySize: settings.historySize,
    isMutable: settings.classy,
    state,
    fluent: {
      defineConstructor: defineConstructorMethod,
      defineParser: defineParserMethod
    },
    methods: {
      find: findMethod,
      read: readMethod,
      filter: filterMethod,
      create: createMethod,
      from: fromMethod
    },
    constants: {}
  })
}
