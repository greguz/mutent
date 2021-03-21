export declare type Lazy<T, A> = T | ((arg: A) => T)

export declare type Result<T> = Promise<T> | T
