import core from 'stream'

export { Lazy, Many, One, Value, Values } from './data'
export { Entities, Reducer, insert, find } from './entities'
export { Entity, Mutator, create, read } from './entity'
export { Commit, Driver, Plugin } from './handler'

// TODO: useless
export type AsyncValue<T, O> = (options?: O) => Promise<T>
export type SyncValue<T, O> = (options?: O) => T
export type SyncReadable<O> = (options?: O) => core.Readable
export type SyncArray<T, O> = (options?: O) => T[]
export type AsyncReadable<O> = (options?: O) => Promise<core.Readable>
export type AsyncArray<T, O> = (options?: O) => Promise<T[]>
