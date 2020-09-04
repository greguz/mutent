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

function resolveKey (fncs: ParseFunctions, key: string): ParseFunction {
  const fnc = fncs[key]
  if (!fnc) {
    throw new Herry('EMUT_EXPECTED_PARSER', 'Expected parse function', { key })
  }
  return fnc
}

function bindFunction (fnc: ParseFunction, ...args: any[]): ParseFunction {
  return args.length > 0
    ? value => fnc(value, ...args)
    : fnc
}

function handleArray (fncs: ParseFunctions, parse: ParseArray): ParseFunction {
  return bindFunction(
    resolveKey(fncs, parse[0]),
    parse.slice(1)
  )
}

function handleObject (fncs: ParseFunctions, parse: ParseObject): ParseFunction {
  const key = Object.keys(parse)[0]
  return bindFunction(
    resolveKey(fncs, key),
    parse[key]
  )
}

function getParseFunction (fncs: ParseFunctions, parse: Parse): ParseFunction {
  if (typeof parse === 'function') {
    return parse
  } else if (typeof parse === 'string') {
    return resolveKey(fncs, parse)
  } else if (Array.isArray(parse)) {
    return handleArray(fncs, parse)
  } else {
    return handleObject(fncs, parse)
  }
}

export function parseValue (
  value: any,
  parse: Parse,
  fncs: ParseFunctions = {}
): any {
  return getParseFunction(fncs, parse)(value)
}
