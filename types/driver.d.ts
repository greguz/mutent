import { Result } from './utils'

export declare type Value<T> = T | Promise<T>

export declare type Values<T> = Iterable<T> | AsyncIterable<T>

export declare type DriverResult<T> = Result<T | null | undefined | void>

export interface Driver<T, Q, O> {
  /**
   * Fetch one entity
   */
  find?(
    query: Q,
    options: Partial<O>,
    isRequired: boolean
  ): Value<T | null | undefined>
  /**
   * Fetch multiple entities
   */
  filter?(query: Q, options: Partial<O>): Values<T>
  /**
   * Create a new entity
   */
  create?(data: T, options: Partial<O>): DriverResult<T>
  /**
   * Update an entity
   */
  update?(oldData: T, newData: T, options: Partial<O>): DriverResult<T>
  /**
   * Delete an entity
   */
  delete?(data: T, options: Partial<O>): DriverResult<T>
  /**
   * Count requested entities
   */
  count?(query: Q, options: Partial<O>): Promise<number>
  /**
   * Check entity existence
   */
  exists?(query: Q, options: Partial<O>): Promise<boolean>
}
