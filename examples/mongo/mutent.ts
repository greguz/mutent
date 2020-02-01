import { Collection, FilterQuery, ObjectId, CommonOptions } from 'mongodb'

import uniq from 'lodash/uniq'
import isPlainObject from 'lodash/isPlainObject'
import set from 'lodash/set'

import * as mutent from '../..'

export type Filter<T> = undefined | string | ObjectId | FilterQuery<T>

export interface WrappedCollection<T> {
  collection: Collection<T>
  fineOne(filter?: Filter<T>): mutent.Entity<T, Options>
  findMany(filter?: Filter<T>): mutent.Entities<T, Options>
  insertOne(data: T): mutent.Entity<T, Options>
  insertMany(data: T[]): mutent.Entities<T, Options>
}

export interface Options extends CommonOptions {
  sort?: any
}

interface Field {
  path: string[]
  oldValue: any
  newValue: any
}

function compareDocs (oldDoc: any, newDoc: any) {
  const keys = uniq(Object.keys(oldDoc).concat(Object.keys(newDoc)))
  const fields: Field[] = []

  for (const key of keys) {
    const oldValue = oldDoc[key]
    const newValue = newDoc[key]

    if (isPlainObject(oldValue) && isPlainObject(newValue)) {
      fields.push(
        ...compareDocs(oldValue, newValue).map(field => ({
          ...field,
          path: [key, ...field.path]
        }))
      )
    } else {
      fields.push({
        path: [key],
        oldValue,
        newValue
      })
    }
  }

  return fields
}

function buildUpdateQuery (oldDoc: any, newDoc: any): any {
  return compareDocs(oldDoc, newDoc).reduce<any>(
    (query, { path, oldValue, newValue }) => {
      if (path[0] !== '_id' && oldValue !== newValue) {
        if (newValue === undefined) {
          set(query, ['$unset', path.join('.')], '')
        } else {
          set(query, ['$set', path.join('.')], newValue)
        }
      }
      return query
    },
    {}
  )
}

function parseFilter (filter: any = {}): any {
  if (ObjectId.isValid(filter)) {
    return { _id: new ObjectId(filter) }
  } else if (isPlainObject(filter)) {
    return filter
  } else {
    throw new Error('Invalid filter')
  }
}

async function commit (
  collection: Collection<any>,
  source: any,
  target: any,
  options?: Options
) {
  if (source === null) {
    await collection.insertOne(target, options)
  } else if (target === null) {
    await collection.deleteOne({ _id: source._id }, options)
  } else {
    await collection.updateOne(
      { _id: source._id },
      buildUpdateQuery(source, target),
      options
    )
  }
}

function bind (collection: Collection<any>): mutent.Commit<Options> {
  return (s, t, o) => commit(collection, s, t, o)
}

function insertOne<T> (collection: Collection<T>, data: T) {
  return mutent.create(data, bind(collection))
}

function findOne<T> (collection: Collection<T>, filter?: Filter<T>) {
  return mutent.read(
    options => collection.findOne(parseFilter(filter), options),
    bind(collection)
  )
}

function insertMany<T> (collection: Collection<T>, data: T[]) {
  return mutent.insert(data, bind(collection))
}

function findMany<T> (collection: Collection<T>, filter?: Filter<T>) {
  return mutent.find<T, Options>(
    options => collection.find(parseFilter(filter), options),
    bind(collection)
  )
}

export function wrapCollection<T> (
  collection: Collection<T>
): WrappedCollection<T> {
  return {
    collection,
    fineOne: filter => findOne(collection, filter),
    findMany: filter => findMany(collection, filter),
    insertOne: data => insertOne(collection, data),
    insertMany: data => insertMany(collection, data)
  }
}
