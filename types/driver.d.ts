/// <reference types="node" />
import stream from 'stream'

import { Result } from './utils'

export declare type Value<T> = Promise<T> | T

export declare type Values<T> = Iterable<T> | AsyncIterable<T> | stream.Readable

export interface Reader<T, Q, O> {
  find?(
    query: Q,
    options: Partial<O>,
    isRequired: boolean
  ): Value<T | null | undefined>
  filter?(query: Q, options: Partial<O>): Values<T>
}

export declare type WriteResult<T> = Result<T | null | undefined | void>

export interface Writer<T, O> {
  create?(data: T, options: Partial<O>): WriteResult<T>
  update?(oldData: T, newData: T, options: Partial<O>): WriteResult<T>
  delete?(data: T, options: Partial<O>): WriteResult<T>
}

export interface Driver<T, Q, O> extends Reader<T, Q, O>, Writer<T, O> {}
