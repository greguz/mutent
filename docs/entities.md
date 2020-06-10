# Entities

Represents a collection of entities.

## update(mutator, ...arguments)

Describes a mutation to apply to all processed entities.

- `mutator` `<Function>`
- `...arguments` `<*>`
- Returns: `<Entities>`

A `mutator` is a function that always accepts the entity's data as the first argument. It **must** return a new object that represents the fully updated entity.

**WARNING**: Inside a mutator, It's **not** safe to direct update the entity's data. You should always return a new object as mutation result.

## assign(data)

Mimics the `Object.assign` method by extending the entity's data with the passed argument.

- `data` `<Object>`
- Returns: `<Entities>`

## delete()

Schedules all entities' deletion.

- Returns: `<Entities>`

## commit()

Schedules a synchronization between the current entity's data and its data source. The entity might be created, updated, or deleted. More informations [here](commit.md).

- Returns: `<Entities>`

## run(routine, ...args)

Requires the execution of a routine.

- `routine` `<String>`
- `...args` `<*>`
- Returns: `<Entities>`

## undo([steps])

Undoes one or more defined actions. `Infinity` is accepted and, if provided, will invalidate all possible actions.

- `steps` `<Number>`
- Returns: `<Entities>`

## redo([steps])

In the case of undid actions, this method reapplies the last reverted actions by the `undo` method. `Infinity` is accepted and, if provided, will reapply all reverted actions.

- `steps` `<Number>`
- Returns: `<Entities>`

## unwrap([options])

Runs all described actions and exposes the resulting entities' array through a `Promise`.

- `options` `<Object>`
  - `autoCommit` `<Boolean>`
  - `safe` `<Boolean>`
- Returns: `<Promise>`

## stream([options])

Runs all described actions and exposes the resulting entities' array through a Readable stream.

- `options` `<Object>`
  - `autoCommit` `<Boolean>`
  - `highWaterMark` `<Number>`
  - `safe` `<Boolean>`
- Returns: `<Readable>`
