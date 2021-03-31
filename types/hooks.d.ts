import { BulkAction } from './adapter'
import { UnwrapOptions } from './options'

/**
 * Current mutation's intent.
 * - CREATE: This mutation was generated from the store#create method.
 * - FIND: This mutation was generated from the store#find method.
 * - READ: This mutation was generated from the store#read method.
 * - FILTER: This mutation was generated from the store#filter method.
 * - FROM: This mutation was generated from the store#from method.
 */
export declare type Intent = 'CREATE' | 'FIND' | 'READ' | 'FILTER' | 'FROM'

export interface Hooks<T, Q, O> {
  /**
   * Synchronously triggered during FIND intents.
   * @param query Store method argument.
   * @param options Unwrap options.
   */
  onFind?(query: Q, options: UnwrapOptions<O>): any
  /**
   * Synchronously triggered during FILTER intents.
   * @param query Store method argument.
   * @param options Unwrap options.
   */
  onFilter?(query: Q, options: UnwrapOptions<O>): any
  /**
   * Triggered when the entity is first loaded. Can return a Promise.
   * @param intent Current intent.
   * @param data Entity data.
   * @param options Unwrap options.
   */
  onData?(intent: Intent, data: T, options: UnwrapOptions<O>): any
  /**
   * Triggered before any adapter#create() method call. Can return a Promise.
   * @param data Entity data to insert.
   * @param options Unwrap options.
   */
  beforeCreate?(data: T, options: UnwrapOptions<O>): any
  /**
   * Triggered before any adapter#update() method call. Can return a Promise.
   * @param oldData Original entity data retrieved from the database.
   * @param newData Updated entity data after all actions are applied.
   * @param options Unwrap options.
   */
  beforeUpdate?(oldData: T, newData: T, options: UnwrapOptions<O>): any
  /**
   * Triggered before any adapter#delete() method call. Can return a Promise.
   * @param data Original entity data retrieved from the database.
   * @param options Unwrap options.
   */
  beforeDelete?(data: T, options: UnwrapOptions<O>): any
  /**
   * Triggered after any adapter#create() method call. Can return a Promise.
   * @param data Entity data to insert.
   * @param options Unwrap options.
   */
  afterCreate?(data: T, options: UnwrapOptions<O>): any
  /**
   * Triggered after any adapter#update() method call. Can return a Promise.
   * @param oldData Original entity data retrieved from the database.
   * @param newData Updated entity data after all actions are applied.
   * @param options Unwrap options.
   */
  afterUpdate?(oldData: T, newData: T, options: UnwrapOptions<O>): any
  /**
   * Triggered after any adapter#delete() method call. Can return a Promise.
   * @param data Original entity data retrieved from the database.
   * @param options Unwrap options.
   */
  afterDelete?(data: T, options: UnwrapOptions<O>): any
  /**
   * Triggered before any adapter#bulk() method call. Can return a Promise.
   * @param actions
   * @param options Unwrap options.
   */
  beforeBulk?(actions: Array<BulkAction<T>>, options: UnwrapOptions<O>): any
  /**
   * Triggered before any adapter#bulk() method call. Can return a Promise.
   * @param actions
   * @param options Unwrap options.
   */
  afterBulk?(actions: Array<BulkAction<T>>, options: UnwrapOptions<O>): any
}
