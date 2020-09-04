import Herry from 'herry'

export type ParseFunction = (value: any, ...args: any[]) => any

export type ParseString = string

export type ParseArray = [string, ...any[]]

export interface ParseObject {
  [key: string]: any[]
}

export type Parse = ParseFunction | ParseString | ParseArray | ParseObject

export interface ParseFunctions {
  [key: string]: ParseFunction | undefined
}

function bindFunction (fn: ParseFunction, ...args: any[]): ParseFunction {
  return args.length > 0
    ? value => fn(value, ...args)
    : fn
}

function resolveKey (functions: ParseFunctions, key: string): ParseFunction {
  const fn = functions[key]
  if (!fn) {
    throw new Herry('EMUT_EXPECTED_PARSER', 'Expected parse function', { key })
  }
  return fn
}

function handleArray (
  functions: ParseFunctions,
  parse: ParseArray
): ParseFunction {
  return bindFunction(
    resolveKey(functions, parse[0]),
    parse.slice(1)
  )
}

function handleObject (
  functions: ParseFunctions,
  parse: ParseObject
): ParseFunction {
  const key = Object.keys(parse)[0]
  return bindFunction(
    resolveKey(functions, key),
    parse[key]
  )
}

function getParseFunction (
  functions: ParseFunctions,
  parse: Parse
): ParseFunction {
  if (typeof parse === 'function') {
    return parse
  } else if (typeof parse === 'string') {
    return resolveKey(functions, parse)
  } else if (Array.isArray(parse)) {
    return handleArray(functions, parse)
  } else {
    return handleObject(functions, parse)
  }
}

export function parseValue (
  value: any,
  parse: Parse,
  functions: ParseFunctions = {}
): any {
  return getParseFunction(functions, parse)(value)
}
