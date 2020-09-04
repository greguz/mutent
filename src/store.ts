import Ajv from 'ajv'
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
import { Strategies } from './migration'
import { Reader, filterData, findData, readData } from './reader'
import { MutentSchema } from './schema/index'
import { Writer } from './writer'

export interface Driver<T, Q = any, O = any> extends Reader<T, Q, O>, Writer<T, O> {}

export interface StoreSettings<T, Q = any, O = any> extends InstanceSettings<T, O> {
  ajv?: Ajv.Ajv
  driver?: Driver<T, Q, O>
  migration?: Strategies
  schema?: MutentSchema
}

export interface Store<T, Q = any, O = any> {
  find (query: Q): Entity<T | null, O>
  read (query: Q): Entity<T, O>
  filter (query: Q): Entities<T, O>
  create<F extends T[] | T> (data: F): F extends T[] ? Entities<T, O> : Entity<T, O>
  from<F extends T[] | T> (data: F): F extends T[] ? Entities<T, O> : Entity<T, O>
}

interface StoreState<T, Q, O> {
  reader: Reader<T, Q, O>
  settings: StoreSettings<T, Q, O>
  validate: Ajv.ValidateFunction | undefined
}

function findMethod<T, Q, O> (
  { reader, settings }: StoreState<T, Q, O>,
  query: Q
) {
  return readEntity(
    options => findData(reader, query, options),
    settings as StoreSettings<T | null>
  )
}

function readMethod<T, Q, O> (
  { reader, settings }: StoreState<T, Q, O>,
  query: Q
) {
  return readEntity(
    options => readData(reader, query, options),
    settings
  )
}

function filterMethod<T, Q, O> (
  { reader, settings }: StoreState<T, Q, O>,
  query: Q
) {
  return readEntities(
    options => filterData(reader, query, options),
    settings
  )
}

function createMethod<T, Q, O> (
  state: StoreState<T, Q, O>,
  data: any
): any {
  return Array.isArray(data)
    ? createEntities(data, state.settings)
    : createEntity(data, state.settings)
}

function fromMethod<T, Q, O> (
  state: StoreState<T, Q, O>,
  data: any
): any {
  return Array.isArray(data)
    ? readEntities(data, state.settings)
    : readEntity(data, state.settings)
}

function compileSchema (
  settings: StoreSettings<any, any, any>
): Ajv.ValidateFunction | undefined {
  const ajv: Ajv.Ajv = settings.ajv || new Ajv()
  if (settings.schema) {
    return ajv.compile(settings.schema)
  }
}

export function createStore<T, Q, O> (
  settings: StoreSettings<T, Q, O>
): Store<T, Q, O> {
  const state: StoreState<T, Q, O> = {
    reader: settings.driver || {},
    settings,
    validate: settings.validate || compileSchema(settings)
  }
  return fluente({
    historySize: settings.historySize,
    isMutable: settings.classy,
    state,
    fluent: {},
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
