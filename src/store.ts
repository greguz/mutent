import { Value, Values } from './data'
import { Entities, findEntities, insertEntities } from './entities'
import { Entity, Settings, createEntity, readEntity } from './entity'
import { isNull, isUndefined } from './utils'

export interface Plugin<T, Q = any, O = any> extends Settings<T, O> {
  get (query: Q, options: Partial<O>): Value<T | null | undefined>
  find? (query: Q, options: Partial<O>): Values<T>
  missing? (query: Q, options: Partial<O>): any
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
  plugin: Plugin<T, Q, O>,
  query: Q,
  options: Partial<O>
): Promise<T | null> {
  const data = await plugin.get(query, options)
  return isUndefined(data) ? null : data
}

async function readData<T, Q, O> (
  plugin: Plugin<T, Q, O>,
  query: Q,
  options: Partial<O>
): Promise<T> {
  const data = await getData(plugin, query, options)
  if (isNull(data)) {
    if (plugin.missing) {
      throw plugin.missing(query, options)
    } else {
      throw new Error('Not found')
    }
  }
  return data
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
  const findData = plugin.find || (() => [])
  return {
    get: query => readEntity(
      options => getData(plugin, query, options),
      plugin
    ),
    read: query => readEntity(
      options => readData(plugin, query, options),
      plugin
    ),
    find: query => findEntities(
      options => findData(query, options),
      plugin
    ),
    create: value => createEntity(value, plugin),
    insert: values => insertEntities(values, plugin),
    from: data => fromData(plugin, data)
  }
}
