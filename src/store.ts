import fluente from 'fluente'

import {
  Entities,
  Entity,
  InstanceSettings,
  createEntities,
  createEntity,
  readEntities,
  readEntity
} from './instance'
import { Reader, filterData, findData, readData } from './reader'
import {
  MutentSchema,
  ParseFunction,
  SchemaHandler,
  SchemaHandlerSettings
} from './schema/index'
import { Writer } from './writer'

export interface Driver<T, Q = any, O = any>
  extends Reader<T, Q, O>,
    Writer<T, O> {}

export interface StoreSettings<T, Q = any, O = any>
  extends InstanceSettings<T, O>,
    SchemaHandlerSettings {
  driver?: Driver<T, Q, O>
  schema?: MutentSchema
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
  settings: InstanceSettings<T, O>
}

function findMethod<T, Q, O>(
  { reader, settings }: StoreState<T, Q, O>,
  query: Q
) {
  return readEntity(options => findData(reader, query, options), settings)
}

function readMethod<T, Q, O>(
  { reader, settings }: StoreState<T, Q, O>,
  query: Q
) {
  return readEntity(options => readData(reader, query, options), settings)
}

function filterMethod<T, Q, O>(
  { reader, settings }: StoreState<T, Q, O>,
  query: Q
) {
  return readEntities(options => filterData(reader, query, options), settings)
}

function createMethod<T, Q, O>(state: StoreState<T, Q, O>, data: any): any {
  return Array.isArray(data)
    ? createEntities(data, state.settings)
    : createEntity(data, state.settings)
}

function fromMethod<T, Q, O>(state: StoreState<T, Q, O>, data: any): any {
  return Array.isArray(data)
    ? readEntities(data, state.settings)
    : readEntity(data, state.settings)
}

function updateSchemaHandler<T, Q, O>(
  state: StoreState<T, Q, O>,
  update: (handler: SchemaHandler) => SchemaHandler
): StoreState<T, Q, O> {
  const { settings } = state
  const { schemaHandler } = settings
  return {
    ...state,
    settings: {
      ...settings,
      schemaHandler: schemaHandler ? update(schemaHandler) : schemaHandler
    }
  }
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
    settings: {
      ...settings,
      schemaHandler: schema ? new SchemaHandler(schema, settings) : undefined
    }
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
