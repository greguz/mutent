# Mutation

A Mutation holds a pointer to some [Entities](./entity.md). It exposes a set of functions to manipulate those Entities.

There are two types of methods:
- Methods that use `this.pipe(...)` internally to apply one or more [Mutators](./mutator.md)
- Methods that run the whole chain of mutators and return a result

The methods `upwrap`, `consume`, and `iterate` start described chain of mutations and return the result of the operation in some format. Any other method is fully synchronous and does **not** write any change to the Datastore until one of the previous three methods are called.

The `Mutation` class is constructed internally. The usage outside Mutent's scope is not supported.

## API

### `Mutation::assign(...objects)`

Pipes a Mutator that does `Object.assign(entityData, ...objects)` to any Entity that receives.

- `...objects` `<Object[]>`
- Returns: `<Mutation>`

### `Mutation::commit()`

Explicitly tells Mutent to commit (write) all changes (up to this point) to the Datastore.

- Returns: `<Mutation>`

### `Mutation::delete()`

Flags the Entities for the deletion.

- Returns: `<Mutation>`

### `Mutation::filter(predicate)`

Filters out some Entities the does not match the `predicate` function.

- `predicate` `<Function>`
  - `data` `<*>` Current Entity's data.
  - `index` `<number>`
  - Returns: `<boolean>`
- Returns: `<Mutation>`

### `Mutation::pipe(...mutators)`

Attaches Mutators to the current Mutators chain.

- `...mutators` [`<Mutator[]>`](./mutator.md)
- Returns: `<Mutation>`

### `Mutation::tap(callback)`

Attach a callback function inside the Mutation chain. Can be `async`.

- `callback` `<Function>`
  - `data` `<*>` Current Entity's data.
  - `index` `<number>`
  - Returns: `<*>`
- Returns: `<Mutation>`

### `Mutation::update(mapper)`

Map the Entities. Entities' data are treated as immutables, so to actually perform the update, the returned value must be different from the source value.

- `mapper` `<Function>`
  - `data` `<*>` Current Entity's data.
  - `index` `<number>`
  - Returns: `<*>`
- Returns: `<Mutation>`

### `Mutation::iterate([options])`

Returns an `AsyncIterable` that will `yield` all matching Entities after all updated are applied.

- `[options]` `<Object>` Datastore-specific options object.
- Returns: `<AsyncIterable>`

### `Mutation::consume([options])`

Performs all described actions and returns a `Promise` that will resolve to the number of Entities that was handled by the Mutation.

- `[options]` `<Object>` Datastore-specific options object.
- Returns: `<Promise>`

### `Mutation::unwrap([options])`

Performs all described actions and returns a `Promise` that will resolve to the final version of the Entities that was handled by the Mutation.

- `[options]` `<Object>` Datastore-specific options object.
- Returns: `<Promise>`
