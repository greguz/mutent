import { Status } from './status'
import { Options } from './options'
import { Result } from './utils'

export declare type Lazy<T, A> = ((arg: A) => T) | T

export declare type Mutator<T, O> = (
  status: Status<T>,
  options: Options<O>
) => Result<Status<T>>

export declare type Mutators<T, O> = Array<Mutator<T, O>>

export declare type Condition<T> = Lazy<boolean, T>

export declare type Mapper<T, A extends any[]> = (
  data: T,
  ...args: A
) => Result<T>

export declare type Tapper<T> = (data: T) => Result<any>

export interface Mutation<T, O> {
  update<A extends any[]>(mutator: Mapper<T, A>, ...args: A): this
  assign(object: Partial<T>): this
  delete(): this
  commit(): this
  if(condition: Condition<T>, mutator: Mutator<T, O>): this
  unless(condition: Condition<T>, mutator: Mutator<T, O>): this
  tap(tapper: Tapper<T>): this
  pipe(...mutators: Mutators<T, O>): this
  undo(steps?: number): this
  redo(steps?: number): this
}
