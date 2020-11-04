export interface MutentOptions {
  manualCommit?: boolean
  unsafe?: boolean
}

export declare type Options<O> = MutentOptions & Partial<O>
