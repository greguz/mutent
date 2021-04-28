import { Mutator } from './mutators'
import { UnwrapOptions } from './options'
import { Lazy, Result } from './utils'

export interface Mutation<T, O, U = unknown> {
  /**
   * Runs Object.assign() against all entities.
   * @param objects
   */
  assign(...objects: Array<Partial<T>>): Mutation<T, O, U>
  /**
   * Commits (writes) all necessary entities.
   */
  commit(): Mutation<T, O, U>
  /**
   * Applies configured mutators to the targeted entities and returns a Promise that will resolve to the number of handled entities.
   */
  consume(options?: UnwrapOptions<O>): Promise<number>
  /**
   * Deletes all entities.
   */
  delete(): Mutation<T, O, U>
  /**
   * Ignores the entities that don't satisfy the predicate.
   * @param predicate A function that accepts the current entity and its index. If it returns true, the current entity is kept.
   */
  filter(predicate: (data: T, index: number) => boolean): Mutation<T, O, U>
  /**
   * Applies a mutator conditionally.
   * @param condition Can be a boolean or a function that accepts the current entity.
   * @param whenTrue Mutator applied when the condition is satisfied.
   * @param whenFalse Mutator applied when the condition is not satisfied.
   */
  if(
    condition: Lazy<boolean, T>,
    whenTrue?: Mutator<T, O>,
    whenFalse?: Mutator<T, O>
  ): Mutation<T, O, U>
  /**
   * Applies configured mutators to the targeted entities and returns an entities (async) iterable.
   * @param options Adapter specific options.
   */
  iterate(options?: UnwrapOptions<O>): AsyncIterable<T>
  /**
   * Adds mutators to the current ones and returns a new Mutation instance.
   * @param mutators Mutators chain.
   */
  pipe(...mutators: Array<Mutator<T, O>>): Mutation<T, O, U>
  /**
   * Performs a side-effect against all entities.
   * @param callback A function that accepts the current entity and its index. Promises are supported.
   */
  tap(callback: (data: T, index: number) => any): Mutation<T, O, U>
  /**
   * Applies configured mutators to the targeted entities and returns a Promise containing the result.
   * @param options Adapter specific options.
   */
  unwrap(options?: UnwrapOptions<O>): Promise<U>
  /**
   * Updates entities.
   * @param mapper A function that accepts the current entity and its index. Must return a new object representing the updated entity. Promises are supported.
   */
  update(mapper: (data: T, index: number) => Result<T>): Mutation<T, O, U>
}

/**
 * This mutations's unwrap may result in an entity.
 */
export declare type MutationNullable<T, O> = Mutation<T, O, T | null>

/**
 * This mutation's unwrap will always result in an entity.
 */
export declare type MutationSingle<T, O> = Mutation<T, O, T>

/**
 * This mutation's unwrap will result in an array of entities.
 */
export declare type MutationMultiple<T, O> = Mutation<T, O, T[]>
