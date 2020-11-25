export interface MutentOptions {
  manualCommit?: boolean
  unsafe?: boolean
}

export declare type Options<O> = { mutent?: MutentOptions } & Partial<O>
