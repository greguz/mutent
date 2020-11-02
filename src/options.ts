export interface MutentOptions {
  autoCommit?: boolean
  concurrency?: number
  highWaterMark?: number
  safe?: boolean
}

export type Options<O> = MutentOptions & Partial<O>

/**
 * @deprecated
 */
export type UnwrapOptions<O = {}> = Options<O>

/**
 * @deprecated
 */
export type StreamOptions<O = {}> = Options<O>
