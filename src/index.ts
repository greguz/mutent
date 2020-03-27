import { Readable } from 'stream'

export { Entities, insert, find } from './entities'
export { Entity, Mutator, create, read } from './entity'
export { Commit, Driver, Plugin } from './handler'

// TODO: deprecated
export type AsyncValue<T, O> = (options?: O) => Promise<T>
export type SyncValue<T, O> = (options?: O) => T
export type SyncReadable<O> = (options?: O) => Readable
export type SyncArray<T, O> = (options?: O) => T[]
export type AsyncReadable<O> = (options?: O) => Promise<Readable>
export type AsyncArray<T, O> = (options?: O) => Promise<T[]>
