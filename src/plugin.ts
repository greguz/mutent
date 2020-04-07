import { Value, Values } from './data'
import { Entities, find, insert } from './entities'
import { Entity, create, read } from './entity'
import { Driver } from './handler'

export interface Plugin<T, Q = any, O = any> {
  get (query: Q): Entity<T | null, O>
  read (query: Q): Entity<T, O>
  find (query: Q): Entities<T, O>
  create (data: T): Entity<T, O>
  insert (data: T[]): Entities<T, O>
  from<F> (data: F): F extends T[] ? Entities<T, O> : Entity<T, O>
}

export interface Definition<T, Q = any, O = any> extends Required<Driver<T, O>> {
  get (query: Q, options?: O): Value<T | null>
  find (query: Q, options?: O): Values<T>
  missing? (query: Q, options?: O): any
}

function defaultMissing () {
  return new Error('Entity not found')
}

async function readEntity<T, Q, O> (
  definition: Definition<T, Q, O>,
  query: Q,
  options?: O
): Promise<T> {
  const data = await definition.get(query, options)
  if (data === null) {
    throw (definition.missing || defaultMissing)(query, options)
  }
  return data
}

function fromData (
  data: any,
  driver: Driver<any, any>
): any {
  return Array.isArray(data)
    ? find(data, driver)
    : read(data, driver)
}

export function createPlugin<T, Q, O> (
  definition: Definition<T, Q, O>
): Plugin<T, Q, O> {
  return {
    get: query => read(options => definition.get(query, options), definition),
    read: query => read(options => readEntity(definition, query, options), definition),
    find: query => find(options => definition.find(query, options), definition),
    create: value => create(value, definition),
    insert: values => insert(values, definition),
    from: data => fromData(data, definition)
  }
}
