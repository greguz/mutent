import { Collection } from 'mongodb'
import { Entities, Entity } from '../..'

import {
  Filter,
  Options,
  findMany,
  findOne,
  insertMany,
  insertOne
} from './mutent'

export interface WrappedCollection<T> {
  collection: Collection<T>
  fineOne(filter: Filter<T>): Entity<T, Options>
  findMany(filter: Filter<T>): Entities<T, Options>
  insertOne(data: T): Entity<T, Options>
  insertMany(data: T[]): Entities<T, Options>
}

export function wrapCollection<T> (
  collection: Collection<T>
): WrappedCollection<T> {
  return {
    collection,
    fineOne: filter => findOne(collection, filter),
    findMany: filter => findMany(collection, filter),
    insertOne: data => insertOne(collection, data),
    insertMany: data => insertMany(collection, data),
  }
}
