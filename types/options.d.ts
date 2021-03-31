/**
 * Mutation commit mode.
 * - AUTO: Automatically commit all pending changes.
 * - SAFE: Throw an error for any non-committed changes.
 * - MANUAL: Disable all checks, handle committing manually.
 */
export declare type CommitMode = 'AUTO' | 'MANUAL' | 'SAFE'

/**
 * Adapter write mode.
 * - AUTO: Choose the appropriate write mode from the current context.
 * - SEQUENTIAL: Simple sequential adapter write (uses one of adapter #create, #update, #delete method).
 * - BULK: Bulk adapter writes (uses adapter #bulk method).
 */
export declare type WriteMode = 'AUTO' | 'BULK' | 'SEQUENTIAL'

/**
 * Namespaced mutent options.
 */
export interface MutentOptions {
  /**
   * Override store commit mode.
   */
  commitMode?: CommitMode
  /**
   * Disable all schema-related checks.
   */
  ignoreSchema?: boolean
  /**
   * Override store write mode.
   */
  writeMode?: WriteMode
  /**
   * Override store write size.
   */
  writeSize?: number
}

/**
 * Unwrap (or iterate) options. Adapter-specific options.
 */
export declare type UnwrapOptions<O> = { mutent?: MutentOptions } & Partial<O>
