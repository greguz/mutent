import { Result } from './utils'

export declare type Value<T> = T | Promise<T>

export declare type Values<T> = Iterable<T> | AsyncIterable<T>

export declare type AdapterResult<T> = Result<T | null | undefined | void>

export interface Adapter<T, Q, O> {
  /**
   * Used to identify this adapter
   */
  signature?: any
  /**
   * Fetch one entity
   */
  find?(
    query: Q,
    options: Partial<O>,
    required: boolean
  ): Value<T | null | undefined>
  /**
   * Fetch multiple entities
   */
  filter?(query: Q, options: Partial<O>): Values<T>
  /**
   * Create a new entity
   */
  create?(data: T, options: Partial<O>): AdapterResult<T>
  /**
   * Update an entity
   */
  update?(oldData: T, newData: T, options: Partial<O>): AdapterResult<T>
  /**
   * Delete an entity
   */
  delete?(data: T, options: Partial<O>): AdapterResult<T>
  /**
   * Count requested entities
   */
  count?(query: Q, options: Partial<O>): Result<number>
  /**
   * Check entity existence
   */
  exists?(query: Q, options: Partial<O>): Result<boolean>
}
