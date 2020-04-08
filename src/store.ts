import { Value, Values } from './data'
import { Entities, find, insert } from './entities'
import { Entity, create, read } from './entity'
import { Driver } from './handler'
import { assignOptions } from './options'

export interface Plugin<T, Q = any, O = any> extends Driver<T, O> {
  get (query: Q, options?: O): Value<T | null>
  find? (query: Q, options?: O): Values<T>
  missing? (query: Q, options?: O): any
}

export interface Store<T, Q = any, O = any> {
  get (query: Q): Entity<T | null, O>
  read (query: Q): Entity<T, O>
  create (data: T): Entity<T, O>
  find (query: Q): Entities<T, O>
  insert (data: T[]): Entities<T, O>
  from<F> (data: F): F extends T[] ? Entities<T, O> : Entity<T, O>
}

async function readEntity<T, Q, O> (
  plugin: Plugin<T, Q, O>,
  query: Q,
  options?: O
): Promise<T> {
  const data = await plugin.get(query, options)
  if (data === null) {
    if (plugin.missing) {
      throw plugin.missing(query, options)
    } else {
      throw new Error('Not found')
    }
  }
  return data
}

function fromData (
  plugin: Plugin<any, any, any>,
  data: any
): any {
  return Array.isArray(data)
    ? find(data, plugin)
    : read(data, plugin)
}

export function createStore<T, Q, O> (
  plugin: Plugin<T, Q, O>
): Store<T, Q, O> {
  const fnFind = plugin.find || (() => [])
  return {
    get: query => read(
      options => plugin.get(query, assignOptions(plugin.options, options)),
      plugin
    ),
    read: query => read(
      options => readEntity(plugin, query, assignOptions(plugin.options, options)),
      plugin
    ),
    find: query => find(
      options => fnFind(query, assignOptions(plugin.options, options)),
      plugin
    ),
    create: value => create(value, plugin),
    insert: values => insert(values, plugin),
    from: data => fromData(plugin, data)
  }
}
