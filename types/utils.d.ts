/**
 * An optionally lazy declaration of a value
 */
export declare type Lazy<T, A> = T | ((arg: A) => T)

/**
 * A nullish value (plus "void" because TS is a special baby)
 */
export type Nullish = null | undefined | void

/**
 * An optionally Promise-wrapped value
 */
export declare type Result<T> = T | Promise<T>
