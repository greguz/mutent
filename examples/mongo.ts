import { Collection, FilterQuery, ObjectId, ClientSession } from 'mongodb'

import uniq from 'lodash/uniq'
import isPlainObject from 'lodash/isPlainObject'
import set from 'lodash/set'

import * as mutent from '../index'

interface Item {
  path: string[];
  oldValue: any;
  newValue: any;
}

function compareDocs (oldDoc: any, newDoc: any) {
  const keys = uniq(Object.keys(oldDoc).concat(Object.keys(newDoc)))
  const items: Item[] = []

  for (const key of keys) {
    const oldValue = oldDoc[key]
    const newValue = newDoc[key]

    if (isPlainObject(oldValue) && isPlainObject(newValue)) {
      items.push(
        ...compareDocs(oldValue, newValue).map(item => ({
          ...item,
          path: [key, ...item.path]
        }))
      )
    } else {
      items.push({
        path: [key],
        oldValue,
        newValue
      })
    }
  }

  return items
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

export interface Options {
  session?: ClientSession;
  sort?: object;
}

async function commit (
  collection: Collection<any>,
  source: any,
  target: any,
  options: Options = {}
) {
  const { session } = options

  if (source === null) {
    await collection.insertOne(target, { session })
  } else if (target === null) {
    await collection.deleteOne({ _id: source._id }, { session })
  } else {
    await collection.updateOne(
      { _id: source._id },
      buildUpdateQuery(source, target),
      { session }
    )
  }
}

function bind (collection: Collection<any>): mutent.Commit<Options> {
  return (source, target, options) =>
    commit(collection, source, target, options)
}

export function create<T> (collection: Collection<any>, data: T) {
  return mutent.create(data, bind(collection))
}

export async function read<T> (
  collection: Collection<T>,
  filter: string | ObjectId | FilterQuery<T>,
  options: Options = {}
) {
  const { session, sort } = options
  const data = await collection.findOne(parseFilter(filter), { session, sort })
  return data ? mutent.read(data, bind(collection)) : null
}
