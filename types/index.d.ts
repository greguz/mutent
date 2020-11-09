/// <reference types="ajv" />
/// <reference types="node" />
import Ajv from 'ajv'

import { Adapter } from './adapter'
import { Mutation, MutationSettings } from './mutation'
import { Options } from './options'
import { JSONSchema7Definition } from './schema'

export * from './adapter'
export * from './mutation'
export * from './options'
export * from './schema'
export * from './utils'

export declare type Strategy = (data: any) => any

export interface Strategies {
  [version: number]: Strategy | undefined
}

export type Parser = (value: any, ...args: any[]) => any

export interface Parsers {
  [key: string]: Parser
}

export interface Constructors {
  [key: string]: Function
}

export interface Entity<T, O> extends Mutation<T> {
  unwrap(options?: Options<O>): Promise<T>
  iterate(options?: Options<O>): AsyncIterable<T>
}

export interface Entities<T, O> extends Mutation<T> {
  unwrap(options?: Options<O>): Promise<T[]>
  iterate(options?: Options<O>): AsyncIterable<T>
}

export interface StoreSettings<T, Q, O>
  extends EngineSettings,
    MutationSettings {
  adapter: Adapter<T, Q, O>
  engine?: Engine
  manualCommit?: boolean
  migrationStrategies?: Strategies
  prepare?: (data: T, options: Partial<O>) => T | null | undefined | void
  schema?: JSONSchema7Definition
  unsafe?: boolean
  versionKey?: string
}

export interface Store<T, Q, O> {
  create(data: T): Entity<T, O>
  create(data: T[]): Entities<T, O>
  find(query: Q): Entity<T | null, O>
  read(query: Q): Entity<T, O>
  filter(query: Q): Entities<T, O>
  from(data: T): Entity<T, O>
  from(data: T[]): Entities<T, O>
  count(query: Q, options?: Options<O>): Promise<number>
  exists(query: Q, options?: Options<O>): Promise<boolean>
}

export interface EngineSettings {
  ajv?: Ajv.Ajv
  ajvOptions?: Ajv.Options
  constructors?: Constructors
  parsers?: Parsers
}

export interface Engine {
  defineConstructor(key: string, fn: Function): this
  defineParser(key: string, fn: Parser): this
}

export declare function createEngine(settings?: EngineSettings): Engine

export declare function createStore<T, Q, O>(
  settings: StoreSettings<T, Q, O>
): Store<T, Q, O>
