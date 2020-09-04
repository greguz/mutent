import Ajv from 'ajv'

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

function createMethod<T, Q, O> (
  data: any,
  settings: StoreSettings<T, Q, O>
): any {
  return Array.isArray(data)
    ? createEntities(data, settings)
    : createEntity(data, settings)
}

function fromMethod<T, Q, O> (
  data: any,
  settings: StoreSettings<T, Q, O>
): any {
  return Array.isArray(data)
    ? readEntities(data, settings)
    : readEntity(data, settings)
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
  const reader = settings.driver || {}
  if (!settings.validate) {
    settings.validate = compileSchema(settings)
  }
  return {
    find: query => readEntity(
      options => findData(reader, query, options),
      settings as StoreSettings<T | null>
    ),
    read: query => readEntity(
      options => readData(reader, query, options),
      settings
    ),
    filter: query => readEntities(
      options => filterData(reader, query, options),
      settings
    ),
    create: data => createMethod(data, settings),
    from: data => fromMethod(data, settings)
  }
}
