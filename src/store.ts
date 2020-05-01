import { Value, Values } from './data'
import { Entities, findEntities, insertEntities } from './entities'
import { Entity, Settings, createEntity, readEntity } from './entity'
import { UnknownEntityError } from './errors'
import { isNull, isUndefined } from './utils'

export interface Reader<T, Q = any, O = any> {
  get? (query: Q, options: Partial<O>): Value<T | null | undefined>
  find? (query: Q, options: Partial<O>): Values<T>
  Error?: new (query: Q, options: Partial<O>) => Error
}

export interface Plugin<T, Q = any, O = any> extends Settings<T, O> {
  reader?: Reader<T, Q, O>
}

export interface Store<T, Q = any, O = any> {
  get (query: Q): Entity<T | null, O>
  read (query: Q): Entity<T, O>
  create (data: T): Entity<T, O>
  find (query: Q): Entities<T, O>
  insert (data: T[]): Entities<T, O>
  from<F extends T[] | T> (data: F): F extends T[] ? Entities<T, O> : Entity<T, O>
}

async function getData<T, Q, O> (
  reader: Reader<T, Q, O>,
  query: Q,
  options: Partial<O>
): Promise<T | null> {
  if (!reader.get) {
    return null
  }
  const data = await reader.get(query, options)
  return isUndefined(data) ? null : data
}

async function readData<T, Q, O> (
  reader: Reader<T, Q, O>,
  query: Q,
  options: Partial<O>
): Promise<T> {
  const data = await getData(reader, query, options)
  if (isNull(data)) {
    throw reader.Error
      ? new reader.Error(query, options)
      : new UnknownEntityError(query, options)
  }
  return data
}

function findData<T, Q, O> (
  reader: Reader<T, Q, O>,
  query: Q,
  options: Partial<O>
) {
  return !reader.find
    ? []
    : reader.find(query, options)
}

function fromData<T, Q, O> (
  plugin: Plugin<T, Q, O>,
  data: T[] | T
): any {
  return Array.isArray(data)
    ? findEntities(data, plugin)
    : readEntity(data, plugin)
}

export function createStore<T, Q, O> (
  plugin: Plugin<T, Q, O>
): Store<T, Q, O> {
  const reader = plugin.reader || {}
  return {
    get: query => readEntity(
      options => getData(reader, query, options),
      plugin
    ),
    read: query => readEntity(
      options => readData(reader, query, options),
      plugin
    ),
    find: query => findEntities(
      options => findData(reader, query, options),
      plugin
    ),
    create: value => createEntity(value, plugin),
    insert: values => insertEntities(values, plugin),
    from: data => fromData(plugin, data)
  }
}
