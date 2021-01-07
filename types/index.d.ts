/// <reference types="ajv" />

import Ajv, { Options as AjvOptions } from 'ajv'

import { Adapter } from './adapter'
import { Hooks } from './hooks'
import { Mutation } from './mutation'
import { Options } from './options'
import { JSONSchema7Definition } from './schema'

export * from './adapter'
export * from './mutation'
export * from './mutators'
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

export interface Entity<T, O> extends Mutation<T, O> {
  unwrap(options?: Options<O>): Promise<T>
  iterate(options?: Options<O>): AsyncIterable<T>
}

export interface Entities<T, O> extends Mutation<T, O> {
  unwrap(options?: Options<O>): Promise<T[]>
  iterate(options?: Options<O>): AsyncIterable<T>
}

export interface StoreSettings<T, Q, O> extends EngineSettings {
  adapter: Adapter<T, Q, O>
  engine?: Engine
  historySize?: number
  hooks?: Hooks<T, Q, O>
  manualCommit?: boolean
  migrationStrategies?: Strategies
  mutable?: boolean
  name: string
  schema?: JSONSchema7Definition
  unsafe?: boolean
  version?: number
  versionKey?: string
}

export interface Store<T, Q, O> {
  name: string
  version: number
  create(data: T): Entity<T, O>
  create(data: Iterable<T> | AsyncIterable<T>): Entities<T, O>
  find(query: Q): Entity<T | null, O>
  read(query: Q): Entity<T, O>
  filter(query: Q): Entities<T, O>
  from(data: T): Entity<T, O>
  from(data: Iterable<T> | AsyncIterable<T>): Entities<T, O>
}

export interface EngineSettings {
  ajv?: Ajv
  ajvOptions?: AjvOptions
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
