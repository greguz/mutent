/**
 * Lazy value definition with optional argument.
 */
export type Lazy<T> = T | (() => T);

/**
 * A nullish value (plus "void" because TS is a special baby).
 */
export type Nullish = null | undefined | void;

/**
 * Sync or async iterable. Arrays are iterables.
 */
export type Many<T> = Iterable<T> | AsyncIterable<T>;

/**
 * The value itself or wrapped around a `Promise`.
 */
export type One<T> = T | Promise<T>;

/**
 * Make a type nullish-able (void is also nullish).
 */
export type Maybe<T> = T | Nullish;

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

export interface EntityMeta {
  /**
   * Adapters could set this flag to `true` if there was a lost update/delete on this Entity.
   */
  orphan?: any;
  /**
   * Other extensions.
   */
  [key: string]: any;
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
  meta: EntityMeta;
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
export type CommitMode = "AUTO" | "MANUAL" | "SAFE";

/**
 * Current mutation's intent.
 * - CREATE: This mutation was generated from the store#create method.
 * - FIND: This mutation was generated from the store#find method.
 * - READ: This mutation was generated from the store#read method.
 * - FILTER: This mutation was generated from the store#filter method.
 * - FROM: This mutation was generated from the store#from method.
 */
export type Intent = "CREATE" | "FIND" | "READ" | "FILTER" | "FROM";

/**
 * Adapter write mode.
 * - AUTO: Choose the appropriate write mode from the current context.
 * - SEQUENTIAL: Sequential write (uses #create, #update, and #delete methods).
 * - BULK: Force bulk write (uses #bulk method). Use "writeSize" option to configure how entities should be handled.
 * - CONCURRENT: Send multiple writes concurrently (uses #create, #update, and #delete methods). Use "writeSize" option to configure how many writes.
 */
export type WriteMode = "AUTO" | "BULK" | "CONCURRENT" | "SEQUENTIAL";

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
  argument: G["query"] | Lazy<One<Maybe<G["entity"]>>> | Many<G["entity"]>;
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
export type QueryHook<G extends Generics> = (
  query: G["query"] | undefined,
  ctx: Context<G>
) => any;

/**
 * Hook containing the currently processed entity instance. Promises are supported.
 */
export type EntityHook<G extends Generics> = (
  entity: Entity<G["entity"]>,
  ctx: Context<G>
) => any;

/**
 * Array of items or record where the keys are indexes.
 */
export type ArrayLike<T> = T[] | Record<string, T>;

/**
 * Abstract datastore adapter.
 */
export interface Adapter<G extends Generics> {
  /**
   * Lower-level Adapter's representation.
   */
  readonly raw: G["adapter"];
  /**
   * Find the first Entity matching the requested query.
   * Can return a `Promise`.
   *
   * This method is the simplified version of `findEntity` method.
   */
  find?(
    query: G["query"] | undefined,
    options: UnwrapOptions<G>
  ): One<Maybe<G["entity"]>>;
  /**
   * Find the Entities matching the requested query.
   * Must return an interable or an async iterable.
   *
   * This method is the simplified version of `filterEntities` method.
   */
  filter?(
    query: G["query"] | undefined,
    options: UnwrapOptions<G>
  ): Many<G["entity"]>;
  /**
   * Persists a new Entity inside the datastore.
   * Can optionally return a new version of the Entity if the datastore adds other info (like an identifier).
   * Promises are also supported.
   */
  create?(
    data: G["entity"],
    options: UnwrapOptions<G>
  ): One<Maybe<G["entity"]>>;
  /**
   *
   */
  update?(
    oldData: G["entity"],
    newData: G["entity"],
    options: UnwrapOptions<G>
  ): One<Maybe<G["entity"]>>;
  /**
   *
   */
  delete?(data: G["entity"], options: UnwrapOptions<G>): any;
  /**
   *
   */
  bulk?(
    actions: Array<BulkAction<G["entity"]>>,
    options: UnwrapOptions<G>
  ): One<Maybe<ArrayLike<G["entity"]>>>;
  /**
   *
   */
  findEntity?(
    query: G["query"] | undefined,
    ctx: Context<G>
  ): One<Maybe<G["entity"]>>;
  /**
   *
   */
  filterEntities?(
    query: G["query"] | undefined,
    ctx: Context<G>
  ): Many<G["entity"]>;
  /**
   *
   */
  createEntity?(entity: Entity<G["entity"]>, ctx: Context<G>): any;
  /**
   *
   */
  updateEntity?(entity: Entity<G["entity"]>, ctx: Context<G>): any;
  /**
   *
   */
  deleteEntity?(entity: Entity<G["entity"]>, ctx: Context<G>): any;
  /**
   *
   */
  bulkEntities?(entities: Array<Entity<G["entity"]>>, ctx: Context<G>): any;
}

/**
 * Bulk action descriptor.
 */
export type BulkAction<T> =
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

/**
 * Value or array of values.
 */
export type Values<T> = T | T[];

export interface MutentOptions<G extends Generics> {
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
    onFind?: Values<QueryHook<G>>;
    /**
     * Triggered when multiple entities are fetched from the datastore.
     */
    onFilter?: Values<QueryHook<G>>;
    /**
     * Triggered when an entity is ready to be processed by the mutation.
     */
    onEntity?: Values<EntityHook<G>>;
    /**
     * Triggered before any entity creation.
     */
    beforeCreate?: Values<EntityHook<G>>;
    /**
     * Triggered before any entity update.
     */
    beforeUpdate?: Values<EntityHook<G>>;
    /**
     * Triggered before any entity deletion.
     */
    beforeDelete?: Values<EntityHook<G>>;
    /**
     * Triggered after any entity creation.
     */
    afterCreate?: Values<EntityHook<G>>;
    /**
     * Triggered after any entity update.
     */
    afterUpdate?: Values<EntityHook<G>>;
    /**
     * Triggered after any entity deletion.
     */
    afterDelete?: Values<EntityHook<G>>;
  };
  /**
   * Mutators applied before anything else.
   */
  mutators?: Array<Mutator<G>>;
  /**
   * Mutators applied after the full mutation chain is defined.
   */
  handlers?: Array<Mutator<G>>;
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
export type UnwrapOptions<G extends Generics> = Partial<G["options"]> & {
  /**
   * Override Store's options.
   */
  mutent?: MutentOptions<G>;
};

/**
 * A function that takes a entity (async) iterable as input, and returns a new entity (async) iterable.
 */
export type Mutator<G extends Generics> = (
  iterable: AsyncIterable<Entity<G["entity"]>>,
  ctx: Context<G>
) => AsyncIterable<Entity<G["entity"]>>;

export interface Mutation<G extends Generics, U = unknown> {
  /**
   * Change the behavior of `.pipe` method.
   * If `true`, the Mutation will change at any mutator applied.
   */
  mutable: boolean;
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
  delete(
    predicate?: (data: G["entity"], index: number) => any
  ): Mutation<G, U>;
  /**
   * Creates an entity with this data if there are no other matches.
   */
  ensure(one: Lazy<One<G["entity"]>>): Mutation<G, U>;
  /**
   * Ignores the entities that don't satisfy the predicate.
   * @param predicate A function that accepts the current entity and its index. If it returns true, the current entity is kept.
   */
  filter(
    predicate: (data: G["entity"], index: number) => any
  ): Mutation<G, U>;
  /**
   * Applies configured mutators to the targeted entities and returns an entities (async) iterable.
   * @param options Adapter specific options.
   */
  iterate(options?: UnwrapOptions<G>): AsyncIterable<G["entity"]>;
  /**
   * Limit the total number of returned documents.
   */
  limit(n: number): Mutation<G, U>;
  /**
   * Adds mutators to the current ones and returns a new Mutation instance.
   * @param mutators Mutators chain.
   */
  pipe(...mutators: Array<Mutator<G>>): Mutation<G, U>;
  /**
   * Skip (ignore) the first N documents.
   */
  skip(n: number): Mutation<G, U>;
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
    mapper: (data: G["entity"], index: number) => One<Maybe<G["entity"]>>
  ): Mutation<G, U>;
}

/**
 * This mutations's unwrap may result in an entity.
 */
export type MutationNullable<G extends Generics> = Mutation<
  G,
  G["entity"] | null
>;

/**
 * This mutation's unwrap will always result in an entity.
 */
export type MutationSingle<G extends Generics> = Mutation<G, G["entity"]>;

/**
 * This mutation's unwrap will result in an array of entities.
 */
export type MutationMultiple<G extends Generics> = Mutation<
  G,
  Array<G["entity"]>
>;

/**
 * Store's constructor options.
 */
export interface StoreOptions<G extends Generics> extends MutentOptions<G> {
  /**
   * Adapter definition.
   */
  adapter: Adapter<G>;
  /**
   * Make all Mutations mutable.
   */
  mutable?: boolean;
  /**
   * Plugins to apply to this store.
   */
  plugins?: Array<MutentOptions<G>>;
}

export declare class Store<G extends Generics> implements StoreOptions<G> {
  adapter: Adapter<G>;
  commitMode: CommitMode;
  handlers: Array<Mutator<G>>;
  hooks: Hooks<G>;
  mutable: boolean;
  mutators: Array<Mutator<G>>;
  writeMode: WriteMode;
  writeSize: number;
  /**
   * Getter pointing to Adapter's `raw` property.
   */
  get raw(): G["adapter"];
  /**
   * @constructor
   */
  constructor(options: StoreOptions<G>);
  /**
   * Declares one or many new entities.
   */
  create(many: Many<G["entity"]>): MutationMultiple<G>;
  create(one: Lazy<One<G["entity"]>>): MutationSingle<G>;
  create(oneMaybe: Lazy<One<Maybe<G["entity"]>>>): MutationNullable<G>;
  /**
   * Declares one entity that matches the query and could exist.
   */
  find(query?: G["query"]): MutationNullable<G>;
  /**
   * Declares one required entity that matches the query.
   */
  read(query?: G["query"]): MutationSingle<G>;
  /**
   * Declares many existing entities that match the query.
   */
  filter(query?: G["query"]): MutationMultiple<G>;
  /**
   * Declares one or many existing entities.
   */
  from(many: Many<G["entity"]>): MutationMultiple<G>;
  from(one: Lazy<One<G["entity"]>>): MutationSingle<G>;
  from(oneMaybe: Lazy<One<Maybe<G["entity"]>>>): MutationNullable<G>;
  /**
   * Merge current options with new options.
   */
  register(plugin: MutentOptions<G>): this;
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
export declare function ddelete<G extends Generics>(
  predicate: (data: G["entity"], index: number) => any
): Mutator<G>;

/**
 * Ignores the entities that don't satisfy the predicate.
 * @param predicate A function that accepts the current entity and its index. If it returns true, the current entity is kept.
 */
export declare function filter<G extends Generics>(
  predicate: (data: G["entity"], index: number) => any
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
  mapper: (data: G["entity"], index: number) => One<Maybe<G["entity"]>>
): Mutator<G>;

/**
 * Creates an entity with this data if there are no other matches.
 */
export declare function ensure<G extends Generics>(
  one: Lazy<One<G["entity"]>>
): Mutator<G>;

/**
 * Get internal Adapter's name, otherwise returns `"Unknown Adapter"`.
 */
export declare function getAdapterName(obj: unknown): string;

/**
 * Returns a mutator that limits the total amount of documents returned by the Mutation.
 */
export declare function limit(n: number): Mutator<any>;

/**
 * Returns a mutator that skip the first `n` found documents.
 */
export declare function skip(n: number): Mutator<any>;
