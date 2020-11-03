/// <reference types="node" />

export declare type Result<T> = Promise<T> | T

export declare type Lazy<T, A> = ((arg: A) => T) | T
