import { Context } from './context'
import { Status } from './status'
import { UnwrapOptions } from './options'
import { Lazy, Result } from './utils'

/**
 * A function that takes a status (async) iterable as input, and returns a new status (async) iterable.
 */
export declare type Mutator<T, O> = (
  this: Context<T, O>,
  iterable: AsyncIterable<Status<T>>,
  options: UnwrapOptions<O>
) => AsyncIterable<Status<T>>

/**
 * Runs Object.assign() against all entities.
 * @param objects
 */
export declare function assign<T>(
  ...objects: Array<Partial<T>>
): Mutator<T, any>

/**
 * Commits (writes) all necessary entities.
 */
export declare function commit(): Mutator<any, any>

/**
 * Deletes all entities.
 */
export declare function ddelete(): Mutator<any, any>

/**
 * Ignores the entities that don't satisfy the predicate.
 * @param predicate A function that accepts the current entity and its index. If it returns true, the current entity is kept.
 */
export declare function filter<T, O>(
  predicate: (data: T, index: number) => boolean
): Mutator<T, O>

/**
 * Applies a mutator conditionally.
 * @param condition Can be a boolean or a function that accepts the current entity.
 * @param whenTrue Mutator applied when the condition is satisfied.
 * @param whenFalse Mutator applied when the condition is not satisfied.
 */
export declare function iif<T, O>(
  condition: Lazy<boolean, T>,
  whenTrue?: Mutator<T, O>,
  whenFalse?: Mutator<T, O>
): Mutator<T, O>

/**
 * Reduces multiple mutators into a single one.
 * @param mutators Mutators chain to reduce.
 */
export declare function pipe<T, O>(
  ...mutators: Array<Mutator<T, O>>
): Mutator<T, O>

/**
 * Performs a side-effect against all entities.
 * @param callback A function that accepts the current entity and its index. Promises are supported.
 */
export declare function tap<T>(
  callback: (data: T, index: number) => any
): Mutator<T, any>

/**
 * Updates entities.
 * @param mapper A function that accepts the current entity and its index. Must return a new object representing the updated entity. Promises are supported.
 */
export declare function update<T>(
  mapper: (data: T, index: number) => Result<T>
): Mutator<T, any>
