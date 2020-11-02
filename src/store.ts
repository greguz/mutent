import fluente from 'fluente'

import { Driver, Reader, filterData, findData, readData } from './driver/index'
import {
  Entities,
  Entity,
  InstanceSettings,
  createEntities,
  createEntity,
  readEntities,
  readEntity
} from './instance'
import {
  JSONSchema7Definition,
  ParseFunction,
  SchemaHandler,
  SchemaHandlerSettings
} from './schema/index'

export interface StoreSettings<T, Q = any, O = any>
  extends InstanceSettings<T, O>,
    SchemaHandlerSettings {
  driver?: Driver<T, Q, O>
  schema?: JSONSchema7Definition
}

export interface Store<T, Q = any, O = any> {
  find(query: Q): Entity<T | null, O>
  read(query: Q): Entity<T, O>
  filter(query: Q): Entities<T, O>
  create<F extends T[] | T>(
    data: F
  ): F extends T[] ? Entities<T, O> : Entity<T, O>
  from<F extends T[] | T>(
    data: F
  ): F extends T[] ? Entities<T, O> : Entity<T, O>
  defineConstructor(key: string, Constructor: Function): this
  defineParser(key: string, parser: ParseFunction): this
}

interface StoreState<T, Q, O> {
  reader: Reader<T, Q, O>
  schema: SchemaHandler | undefined
  settings: InstanceSettings<T, O>
}

function findMethod<T, Q, O>(
  { reader, schema, settings }: StoreState<T, Q, O>,
  query: Q
) {
  return readEntity(
    options => findData(reader, query, options),
    settings,
    schema
  )
}

function readMethod<T, Q, O>(
  { reader, schema, settings }: StoreState<T, Q, O>,
  query: Q
) {
  return readEntity(
    options => readData(reader, query, options),
    settings,
    schema
  )
}

function filterMethod<T, Q, O>(
  { reader, schema, settings }: StoreState<T, Q, O>,
  query: Q
) {
  return readEntities(
    options => filterData(reader, query, options),
    settings,
    schema
  )
}

function createMethod<T, Q, O>(
  { schema, settings }: StoreState<T, Q, O>,
  data: any
): any {
  return Array.isArray(data)
    ? createEntities(data, settings, schema)
    : createEntity(data, settings, schema)
}

function fromMethod<T, Q, O>(
  { schema, settings }: StoreState<T, Q, O>,
  data: any
): any {
  return Array.isArray(data)
    ? readEntities(data, settings, schema)
    : readEntity(data, settings, schema)
}

function updateSchemaHandler<T, Q, O>(
  state: StoreState<T, Q, O>,
  update: (handler: SchemaHandler) => SchemaHandler
): StoreState<T, Q, O> {
  const { schema } = state
  return !schema ? state : { ...state, schema: update(schema) }
}

function defineConstructorMethod<T, Q, O>(
  state: StoreState<T, Q, O>,
  key: string,
  Constructor: Function
): StoreState<T, Q, O> {
  return updateSchemaHandler(state, schemaHandler =>
    schemaHandler.defineConstructor(key, Constructor)
  )
}

function defineParserMethod<T, Q, O>(
  state: StoreState<T, Q, O>,
  key: string,
  parser: ParseFunction
): StoreState<T, Q, O> {
  return updateSchemaHandler(state, schemaHandler =>
    schemaHandler.defineParser(key, parser)
  )
}

export function createStore<T, Q, O>(
  settings: StoreSettings<T, Q, O>
): Store<T, Q, O> {
  const { schema } = settings

  const state: StoreState<T, Q, O> = {
    reader: settings.driver || {},
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
