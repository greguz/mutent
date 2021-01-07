import { Condition, Mutator, Mutators, Tapper } from './mutators'
import { Result } from './utils'

export declare type MapperWithArguments<T, A extends any[]> = (
  data: T,
  ...args: A
) => Result<T>

export interface Mutation<T, O> {
  update<A extends any[]>(mapper: MapperWithArguments<T, A>, ...args: A): this
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
