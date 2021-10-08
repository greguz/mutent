import { UnwrapOptions } from './options'
import { Nullish, Result } from './utils'

export interface Adapter<T, Q, O> {
  /**
   * Retrieves one entity from the database that matches the query. It can be synchronous or asynchronous (Promise).
   * @param {*} query Adapter-specific filter query.
   * @param {Object} options Adapter-specific options.
   */
  find(query: Q, options: UnwrapOptions<O>): Result<T | Nullish>
  /**
   * Retrieves all entities from the database that match the query. Must return an iterable (or async iterable) object.
   * @param {*} query Adapter-specific filter query.
   * @param {Object} options Adapter-specific options.
   */
  filter(query: Q, options: UnwrapOptions<O>): Iterable<T> | AsyncIterable<T>
  /**
   * Creates a new entity inside the database. It can return the just-created entity data. Both sync and async (Promise) methods are supported.
   * @param {*} data Entity data to insert.
   * @param {Object} options Adapter-specific options.
   */
  create(data: T, options: UnwrapOptions<O>): Result<T | Nullish>
  /**
   * Updates an existing entity inside the database. It can return the just-updated entity data. Both sync and async (Promise) methods are supported.
   * @param {*} oldData Original entity data retrieved from the database.
   * @param {*} newData Updated entity data after all actions are applied.
   * @param {Object} options Adapter-specific options.
   */
  update(oldData: T, newData: T, options: UnwrapOptions<O>): Result<T | Nullish>
  /**
   * It removes an existing entity inside from its database. Both sync and async (Promise) methods are supported.
   * @param {*} data Original entity data retrieved from the database.
   * @param {Object} options Adapter-specific options.
   */
  delete(data: T, options: UnwrapOptions<O>): any
  /**
   * It performs a collection of write actions against the database.
   * @param {Object[]} actions
   * @param {Object} options Adapter-specific options.
   */
  bulk?(
    actions: Array<BulkAction<T>>,
    options: UnwrapOptions<O>
  ): Result<Record<number, T> | Record<string, T> | Nullish>
}

/**
 * Bulk action descriptor.
 */
export declare type BulkAction<T> =
  | BulkActionCreate<T>
  | BulkActionUpdate<T>
  | BulkActionDelete<T>

/**
 * Represents an entity creation intent.
 */
export interface BulkActionCreate<T> {
  /**
   * Action type.
   */
  type: 'CREATE'
  /**
   * Entity data to insert.
   */
  data: T
}

/**
 * Represents an entity-update intent.
 */
export interface BulkActionUpdate<T> {
  /**
   * Action type.
   */
  type: 'UPDATE'
  /**
   * Original entity data retrieved from the database.
   */
  oldData: T
  /**
   * Updated entity data after all actions are applied.
   */
  newData: T
}

/**
 * Represents an entity deletion intent.
 */
export interface BulkActionDelete<T> {
  /**
   * Action type.
   */
  type: 'DELETE'
  /**
   * Original entity data retrieved from the database.
   */
  data: T
}
