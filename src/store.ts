import { Value, Values } from './data'
import { Entities, createEntities, readEntities } from './entities'
import { Entity, Settings, createEntity, readEntity } from './entity'
import { UnknownEntityError } from './errors'
import { isNull, isUndefined } from './utils'

export interface Reader<T, Q = any, O = any> {
  find? (query: Q, options: Partial<O>): Value<T | null | undefined>
  filter? (query: Q, options: Partial<O>): Values<T>
  Error?: (query: Q, options: Partial<O>) => any
}

export interface Plugin<T, Q = any, O = any> extends Settings<T, O> {
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
      : new UnknownEntityError(query, options)
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
  plugin: Plugin<T, Q, O>,
  data: T[] | T
): any {
  return Array.isArray(data)
    ? readEntities(data, plugin)
    : readEntity(data, plugin)
}

function createMethod<T, Q, O> (
  plugin: Plugin<T, Q, O>,
  data: T[] | T
): any {
  return Array.isArray(data)
    ? createEntities(data, plugin)
    : createEntity(data, plugin)
}

export function createStore<T, Q, O> (
  plugin: Plugin<T, Q, O>
): Store<T, Q, O> {
  const reader = plugin.reader || {}
  return {
    find: query => readEntity(
      options => findData(reader, query, options),
      plugin
    ),
    read: query => readEntity(
      options => readData(reader, query, options),
      plugin
    ),
    filter: query => readEntities(
      options => filterData(reader, query, options),
      plugin
    ),
    create: data => createMethod(plugin, data),
    from: data => fromData(plugin, data)
  }
}
