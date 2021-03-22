import { Context } from './context'
import { Status } from './status'
import { Options } from './options'
import { Lazy, Result } from './utils'

export declare type Mutator<T, O> = (
  this: Context<T, O>,
  iterable: AsyncIterable<Status<T>>,
  options: Options<O>
) => AsyncIterable<Status<T>>

export declare type Mutators<T, O> = Array<Mutator<T, O>>

export declare type Condition<T> = Lazy<boolean, T>

export declare function assign<T>(
  ...objects: Array<Partial<T>>
): Mutator<T, any>

export declare function commit(): Mutator<any, any>

export declare function ddelete(): Mutator<any, any>

export declare function filter<T, O>(
  predicate: (data: T, index: number) => boolean
): Mutator<T, O>

export declare function iif<T>(
  condition: Condition<T>,
  whenTrue?: Mutator<T, any>,
  whenFalse?: Mutator<T, any>
): Mutator<T, any>

export declare function pipe<T, O>(...mutators: Mutators<T, O>): Mutator<T, O>

export declare function tap<T>(
  callback: (data: T, index: number) => any
): Mutator<T, any>

export declare function update<T>(
  mapper: (data: T, index: number) => Result<T>
): Mutator<T, any>
