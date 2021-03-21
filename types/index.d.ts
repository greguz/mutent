/// <reference types="ajv" />

import Ajv, { Options as AjvOptions } from 'ajv'

import { Adapter } from './adapter'
import { Hooks } from './hooks'
import { Condition, Mutator, Mutators } from './mutators'
import { Options } from './options'
import { JSONSchema7Definition } from './schema'
import { Lazy, Result } from './utils'

export * from './adapter'
export * from './mutators'
export * from './options'
export * from './schema'
export * from './utils'

export declare type Strategy = (data: any) => any

export interface Strategies {
  [version: number]: Strategy | undefined
}

export declare type Parser = (value: any, ...args: any[]) => any

export interface Parsers {
  [key: string]: Parser
}

export interface Constructors {
  [key: string]: Function
}

export interface Instance<T, O> {
  update(mapper: (data: T, index: number) => Result<T>): this
  assign(...objects: Array<Partial<T>>): this
  delete(): this
  commit(): this
  if(
    condition: Condition<T>,
    whenTrue?: Mutator<T, O>,
    whenFalse?: Mutator<T, O>
  ): this
  tap(callback: (data: T, index: number) => any): this
  pipe(...mutators: Mutators<T, O>): this
  filter(predicate: (data: T, index: number) => boolean): this
  undo(steps?: number): this
  redo(steps?: number): this
  iterate(options?: Options<O>): AsyncIterable<T>
  unwrap(options?: Options<O>): Promise<unknown>
}

export interface NullableEntity<T, O> extends Instance<T, O> {
  unwrap(options?: Options<O>): Promise<T | null>
}

export interface Entity<T, O> extends Instance<T, O> {
  unwrap(options?: Options<O>): Promise<T>
}

export interface Entities<T, O> extends Instance<T, O> {
  unwrap(options?: Options<O>): Promise<T[]>
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

export declare type One<T, O> = Lazy<T | Promise<T>, Options<O>>

export declare type Many<T, O> = Lazy<
  Iterable<T> | AsyncIterable<T>,
  Options<O>
>

export interface Store<T, Q, O> {
  name: string
  version: number
  create(one: One<T, O>): Entity<T, O>
  create(many: Many<T, O>): Entities<T, O>
  find(query: Q): NullableEntity<T, O>
  read(query: Q): Entity<T, O>
  filter(query: Q): Entities<T, O>
  from(one: One<T, O>): Entity<T, O>
  from(many: Many<T, O>): Entities<T, O>
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
