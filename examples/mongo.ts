import { Collection, FilterQuery, ObjectId, CommonOptions } from 'mongodb'

import uniq from 'lodash/uniq'
import isPlainObject from 'lodash/isPlainObject'
import set from 'lodash/set'

import * as mutent from '..'

export type Filter<T> = string | ObjectId | FilterQuery<T>

export interface Options extends CommonOptions {
  sort?: any;
}

interface Field {
  path: string[];
  oldValue: any;
  newValue: any;
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

function parseFilter (filter: any): any {
  if (filter && ObjectId.isValid(filter)) {
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

export function insertOne<T> (collection: Collection<any>, data: T) {
  return mutent.create(data, bind(collection))
}

export function findOne<T> (collection: Collection<T>, filter: Filter<T>) {
  return mutent.read(
    options => collection.findOne(parseFilter(filter), options),
    bind(collection)
  )
}

export function insertMany<T> (collection: Collection<T>, data: T[]) {
  return mutent.insert(data, bind(collection))
}

export function findMany<T> (collection: Collection<T>, filter: Filter<T>) {
  return mutent.find<T, Options>(
    collection.find(parseFilter(filter)),
    bind(collection)
  )
}
