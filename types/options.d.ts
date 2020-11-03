export interface MutentOptions {
  concurrency?: number
  highWaterMark?: number
  manualCommit?: boolean
  unsafe?: boolean
}

export declare type Options<O> = MutentOptions & Partial<O>
