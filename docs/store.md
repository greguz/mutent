# Store

## API

### `new Store(options)`

Creates a new Store instance.

- `options` `<Object>`
  - `adapter` [`<Adapter>`](./adapter.md) The Adapter object that integrates a particular Datastore. See Adapter [docs](./adapter.md) for more info.
  - `[commitMode]` `<string>` This options defines how the Entities need to be committed. Can be `"AUTO"`, `"MANUAL"`, or `"SAFE"`. Defaults to `"AUTO"`. See Commit Mode [docs](#commit-mode) for more info.
  - `[hooks]` [`<Hooks>`](./hooks.md) A set of hooks for some Mutent's internal events. See Hooks [docs](./hooks.md) for more info.
  - `[mutators]` [`<Mutator[]>`](./mutator.md) See Mutator [docs](./mutator.md) for more info.
  - `[plugins]` [`<Plugin[]>`](#plugin) See Plugin [docs](#plugin) for more info.
  - `[writeMode]` `<string>` Can be `"AUTO"`, `"SEQUENTIAL"`, `"BULK"`, or `"CONCURRENT"`. Defaults to `"AUTO"`. See Write Mode [docs](#write-mode) for more info.
  - `[writeSize]` `<number>` Positive integer. Defaults to `16`.

```javascript
import { Store } from 'mutent'

const store = new Store({
  adapter: new MyAdapter(),
  commitMode: 'AUTO',
  hooks: {},
  mutators: [],
  plugins: [],
  writeMode: 'AUTO',
  writeSize: 16
})
```

### `Store::create(data)`

Creates a [Mutation](./mutation.md) with a `"CREATE"` Intent.

- `data` `<Object>` | `<Iterable>` | `<AsyncIterable>`
- Returns: [`<Mutation>`](./mutation.md)

### `Store::find(query)`

Creates a [Mutation](./mutation.md) with a `"FIND"` Intent.

- `query` `<*>`
- Returns: [`<Mutation>`](./mutation.md)

### `Store::filter(query)`

Creates a [Mutation](./mutation.md) with a `"FILTER"` Intent.

- `query` `<*>`
- Returns: [`<Mutation>`](./mutation.md)

### `Store::read(query)`

Creates a [Mutation](./mutation.md) with a `"READ"` Intent.

- `query` `<*>`
- Returns: [`<Mutation>`](./mutation.md)

### `Store::from(source)`

Creates a [Mutation](./mutation.md) with a `"FROM"` Intent. Source Entities are treated as the actual data representation inside the Datastore.

- `source` `<Object>` | `<Iterable>` | `<AsyncIterable>`
- Returns: [`<Mutation>`](./mutation.md)

### `Store::register(plugin)`

Registers a plugin. This method will change its Store instance.

- `plugin` [`<Plugin>`](#plugin) Plugin options object.
- Returns: `<Store>`

## Commit Mode

Committing is the action that write any Entity change to its Datastore.

Committing can be configured as:
- `AUTO`: Automatically commit all Entities when required (at least one change was performed).
- `MANUAL`: Commits must be manually declared with the [Mutation](./mutation.md#mutationcommit)'s `commit` method.
- `SAFE`: Commits are still manual, but throw an [error](./errors.md#emut_unsafe_unwrap) when an Entity that was updated is not commited.

## Write Mode

The Write Mode controls how write actions are performed by the Adapter.

- `SEQUENTIAL`: All writes are done sequentially, following the Entities order.
- `BULK`: Expicitly use only the Adapter's `bulk` method.
- `CONCURRENT`: Multiple writes can be done concurrently. The `writeSize` option controls how many concurrent writes are possibile.
- `AUTO`: Automatically choose the best write mode possible at runtime.

## Plugin

A plugin is simply a set (object) of Store's options that can be applied to the current Store.

- `plugin` `<Object>`
  - `[commitMode]` `<String>` Can be `"AUTO"`, `"MANUAL"`, or `"SAFE"`.
  - `[hooks]` `<Hooks>`
  - `[mutators]` `<Mutator[]>`
  - `[writeMode]` `<String>` Can be `"AUTO"`, `"SEQUENTIAL"`, `"BULK"`, or `"CONCURRENT"`.
  - `[writeSize]` `<Number>` Must be a positive integer.
