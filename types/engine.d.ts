/// <reference types="ajv" />

import Ajv, { Options as AjvOptions } from 'ajv'

/**
 * JSON schema value parser.
 * @param value the current value present inside the parsed object.
 */
export declare type Parser = (value: any, ...args: any[]) => any

export interface EngineOptions {
  /**
   * Custom AJV instance (v7 only).
   */
  ajv?: Ajv
  /**
   * Custom AJV options (v7 only) used if a custom ajv instance is not specified.
   */
  ajvOptions?: AjvOptions
  /**
   * Constructor functions used by the "instanceof" keyword.
   */
  constructors?: Record<string, Function>
  /**
   * Parse functions used by the "parse" keyword.
   */
  parsers?: Record<string, Parser>
}

export declare class Engine {
  /**
   * Creates a new store.
   */
  static create(options?: EngineOptions): Engine
  /**
   * Configured AJV instance. This instance has "instanceof", "parse", and "constant" keywords configured.
   */
  public ajv: Ajv
  /**
   * @constructor
   */
  constructor(options?: EngineOptions)
  /**
   * Adds new constructor definition (instanceof keyword).
   * @param key Constructor name used inside JSONSchema (instanceof keyword).
   * @param fn Constructor function.
   */
  public defineConstructor(key: string, fn: Function): this
  /**
   * Adds new data parser definition (parse keyword).
   * @param key Parser name used inside JSONSchema (parse keyword).
   * @param fn Parse function.
   */
  public defineParser(key: string, fn: Parser): this
}
