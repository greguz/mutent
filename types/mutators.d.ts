import { Status } from './status'
import { Options } from './options'
import { Result } from './utils'

export interface Context<T, O> {
  write(status: Status<T>, options: Options<O>): Promise<Status<T>>
}

export declare type Mutator<T, O> = (
  this: Context<T, O>,
  status: Status<T>,
  options: Options<O>
) => Result<Status<T>>

export declare type Mutators<T, O> = Array<Mutator<T, O>>

export declare type Lazy<T, A> = ((arg: A) => T) | T

export declare type Condition<T> = Lazy<boolean, T>

export declare type Mapper<T, A extends any[] = []> = (
  data: T,
  ...args: A
) => Result<T>

export declare type Tapper<T> = (data: T) => Result<any>

export declare function ddelete(): Mutator<any, any>

export declare function commit(): Mutator<any, any>

export declare function iif<T>(
  condition: Condition<T>,
  mutator: Mutator<T, any>
): Mutator<T, any>

export declare function unless<T>(
  condition: Condition<T>,
  mutator: Mutator<T, any>
): Mutator<T, any>

export declare function update<T>(mapper: Mapper<T>): Mutator<T, any>

export declare function tap<T>(tapper: Tapper<T>): Mutator<T, any>

export declare function assign<T>(object: Partial<T>): Mutator<T, any>

export declare function pipe<T, O>(...mutators: Mutators<T, O>): Mutator<T, O>
