import Herry from 'herry'

import { Value, Values } from './data'
import { Entities, Entity, InstanceSettings, createEntities, createEntity, readEntities, readEntity } from './instance'
import { isNull, isUndefined } from './utils'

export interface Reader<T, Q = any, O = any> {
  find? (query: Q, options: Partial<O>): Value<T | null | undefined>
  filter? (query: Q, options: Partial<O>): Values<T>
  Error?: (query: Q, options: Partial<O>) => any
}

export interface StoreSettings<T, Q = any, O = any> extends InstanceSettings<T, O> {
  reader?: Reader<T, Q, O>
}

export interface Store<T, Q = any, O = any> {
  find (query: Q): Entity<T | null, O>
  read (query: Q): Entity<T, O>
  filter (query: Q): Entities<T, O>
  create<F extends T[] | T> (data: F): F extends T[] ? Entities<T, O> : Entity<T, O>
  from<F extends T[] | T> (data: F): F extends T[] ? Entities<T, O> : Entity<T, O>
}

async function findData<T, Q, O> (
  reader: Reader<T, Q, O>,
  query: Q,
  options: Partial<O>
): Promise<T | null> {
  if (!reader.find) {
    return null
  }
  const data = await reader.find(query, options)
  return isUndefined(data) ? null : data
}

async function readData<T, Q, O> (
  reader: Reader<T, Q, O>,
  query: Q,
  options: Partial<O>
): Promise<T> {
  const data = await findData(reader, query, options)
  if (isNull(data)) {
    throw typeof reader.Error === 'function'
      ? reader.Error(query, options)
      : new Herry('EMUT_NOT_FOUND', 'Entity not found', { query, options })
  }
  return data
}

function filterData<T, Q, O> (
  reader: Reader<T, Q, O>,
  query: Q,
  options: Partial<O>
) {
  return !reader.filter
    ? []
    : reader.filter(query, options)
}

function fromData<T, Q, O> (
  settings: StoreSettings<T, Q, O>,
  data: T[] | T
): any {
  return Array.isArray(data)
    ? readEntities(data, settings)
    : readEntity(data, settings)
}

function createMethod<T, Q, O> (
  settings: StoreSettings<T, Q, O>,
  data: T[] | T
): any {
  return Array.isArray(data)
    ? createEntities(data, settings)
    : createEntity(data, settings)
}

export function createStore<T, Q, O> (
  settings: StoreSettings<T, Q, O>
): Store<T, Q, O> {
  const reader = settings.reader || {}
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
    create: data => createMethod(settings, data),
    from: data => fromData(settings, data)
  }
}
