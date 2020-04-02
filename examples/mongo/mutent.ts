import {
  Collection,
  CommonOptions,
  FilterQuery,
  ObjectId,
  ReadPreferenceOrMode
} from 'mongodb'

import uniq from 'lodash/uniq'
import isPlainObject from 'lodash/isPlainObject'
import set from 'lodash/set'

import * as mutent from '../..'

export type Filter<T> =
  | undefined
  | string
  | ObjectId
  | Array<string | ObjectId>
  | FilterQuery<T>

export interface WrappedCollection<T> {
  collection: Collection<T>
  fineOne(filter?: Filter<T>): mutent.Entity<T, Options>
  findMany(filter?: Filter<T>): mutent.Entities<T, Options>
  insertOne(data: T): mutent.Entity<T, Options>
  insertMany(data: T[]): mutent.Entities<T, Options>
}

export interface Options extends CommonOptions {
  readPreference?: ReadPreferenceOrMode
  sort?: any[] | object
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

function parseFilter (filter: any = {}): FilterQuery<any> {
  if (ObjectId.isValid(filter)) {
    return {
      _id: new ObjectId(filter)
    }
  } else if (isPlainObject(filter)) {
    return filter
  } else if (Array.isArray(filter)) {
    return {
      _id: {
        $in: filter.map(item => new ObjectId(item))
      }
    }
  } else {
    throw new Error('Invalid filter')
  }
}

async function commit (
  collection: Collection,
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

function createDriver (collection: Collection): mutent.Driver<any, Options> {
  return {
    async create (target, options = {}) {
      await collection.insertOne(target, options)
    },
    async update (source, target, options = {}) {
      await collection.updateOne(
        { _id: source._id },
        buildUpdateQuery(source, target),
        options
      )
    },
    async delete (source, options = {}) {
      await collection.deleteOne({ _id: source._id }, options)
    }
  }
}

function findOne<T> (collection: Collection<T>, filter?: Filter<T>) {
  return mutent.read<T, Options>(
    options => collection.findOne(parseFilter(filter), options),
    createDriver(collection)
  )
}

function findMany<T> (collection: Collection<T>, filter?: Filter<T>) {
  return mutent.find<T, Options>(
    options => collection.find(parseFilter(filter), options),
    createDriver(collection)
  )
}

function insertOne<T> (collection: Collection<T>, data: T) {
  return mutent.create<T, Options>(data, createDriver(collection))
}

function insertMany<T> (collection: Collection<T>, data: T[]) {
  return mutent.insert<T, Options>(data, createDriver(collection))
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
