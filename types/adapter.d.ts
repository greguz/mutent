import { Result } from './utils'

export declare type Value<T> = T | Promise<T>

export declare type Values<T> = Iterable<T> | AsyncIterable<T>

export declare type WriteResult<T> = Result<T | null | undefined | void>

export interface Adapter<T, Q, O> {
  /**
   * Fetch one entity
   */
  find?(query: Q, options: Partial<O>): Value<T | null | undefined>
  /**
   * Fetch multiple entities
   */
  filter?(query: Q, options: Partial<O>): Values<T>
  /**
   * Create a new entity
   */
  create?(data: T, options: Partial<O>): WriteResult<T>
  /**
   * Update an entity
   */
  update?(oldData: T, newData: T, options: Partial<O>): WriteResult<T>
  /**
   * Delete an entity
   */
  delete?(data: T, options: Partial<O>): WriteResult<T>
}
