/**
 * Lazy value definition with optional argument.
 */
export declare type Lazy<T, A = undefined> = T | ((arg: A) => T);

/**
 * A nullish value (plus "void" because TS is a special baby).
 */
export declare type Nullish = null | undefined | void;

/**
 * The value itself or Promise-wrapped.
 */
export declare type Result<T> = T | Promise<T>;

/**
 * Single raw value or multiple values inside an array.
 */
export declare type OneOrMore<T> = T | Array<T>;

/**
 * Custom error (usable by plugins).
 */
export declare class MutentError extends Error {
  /**
   * @constructor
   * @param code Error identifier. All CAPS words and underscores.
   * @param message Human readable message.
   * @param info Detailed info object.
   */
  constructor(code?: string, message?: string, info?: any);
  /**
   * Custom JSON serialization function.
   */
  toJSON(): { error: string; message: string; info: any };
}

/**
 * Represents an entity.
 */
export declare class Entity<T> {
  /**
   * Declares a new entity that should be created inside the persistence layer.
   */
  static create<X>(data: X): Entity<X>;
  /**
   * Declares an entity that is already persisted.
   */
  static read<X>(data: X): Entity<X>;
  /**
   * Contains the entity's data fetched from the persistence layer. A null value indicates that this entity is new.
   */
  source: T | null;
  /**
   * Contains the last version of the entity after all mutations are applied.
   */
  target: T;
  /**
   * Status flag.
   */
  created: boolean;
  /**
   * Status flag.
   */
  updated: boolean;
  /**
   * Status flag.
   */
  deleted: boolean;
  /**
   * Returns true when this entity needs to be created inside the persistence layer.
   */
  get shouldCreate(): boolean;
  /**
   * Returns true when this entity needs to be updated at the persistence layer.
   */
  get shouldUpdate(): boolean;
  /**
   * Returns true when this entity needs to be deleted from the persistence layer.
   */
  get shouldDelete(): boolean;
  /**
   * Returns true when this entity needs to be sync-ed with the persistence layer.
   */
  get shouldCommit(): boolean;
  /**
   * Entity's metadata (raw data used by plugins).
   */
  meta: Record<string, any>;
  /**
   * @constructor
   */
  constructor(data: T);
  /**
   * Flags this entity as persisted and returns itself.
   */
  commit(): this;
  /**
   * Flags this entity as to be deleted from the persistence layer.
   */
  delete(): this;
  /**
   * Updates entity's data without altering its status flags.
   */
  set(data: T): this;
  /**
   * Updates entity's data and flags It as not persisted anymore.
   */
  update(data: T): this;
  /**
   * Returns the raw entity's value.
   */
  valueOf(): T;
}

/**
 * Mutation commit mode.
 * - AUTO: Automatically commit all pending changes.
 * - SAFE: Throw when an entity contains uncommited changes.
 * - MANUAL: All entities must be manually commited.
 */
export declare type CommitMode = "AUTO" | "MANUAL" | "SAFE";

/**
 * Current mutation's intent.
 * - CREATE: This mutation was generated from the store#create method.
 * - FIND: This mutation was generated from the store#find method.
 * - READ: This mutation was generated from the store#read method.
 * - FILTER: This mutation was generated from the store#filter method.
 * - FROM: This mutation was generated from the store#from method.
 */
export declare type Intent = "CREATE" | "FIND" | "READ" | "FILTER" | "FROM";

/**
 * Adapter write mode.
 * - AUTO: Choose the appropriate write mode from the current context.
 * - SEQUENTIAL: Sequential write (uses #create, #update, and #delete methods).
 * - BULK: Force bulk write (uses #bulk method). Use "writeSize" option to configure how entities should be handled.
 * - CONCURRENT: Send multiple writes concurrently (uses #create, #update, and #delete methods). Use "writeSize" option to configure how many writes.
 */
export declare type WriteMode = "AUTO" | "BULK" | "CONCURRENT" | "SEQUENTIAL";

/**
 * Mutation context.
 */
export interface Context<T, Q, O> {
  /**
   * Used adapter.
   */
  adapter: Adapter<T, Q, O>;
  /**
   * The argument that has generated this mutation (store's method argument).
   */
  argument: Q | One<T> | Many<T>;
  /**
   * Current commit mode.
   */
  commitMode: CommitMode;
  /**
   * The intent that has generated this mutation (store method name).
   */
  intent: Intent;
  /**
   * True when multiple entities can be retrieved.
   */
  multiple: boolean;
  /**
   * Adapter's options.
   */
  options: Partial<O>;
  /**
   * Store's name.
   */
  store: string;
  /**
   * Store write mode.
   */
  writeMode: WriteMode;
  /**
   * Store write size.
   */
  writeSize: number;
}

/**
 * Sync hook containing the adapter's query.
 */
export declare type QueryHook<T, Q, O> = (
  query: Q,
  context: Context<T, Q, O>
) => any;

/**
 * Hook containing the currently processed entity instance.
 */
export declare type EntityHook<T, Q, O> = (
  entity: Entity<T>,
  context: Context<T, Q, O>
) => any;

/**
 * Abstract persistence layer adapter.
 */
export interface Adapter<T, Q, O> {
  /**
   * Retrieves one entity from the database that matches the query. It can be synchronous or asynchronous (Promise).
   * @param {*} query Adapter-specific filter query.
   * @param {Object} options Adapter-specific options.
   */
  find?(query: Q, options: Partial<O>): Result<T | Nullish>;
  /**
   * Retrieves all entities from the database that match the query. Must return an iterable (or async iterable) object.
   * @param {*} query Adapter-specific filter query.
   * @param {Object} options Adapter-specific options.
   */
  filter?(query: Q, options: Partial<O>): Iterable<T> | AsyncIterable<T>;
  /**
   * Creates a new entity inside the database. It can return the just-created entity data. Both sync and async (Promise) methods are supported.
   * @param {*} data Entity data to insert.
   * @param {Object} options Adapter-specific options.
   */
  create?(data: T, options: Partial<O>): Result<T | Nullish>;
  /**
   * Updates an existing entity inside the database. It can return the just-updated entity data. Both sync and async (Promise) methods are supported.
   * @param {*} oldData Original entity data retrieved from the database.
   * @param {*} newData Updated entity data after all actions are applied.
   * @param {Object} options Adapter-specific options.
   */
  update?(oldData: T, newData: T, options: Partial<O>): Result<T | Nullish>;
  /**
   * It removes an existing entity inside from its database. Both sync and async (Promise) methods are supported.
   * @param {*} data Original entity data retrieved from the database.
   * @param {Object} options Adapter-specific options.
   */
  delete?(data: T, options: Partial<O>): any;
  /**
   * It performs a collection of write actions against the database.
   * @param {Object[]} actions
   * @param {Object} options Adapter-specific options.
   */
  bulk?(
    actions: Array<BulkAction<T>>,
    options: Partial<O>
  ): Result<Record<number, T> | Record<string, T> | Nullish>;
}

/**
 * Bulk action descriptor.
 */
export declare type BulkAction<T> =
  | BulkActionCreate<T>
  | BulkActionUpdate<T>
  | BulkActionDelete<T>;

/**
 * Represents an entity creation intent.
 */
export interface BulkActionCreate<T> {
  /**
   * Bulk action type.
   */
  type: "CREATE";
  /**
   * Raw data to create.
   */
  data: T;
}

/**
 * Represents an entity-update intent.
 */
export interface BulkActionUpdate<T> {
  /**
   * Bulk action type.
   */
  type: "UPDATE";
  /**
   * Original entity data retrieved from the database.
   */
  oldData: T;
  /**
   * Updated entity data after all actions are applied.
   */
  newData: T;
}

/**
 * Represents an entity deletion intent.
 */
export interface BulkActionDelete<T> {
  /**
   * Bulk action type.
   */
  type: "DELETE";
  /**
   * Original entity data retrieved from the database.
   */
  data: T;
}

export interface PluginOptions<T, Q, O> {
  /**
   * Default commit mode.
   * @default "AUTO"
   */
  commitMode?: CommitMode;
  /**
   * Event hooks.
   */
  hooks?: {
    /**
     * Triggered when a single entity is fetched from the persistence layer.
     */
    onFind?: OneOrMore<QueryHook<T, Q, O>>;
    /**
     * Triggered when multiple entities are fetched from the persistence layer.
     */
    onFilter?: OneOrMore<QueryHook<T, Q, O>>;
    /**
     * Triggered when an entity is ready to be processed by the mutation.
     */
    onEntity?: OneOrMore<EntityHook<T, Q, O>>;
    /**
     * Triggered before any entity creation.
     */
    beforeCreate?: OneOrMore<EntityHook<T, Q, O>>;
    /**
     * Triggered before any entity update.
     */
    beforeUpdate?: OneOrMore<EntityHook<T, Q, O>>;
    /**
     * Triggered before any entity deletion.
     */
    beforeDelete?: OneOrMore<EntityHook<T, Q, O>>;
    /**
     * Triggered after any entity creation.
     */
    afterCreate?: OneOrMore<EntityHook<T, Q, O>>;
    /**
     * Triggered after any entity update.
     */
    afterUpdate?: OneOrMore<EntityHook<T, Q, O>>;
    /**
     * Triggered after any entity deletion.
     */
    afterDelete?: OneOrMore<EntityHook<T, Q, O>>;
  };
  /**
   * Custom mutators.
   */
  mutators?: Array<Mutator<T>>;
  /**
   * Default write mode.
   * @default "AUTO"
   */
  writeMode?: WriteMode;
  /**
   * Default write size (used by bulk or concurrent write modes).
   * @default 16
   */
  writeSize?: number;
}

/**
 * Mutation's unwrap options.
 */
export declare type UnwrapOptions<T, Q, O> = Partial<O> & {
  mutent?: PluginOptions<T, Q, O>;
};

/**
 * A function that takes a entity (async) iterable as input, and returns a new entity (async) iterable.
 */
export declare type Mutator<T> = (
  iterable: AsyncIterable<Entity<T>>,
  context: Context<T, unknown, unknown>
) => AsyncIterable<Entity<T>>;

export interface Mutation<T, Q, O, U = unknown> {
  /**
   * Runs Object.assign() against all entities.
   * @param objects
   */
  assign(...objects: Array<Partial<T>>): Mutation<T, Q, O, U>;
  /**
   * Commits (writes) all necessary entities.
   */
  commit(): Mutation<T, Q, O, U>;
  /**
   * Applies configured mutators to the targeted entities and returns a Promise that will resolve to the number of handled entities.
   */
  consume(options?: UnwrapOptions<T, Q, O>): Promise<number>;
  /**
   * Deletes all entities.
   */
  delete(): Mutation<T, Q, O, U>;
  /**
   * Ignores the entities that don't satisfy the predicate.
   * @param predicate A function that accepts the current entity and its index. If it returns true, the current entity is kept.
   */
  filter(predicate: (data: T, index: number) => boolean): Mutation<T, Q, O, U>;
  /**
   * Applies a mutator conditionally.
   * @param condition Can be a boolean or a function that accepts the current entity.
   * @param whenTrue Mutator applied when the condition is satisfied.
   * @param whenFalse Mutator applied when the condition is not satisfied.
   */
  if(
    condition: Lazy<boolean, T>,
    whenTrue: Mutator<T>,
    whenFalse?: Mutator<T>
  ): Mutation<T, Q, O, U>;
  /**
   * Applies configured mutators to the targeted entities and returns an entities (async) iterable.
   * @param options Adapter specific options.
   */
  iterate(options?: UnwrapOptions<T, Q, O>): AsyncIterable<T>;
  /**
   * Adds mutators to the current ones and returns a new Mutation instance.
   * @param mutators Mutators chain.
   */
  pipe(...mutators: Array<Mutator<T>>): Mutation<T, Q, O, U>;
  /**
   * Performs a side-effect against all entities.
   * @param callback A function that accepts the current entity and its index. Promises are supported.
   */
  tap(callback: (data: T, index: number) => any): Mutation<T, Q, O, U>;
  /**
   * Applies configured mutators to the targeted entities and returns a Promise containing the result.
   * @param options Adapter specific options.
   */
  unwrap(options?: UnwrapOptions<T, Q, O>): Promise<U>;
  /**
   * Updates entities.
   * @param mapper A function that accepts the current entity and its index. Must return a new object representing the updated entity. Promises are supported.
   */
  update(mapper: (data: T, index: number) => Result<T>): Mutation<T, Q, O, U>;
}

/**
 * This mutations's unwrap may result in an entity.
 */
export declare type MutationNullable<T, Q, O> = Mutation<T, Q, O, T | null>;

/**
 * This mutation's unwrap will always result in an entity.
 */
export declare type MutationSingle<T, Q, O> = Mutation<T, Q, O, T>;

/**
 * This mutation's unwrap will result in an array of entities.
 */
export declare type MutationMultiple<T, Q, O> = Mutation<T, Q, O, T[]>;

/**
 * Single entity value definition. Can be lazy and/or async.
 */
export declare type One<T> = Lazy<T | Promise<T>>;

/**
 * Many entities' values definition. Have to be and iterable. Can be lazy and async.
 */
export declare type Many<T> = Iterable<T> | AsyncIterable<T>;

/**
 * Store's constructor options.
 */
export interface StoreOptions<T, Q, O> extends PluginOptions<T, Q, O> {
  /**
   * Adapter definition.
   */
  adapter: Adapter<T, Q, O>;
  /**
   * Store's name.
   */
  name?: string;
  /**
   * Plugins to apply to this store.
   */
  plugins?: Array<PluginOptions<T, Q, O>>;
}

export declare class Store<T, Q, O> {
  /**
   * @constructor
   */
  constructor(options: StoreOptions<T, Q, O>);
  /**
   * Declares one or many new entities.
   */
  public create(one: One<T>): MutationSingle<T, Q, O>;
  public create(many: Many<T>): MutationMultiple<T, Q, O>;
  /**
   * Declares one entity that matches the query and could exist.
   */
  public find(query: Q): MutationNullable<T, Q, O>;
  /**
   * Declares one required entity that matches the query.
   */
  public read(query: Q): MutationSingle<T, Q, O>;
  /**
   * Declares many existing entities that match the query.
   */
  public filter(query: Q): MutationMultiple<T, Q, O>;
  /**
   * Declares one or many existing entities.
   */
  public from(one: One<T>): MutationSingle<T, Q, O>;
  public from(many: Many<T>): MutationMultiple<T, Q, O>;
  /**
   * Register a plugin.
   */
  public register(plugin: PluginOptions<T, Q, O>): this;
}

/**
 * Runs Object.assign() against all entities.
 * @param objects
 */
export declare function assign<T>(...objects: Array<Partial<T>>): Mutator<T>;

/**
 * Commits (writes) all necessary entities.
 */
export declare function commit(): Mutator<any>;

/**
 * Deletes all entities.
 */
export declare function ddelete(): Mutator<any>;

/**
 * Ignores the entities that don't satisfy the predicate.
 * @param predicate A function that accepts the current entity and its index. If it returns true, the current entity is kept.
 */
export declare function filter<T>(
  predicate: (data: T, index: number) => boolean
): Mutator<T>;

/**
 * Applies a mutator conditionally.
 * @param condition Can be a boolean or a function that accepts the current entity.
 * @param whenTrue Mutator applied when the condition is satisfied.
 * @param whenFalse Mutator applied when the condition is not satisfied.
 */
export declare function iif<T>(
  condition: Lazy<boolean, T>,
  whenTrue: Mutator<T>,
  whenFalse?: Mutator<T>
): Mutator<T>;

/**
 * Reduces multiple mutators into a single one.
 * @param mutators Mutators chain to reduce.
 */
export declare function pipe<T>(...mutators: Array<Mutator<T>>): Mutator<T>;

/**
 * Performs a side-effect against all entities.
 * @param callback A function that accepts the current entity and its index. Promises are supported.
 */
export declare function tap<T>(
  callback: (data: T, index: number) => any
): Mutator<T>;

/**
 * Updates entities.
 * @param mapper A function that accepts the current entity and its index. Must return a new object representing the updated entity. Promises are supported.
 */
export declare function update<T>(
  mapper: (data: T, index: number) => Result<T>
): Mutator<T>;
