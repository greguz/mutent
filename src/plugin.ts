import { Value, Values } from './data'
import { Entities, find, insert } from './entities'
import { Entity, create, read } from './entity'
import { Driver } from './handler'

export interface PluginInstance<T, Q = any, O = any> {
  get (query: Q): Entity<T | null, O>
  read (query: Q): Entity<T, O>
  find (query: Q): Entities<T, O>
  create (data: T): Entity<T, O>
  insert (data: T[]): Entities<T, O>
  from (data: T[]): Entities<T, O>
  from (data: T): Entity<T, O>
}

export interface Plugin<T, Q = any, O = any> {
  get (query: Q, options?: O): Value<T | null>
  find (query: Q, options?: O): Values<T>
  create (target: T, options?: O): Promise<T | void>
  update (source: T, target: T, options?: O): Promise<T | void>
  delete (source: T, options?: O): Promise<T | void>
  missing? (query: Q, options?: O): any
}

function defaultMissing () {
  return new Error('Entity not found')
}

async function readEntity<T, Q, O> (
  plugin: Plugin<T, Q, O>,
  query: Q,
  options?: O
): Promise<T> {
  const data = await plugin.get(query, options)
  if (data === null) {
    throw (plugin.missing || defaultMissing)(query, options)
  }
  return data
}

function fromData<T, O> (
  data: T[] | T,
  driver: Driver<T, O>
): any {
  return Array.isArray(data)
    ? find(data, driver)
    : read(data, driver)
}

export function buildPlugin<T, Q, O> (
  plugin: Plugin<T, Q, O>
): PluginInstance<T, Q, O> {
  return {
    get: query => read(options => plugin.get(query, options), plugin),
    read: query => read(options => readEntity(plugin, query, options)),
    find: query => find(options => plugin.find(query, options), plugin),
    create: value => create(value, plugin),
    insert: values => insert(values, plugin),
    from: (data: T[] | T) => fromData(data, plugin),
  }
}
