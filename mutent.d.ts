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
   * Error's code.
   */
  code: string;
  /**
   * Error extended info.
   */
  info: any;
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
   * Declares a new entity that should be created inside the datastore.
   */
  static create<X>(data: X): Entity<X>;
  /**
   * Declares an entity that is already persisted.
   */
  static read<X>(data: X): Entity<X>;
  /**
   * Contains the entity's data fetched from the datastore. A null value indicates that this entity is new.
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
   * Returns true when this entity needs to be created inside the datastore.
   */
  get shouldCreate(): boolean;
  /**
   * Returns true when this entity needs to be updated at the datastore.
   */
  get shouldUpdate(): boolean;
  /**
   * Returns true when this entity needs to be deleted from the datastore.
   */
  get shouldDelete(): boolean;
  /**
   * Returns true when this entity needs to be sync-ed with the datastore.
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
   * Flags this entity as to be deleted from the datastore.
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
 * Interface that contains all generics declared by the user.
 */
export interface Generics {
  adapter?: unknown;
  entity?: unknown;
  query?: unknown;
  options?: unknown;
}

export interface Hooks<G extends Generics> {
  onFind: Array<QueryHook<G>>;
  onFilter: Array<QueryHook<G>>;
  onEntity: Array<EntityHook<G>>;
  beforeCreate: Array<EntityHook<G>>;
  beforeUpdate: Array<EntityHook<G>>;
  beforeDelete: Array<EntityHook<G>>;
  afterCreate: Array<EntityHook<G>>;
  afterUpdate: Array<EntityHook<G>>;
  afterDelete: Array<EntityHook<G>>;
}

/**
 * Mutation context.
 */
export interface Context<G extends Generics> {
  /**
   * Used adapter.
   */
  adapter: Adapter<G>;
  /**
   * The argument that has generated this mutation (store's method argument).
   */
  argument: G["query"] | One<G["entity"]> | Many<G["entity"]>;
  /**
   * Current commit mode.
   */
  commitMode: CommitMode;
  /**
   * Normalized hooks collection.
   */
  hooks: Hooks<G>;
  /**
   * The intent that has generated this mutation (store method name).
   */
  intent: Intent;
  /**
   * True when multiple entities can be retrieved.
   */
  multiple: boolean;
  /**
   * An opaque value for the current execution.
   */
  opaque?: unknown;
  /**
   * Adapter's options.
   */
  options: UnwrapOptions<G>;
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
 * Hook containing the adapter's query. Promises are supported.
 */
export declare type QueryHook<G extends Generics> = (
  query: G["query"],
  context: Context<G>
) => any;

/**
 * Hook containing the currently processed entity instance. Promises are supported.
 */
export declare type EntityHook<G extends Generics> = (
  entity: Entity<G["entity"]>,
  context: Context<G>
) => any;

/**
 * Abstract datastore adapter.
 */
export interface Adapter<G extends Generics> {
  /**
   * Retrieves one entity from the database that matches the query. It can be synchronous or asynchronous (Promise).
   * @param {*} query Adapter-specific filter query.
   * @param {Object} options Adapter-specific options.
   */
  find?(
    query: G["query"],
    options: Partial<G["options"]>
  ): Result<G["entity"] | Nullish>;
  /**
   * Retrieves all entities from the database that match the query. Must return an iterable (or async iterable) object.
   * @param {*} query Adapter-specific filter query.
   * @param {Object} options Adapter-specific options.
   */
  filter?(
    query: G["query"],
    options: Partial<G["options"]>
  ): Iterable<G["entity"]> | AsyncIterable<G["entity"]>;
  /**
   * Creates a new entity inside the database. It can return the just-created entity data. Both sync and async (Promise) methods are supported.
   * @param {*} data Entity data to insert.
   * @param {Object} options Adapter-specific options.
   */
  create?(
    data: G["entity"],
    options: Partial<G["options"]>
  ): Result<G["entity"] | Nullish>;
  /**
   * Updates an existing entity inside the database. It can return the just-updated entity data. Both sync and async (Promise) methods are supported.
   * @param {*} oldData Original entity data retrieved from the database.
   * @param {*} newData Updated entity data after all actions are applied.
   * @param {Object} options Adapter-specific options.
   */
  update?(
    oldData: G["entity"],
    newData: G["entity"],
    options: Partial<G["options"]>
  ): Result<G["entity"] | Nullish>;
  /**
   * It removes an existing entity inside from its database. Both sync and async (Promise) methods are supported.
   * @param {*} data Original entity data retrieved from the database.
   * @param {Object} options Adapter-specific options.
   */
  delete?(data: G["entity"], options: Partial<G["options"]>): any;
  /**
   * It performs a collection of write actions against the database.
   * @param {Object[]} actions
   * @param {Object} options Adapter-specific options.
   */
  bulk?(
    actions: Array<BulkAction<G["entity"]>>,
    options: Partial<G["options"]>
  ): Result<
    Record<number, G["entity"]> | Record<string, G["entity"]> | Nullish
  >;
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

export interface PluginOptions<G extends Generics> {
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
     * Triggered when a single entity is fetched from the datastore.
     */
    onFind?: OneOrMore<QueryHook<G>>;
    /**
     * Triggered when multiple entities are fetched from the datastore.
     */
    onFilter?: OneOrMore<QueryHook<G>>;
    /**
     * Triggered when an entity is ready to be processed by the mutation.
     */
    onEntity?: OneOrMore<EntityHook<G>>;
    /**
     * Triggered before any entity creation.
     */
    beforeCreate?: OneOrMore<EntityHook<G>>;
    /**
     * Triggered before any entity update.
     */
    beforeUpdate?: OneOrMore<EntityHook<G>>;
    /**
     * Triggered before any entity deletion.
     */
    beforeDelete?: OneOrMore<EntityHook<G>>;
    /**
     * Triggered after any entity creation.
     */
    afterCreate?: OneOrMore<EntityHook<G>>;
    /**
     * Triggered after any entity update.
     */
    afterUpdate?: OneOrMore<EntityHook<G>>;
    /**
     * Triggered after any entity deletion.
     */
    afterDelete?: OneOrMore<EntityHook<G>>;
  };
  /**
   * Custom mutators.
   */
  mutators?: Array<Mutator<G>>;
  /**
   * An opaque value for the current execution.
   */
  opaque?: unknown;
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
export declare type UnwrapOptions<G extends Generics> = Partial<
  G["options"]
> & {
  mutent?: PluginOptions<G>;
};

/**
 * A function that takes a entity (async) iterable as input, and returns a new entity (async) iterable.
 */
export declare type Mutator<G extends Generics> = (
  iterable: AsyncIterable<Entity<G["entity"]>>,
  context: Context<G>
) => AsyncIterable<Entity<G["entity"]>>;

export interface Mutation<G extends Generics, U = unknown> {
  /**
   * Runs Object.assign() against all entities.
   * @param objects
   */
  assign(...objects: Array<Partial<G["entity"]>>): Mutation<G, U>;
  /**
   * Commits (writes) all necessary entities.
   */
  commit(): Mutation<G, U>;
  /**
   * Applies configured mutators to the targeted entities and returns a Promise that will resolve to the number of handled entities.
   */
  consume(options?: UnwrapOptions<G>): Promise<number>;
  /**
   * Deletes all entities.
   */
  delete(): Mutation<G, U>;
  /**
   * Creates an entity with this data if there are no other matches.
   */
  ensure(one: One<G["entity"]>): Mutation<G, U>;
  /**
   * Ignores the entities that don't satisfy the predicate.
   * @param predicate A function that accepts the current entity and its index. If it returns true, the current entity is kept.
   */
  filter(
    predicate: (data: G["entity"], index: number) => Result<boolean>
  ): Mutation<G, U>;
  /**
   * Applies configured mutators to the targeted entities and returns an entities (async) iterable.
   * @param options Adapter specific options.
   */
  iterate(options?: UnwrapOptions<G>): AsyncIterable<G["entity"]>;
  /**
   * Adds mutators to the current ones and returns a new Mutation instance.
   * @param mutators Mutators chain.
   */
  pipe(...mutators: Array<Mutator<G>>): Mutation<G, U>;
  /**
   * Performs a side-effect against all entities.
   * @param callback A function that accepts the current entity and its index. Promises are supported.
   */
  tap(callback: (data: G["entity"], index: number) => any): Mutation<G, U>;
  /**
   * Applies configured mutators to the targeted entities and returns a Promise containing the result.
   * @param options Adapter specific options.
   */
  unwrap(options?: UnwrapOptions<G>): Promise<U>;
  /**
   * Updates entities.
   * @param mapper A function that accepts the current entity and its index. Must return a new object representing the updated entity. Promises are supported. A nullish result will skip the update.
   */
  update(
    mapper: (data: G["entity"], index: number) => Result<G["entity"] | Nullish>
  ): Mutation<G, U>;
}

/**
 * This mutations's unwrap may result in an entity.
 */
export declare type MutationNullable<G extends Generics> = Mutation<
  G,
  G["entity"] | null
>;

/**
 * This mutation's unwrap will always result in an entity.
 */
export declare type MutationSingle<G extends Generics> = Mutation<
  G,
  G["entity"]
>;

/**
 * This mutation's unwrap will result in an array of entities.
 */
export declare type MutationMultiple<G extends Generics> = Mutation<
  G,
  Array<G["entity"]>
>;

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
export interface StoreOptions<G extends Generics> extends PluginOptions<G> {
  /**
   * Adapter definition.
   */
  adapter: Adapter<G>;
  /**
   * Plugins to apply to this store.
   */
  plugins?: Array<PluginOptions<G>>;
}

export declare class Store<G extends Generics> {
  public adapter: G["adapter"];
  public commitMode: CommitMode;
  public hooks: Hooks<G>;
  public mutators: Mutator<G>;
  public writeMode: WriteMode;
  public writeSize: number;
  /**
   * @constructor
   */
  constructor(options: StoreOptions<G>);
  /**
   * Declares one or many new entities.
   */
  public create(one: One<G["entity"]>): MutationSingle<G>;
  public create(many: Many<G["entity"]>): MutationMultiple<G>;
  /**
   * Declares one entity that matches the query and could exist.
   */
  public find(query: G["query"]): MutationNullable<G>;
  /**
   * Declares one required entity that matches the query.
   */
  public read(query: G["query"]): MutationSingle<G>;
  /**
   * Declares many existing entities that match the query.
   */
  public filter(query: G["query"]): MutationMultiple<G>;
  /**
   * Declares one or many existing entities.
   */
  public from(one: One<G["entity"]>): MutationSingle<G>;
  public from(many: Many<G["entity"]>): MutationMultiple<G>;
  /**
   * Register a plugin.
   */
  public register(plugin: PluginOptions<G>): this;
}

/**
 * Runs Object.assign() against all entities.
 * @param objects
 */
export declare function assign<G extends Generics>(
  ...objects: Array<Partial<G["entity"]>>
): Mutator<G>;

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
export declare function filter<G extends Generics>(
  predicate: (data: G["entity"], index: number) => Result<boolean>
): Mutator<G>;

/**
 * Reduces multiple mutators into a single one.
 * @param mutators Mutators chain to reduce.
 */
export declare function pipe<G extends Generics>(
  ...mutators: Array<Mutator<G>>
): Mutator<G>;

/**
 * Performs a side-effect against all entities.
 * @param callback A function that accepts the current entity and its index. Promises are supported.
 */
export declare function tap<G extends Generics>(
  callback: (data: G["entity"], index: number) => any
): Mutator<G>;

/**
 * Updates entities.
 * @param mapper A function that accepts the current entity and its index. Must return a new object representing the updated entity. Promises are supported. A nullish result will skip the update.
 */
export declare function update<G extends Generics>(
  mapper: (data: G["entity"], index: number) => Result<G["entity"] | Nullish>
): Mutator<G>;

/**
 * Creates an entity with this data if there are no other matches.
 */
export declare function ensure<G extends Generics>(
  one: One<G["entity"]>
): Mutator<G>;

/**
 * Get internal Adapter's name, otherwise returns `"Unknown Adapter"`.
 */
export declare function getAdapterName(obj: any): string;
