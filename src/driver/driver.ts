import { Reader } from './reader'
import { Writer } from './writer'

export interface Driver<T, Q = any, O = any>
  extends Reader<T, Q, O>,
    Writer<T, O> {}
