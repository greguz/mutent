import {
  Context,
  createContext,
  readContext,
  assignContext,
  commitContext,
  deleteContext,
  lockContext,
  unwrapContext,
  updateContext
} from './context'
import { Source, createReader } from './read'
import { Commit, createWriter } from './write'

export type Mutator<T, U, A extends any[]> = (data: T, ...args: A) => U | Promise<U>

export interface Entity<T, O> {
  update<U, A extends any[]>(mutator: Mutator<T, U, A>, ...args: A): Entity<U, O>
  assign<E>(object: E): Entity<T & E, O>
  delete(): Entity<null, O>
  commit(): Entity<T, O>,
  unwrap(options?: O): Promise<T>
}

function wrapContext<S, T, O> (ctx: Context<S, T, O>): Entity<T, O> {
  return {
    update: (mutator, ...args) => wrapContext(updateContext(lockContext(ctx), mutator, args)),
    assign: object => wrapContext(assignContext(lockContext(ctx), object)),
    delete: () => wrapContext(deleteContext(lockContext(ctx))),
    commit: () => wrapContext(commitContext(lockContext(ctx))),
    unwrap: options => unwrapContext(lockContext(ctx), options)
  }
}

export function create<T, O> (
  source: Source<T, O>,
  commit?: Commit<O>
): Entity<T, O> {
  return wrapContext(createContext(createReader(source), createWriter(commit)))
}

export function read<T, O> (
  source: Source<T, O>,
  commit?: Commit<O>
): Entity<T, O> {
  return wrapContext(readContext(createReader(source), createWriter(commit)))
}
