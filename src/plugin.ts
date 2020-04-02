import { Value, Values } from './data'
import { Entities, find, insert } from './entities'
import { Entity, Mutator, create, read } from './entity'
import { Driver } from './handler'

export interface Plugin<T, D, Q, O = any> {
  get (query: Q, options?: O): Value<T | null>
  find (query: Q, options?: O): Values<T>
  create (target: T, options?: O): Promise<T | void>
  update (source: T, target: T, options?: O): Promise<T | void>
  delete (source: T, options?: O): Promise<T | void>
  prepare (data: D): T
  missing (query: Q): any
}

export interface PluginInstance<T, D, Q, O = any> {
  get (query: Q): Entity<T | null, O>
  read (query: Q): Entity<T, O>
  find (query: Q): Entities<T, O>
  create (data: D): Entity<T, O>
  insert (data: D[]): Entities<T, O>
  from (data: T[]): Entities<T, O>
  from (data: T): Entity<T, O>
}

async function readEntity<T, Q, O> (
  plugin: Plugin<T, any, Q, O>,
  query: Q,
  options?: O
): Promise<T> {
  const data = await plugin.get(query, options)
  if (data === null) {
    throw plugin.missing(query)
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

export function buildPlugin<T, D, Q, O = any> (
  plugin: Plugin<T, D, Q, O>
): PluginInstance<T, D, Q, O> {
  return {
    get: query => read(options => plugin.get(query, options), plugin),
    read: query => read(options => readEntity(plugin, query, options)),
    find: query => find(options => plugin.find(query, options), plugin),
    create: data => create(() => plugin.prepare(data), plugin),
    insert: data => insert(() => data.map(plugin.prepare), plugin),
    from: (data: T[] | T) => fromData(data, plugin),
  }
}

export async function tryTo<T, A extends any[]> (
  data: T | null,
  mutator: Mutator<T, A>,
  ...args: A
): Promise<T | null> {
  if (data === null) {
    return data
  } else {
    return mutator(data, ...args)
  }
}
