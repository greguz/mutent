export interface MutentOptions {
  /**
   *
   */
  mode?: 'AUTO' | 'SAFE' | 'MANUAL'
}

export declare type Options<O> = { mutent?: MutentOptions } & Partial<O>
